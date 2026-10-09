"""Build TRIBE v2's FmriEncoderModel straight from config.yaml + best.ckpt (no text pipeline)."""
import os as _os; ROOT = _os.environ.get("PROJECT_ROOT", _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__))))
import yaml, torch
from exca import ConfDict
from tribev2.model import FmriEncoder

import os
W = os.environ.get("TRIBE_WEIGHTS", ROOT + "/weights")

def load():
    cfg = ConfDict(yaml.load(open(f"{W}/config.yaml"), Loader=yaml.UnsafeLoader))
    bmc = cfg["brain_model_config"]
    if not isinstance(bmc, FmriEncoder):
        bmc = FmriEncoder(**{k: v for k, v in dict(bmc).items() if k != "name"})
    # the public release ships only the shared 'unseen subject' layer (as TribeModel.from_pretrained sets)
    bmc.subject_layers.average_subjects = True
    bmc.subject_layers.n_subjects = 0
    ckpt = torch.load(f"{W}/best.ckpt", map_location="cpu", weights_only=True, mmap=True)
    args = ckpt["model_build_args"]
    sd = {k.removeprefix("model."): v for k, v in ckpt["state_dict"].items()}
    net = bmc.build(**args)
    net.load_state_dict(sd, strict=True, assign=True)
    net.eval()
    for p in net.parameters():
        p.requires_grad_(False)
    return net, args

def make_fwd(net):
    def fwd(x, subject_id=None, pool=True):
        if getattr(net, "temporal_smoothing", None) is not None:
            x = net.temporal_smoothing(x.transpose(1, 2)).transpose(1, 2)
        if not net.config.linear_baseline:
            x = net.transformer_forward(x, subject_id)
        x = x.transpose(1, 2)
        if net.config.low_rank_head is not None:
            x = net.low_rank_head(x.transpose(1, 2)).transpose(1, 2)
        x = net.predictor(x, subject_id)
        return net.pooler(x) if pool else x
    return fwd
