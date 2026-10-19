import json, base64, os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
R=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))); W=os.path.dirname(os.path.abspath(__file__))
b64=lambda p: base64.b64encode(open(p,'rb').read()).decode()
mesh=json.load(open(W+'/mesh.json')) if os.path.exists(W+'/mesh.json') else __import__('make_mesh').build()
figs={k:b64(f'{R}/figures/{k}.png') for k in ['fig_nonconvex','fig_sensitivity','fig_gain','fig_noise','fig_extent','fig_priors','fig_baseline']}
real=json.load(open(R+'/results/realdata_audio_text.json'))
run=None
if os.path.exists(R+'/results/demo_brain_run.json') and os.path.exists(R+'/results/demo_brain_maps.npz'):
    j=json.load(open(R+'/results/demo_brain_run.json')); z=np.load(R+'/results/demo_brain_maps.npz')
    t=z['target'].astype(np.float32); s=np.percentile(np.abs(t),99.5)
    q=lambda v: np.clip(np.round(v/s*127+128),0,255).astype(np.uint8)
    e=lambda a: base64.b64encode(a.tobytes()).decode()
    log=[{'step':l['step'],'cos':[round(c,4) for c in l['cos']],'mse':l['mse'],'pair':[round(c,4) for c in l['pair']]} for l in j['log']]
    run={'inits':j['inits'],'log':log,'barrier':j['barrier'],'steps':z['steps'].tolist(),'target':e(q(t)),
         'pred':[e(q(p.astype(np.float32))) for p in z['pred']],'r':[e(np.clip(np.round((r.astype(np.float32)+1)/2*255),0,255).astype(np.uint8)) for r in z['r']]}
VB=json.load(open(R+'/results/verification/testB.json'))['0']; VA=json.load(open(R+'/results/verification/testA.json'))['0']
import numpy as _np
_M=_np.array(VA['pairwise_all']); _I=list(VA['per_init'])
VD=json.load(open(R+'/results/verification/testD.json'))
pairs=[{'e':v['errors'],'c':float(_M[_I.index(k.split('|')[0]),_I.index(k.split('|')[1])])} for k,v in VB['path']['pairs'].items()]
for g in VD.values(): pairs+=[{'e':x['errors'],'c':x['cos']} for x in g['pairs'].values()]
barrier={'s':VB['path']['s'],'pairs':pairs,'toTruth':[VA['path_blind_to_truth']['errors']]+[g['path_blind_to_truth']['errors'] for g in VD.values()]}
DATA={'barrier':barrier,'mesh':mesh,'figs':figs,'real':real,'run':run,'qr':b64(R+'/poster/repo_qr_plain.png')}
toy=open(W+'/toy.js').read().replace('if (typeof module !== "undefined") module.exports =','window.Toy =')
page=open(W+'/page.html').read()
html=page+'\n<script>window.DATA='+json.dumps(DATA,separators=(',',':'))+';</script>\n<script>'+toy+'</script>\n<script>'+open(W+'/brain.js').read()+'</script>\n<script>'+open(W+'/app.js').read()+'</script>\n'
pass  # the hosted variant (no document skeleton) is not kept in the repo
# standalone offline copy with a full document skeleton
std='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'+html.replace('</style>','</style>\n</head><body>',1)+'</body></html>'
open(os.path.join(W,'..','TRIBE_live_demo_offline.html'),'w').write(std)
print('size MB', len(html)/1e6, 'run', run is not None)
