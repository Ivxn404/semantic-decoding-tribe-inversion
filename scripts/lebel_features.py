"""Stimulus representations x for LeBel 2023 stories through TRIBE v2's own extractors and transforms.

    python lebel_features.py --features audio          # CPU-friendly; LLaMA not needed
    python lebel_features.py --features audio text     # Colab GPU, needs Llama-3.2-3B access

Word events come from the dataset's own TextGrids (exact timings), replacing TRIBE's WhisperX step;
TRIBE's transforms then add sentence and 1 024-word context exactly as in training.
Saves feats_<mode>/<story>.npz with x (n_seg, T, 1152), start_s (n_seg,), pred (n_seg, 20484, 100).
"""
import os as _os; ROOT = _os.environ.get("PROJECT_ROOT", _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__))))
import argparse, os, re, sys, time, urllib.request
import numpy as np, pandas as pd, torch

S3 = "https://s3.amazonaws.com/openneuro.org/ds003020"
STORIES = ["wheretheressmoke", "adollshouse", "avatar", "legacy", "souls", "undertheinfluence"]
BAD = {"", "sp", "sil", "{sp}", "{ns}", "{lg}", "{ls}", "{br}", "br", "lg", "ls", "ns", "sentence_start", "sentence_end"}


def fetch(url, dst, tries=5):
    if os.path.exists(dst) and os.path.getsize(dst) > 0:
        return dst
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    for k in range(tries):
        try:
            urllib.request.urlretrieve(url, dst + ".part"); os.replace(dst + ".part", dst); return dst
        except Exception as e:
            print(f"retry {k + 1} {os.path.basename(dst)}: {e}"); time.sleep(3)
    raise RuntimeError("download failed: " + url)


def parse_textgrid(path):
    txt = open(path, encoding="utf-8").read()
    if txt.lstrip().startswith('"Praat chronological'):
        names = re.findall(r'"IntervalTier" "([^"]*)"', txt)
        widx = 1 + [i for i, n in enumerate(names) if "word" in n.lower()][0]
        out = re.findall(r'^(\d+) ([\d.]+) ([\d.]+)\s*\n"([^"]*)"', txt, flags=re.M)
        return [(float(a), float(b), w.strip()) for t, a, b, w in out if int(t) == widx and w.strip().lower() not in BAD]
    for tier in re.split(r'item \[\d+\]:', txt)[1:]:
        if "word" in re.search(r'name = "([^"]*)"', tier).group(1).lower():
            iv = re.findall(r'xmin = ([\d.]+)\s*xmax = ([\d.]+)\s*text = "([^"]*)"', tier)
            return [(float(a), float(b), w.strip()) for a, b, w in iv if w.strip().lower() not in BAD]
    raise ValueError(path)


def story_events(story, work, with_text, chunk=60):
    from neuralset.events.utils import standardize_events
    from neuralset.events.transforms import ChunkEvents
    wav = fetch(f"{S3}/stimuli/{story}.wav", f"{work}/stimuli/{story}.wav")
    ev = pd.DataFrame([{"type": "Audio", "filepath": wav, "start": 0.0, "timeline": story, "subject": "default"}])
    ev = ChunkEvents(event_type_to_chunk="Audio", max_duration=chunk, min_duration=chunk / 2)(standardize_events(ev))
    if with_text:
        from neuralset.events.transforms import AddText, AddSentenceToWords, AddContextToWords, RemoveMissing
        tg = fetch(f"{S3}/derivatives/TextGrids/{story}.TextGrid", f"{work}/textgrids/{story}.TextGrid")
        words = pd.DataFrame([{"type": "Word", "start": a, "duration": b - a, "text": w.lower(), "language": "english",
                               "timeline": story, "subject": "default"} for a, b, w in parse_textgrid(tg)])
        ev = standardize_events(pd.concat([ev, words], ignore_index=True))
        for t in [AddText(), AddSentenceToWords(max_unmatched_ratio=0.05),
                  AddContextToWords(sentence_only=False, max_context_len=1024, split_field=""), RemoveMissing()]:
            ev = t(ev)
    return standardize_events(ev)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--features", nargs="+", default=["audio"])
    ap.add_argument("--work", default=os.environ.get("LEBEL_WORK", ROOT + "/data/lebel"))
    ap.add_argument("--weights", default="facebook/tribev2")
    ap.add_argument("--stories", nargs="*", default=STORIES)
    ap.add_argument("--chunk", type=float, default=60, help="audio chunk length in s (TRIBE uses 60; 30 halves CPU memory)")
    a = ap.parse_args()
    from tribev2 import TribeModel
    dev = "cuda" if torch.cuda.is_available() else "cpu"
    upd = {"data.features_to_use": a.features}
    if dev == "cpu":
        upd.update({"data.audio_feature.device": "cpu", "data.text_feature.device": "cpu"})
    elif "text" in a.features:
        # LLaMA-3.2-3B in fp32 plus 1 024-token contexts does not fit a 15-GB T4: load it in fp16 ('accelerate')
        # and use small batches. Larger GPUs keep TRIBE's fp32 default.
        small = torch.cuda.get_device_properties(0).total_memory < 20e9
        upd.update({"data.text_feature.device": "accelerate" if small else "cuda",
                    "data.text_feature.batch_size": 4 if small else 8})
        print("text extractor:", upd["data.text_feature.device"], "batch", upd["data.text_feature.batch_size"], flush=True)
    m = TribeModel.from_pretrained(a.weights, cache_folder=f"{a.work}/feat_cache", device=dev, config_update=upd)
    net = m._model
    tag = "_".join(sorted(a.features)); out = f"{a.work}/feats_{tag}"; os.makedirs(out, exist_ok=True)
    for st in a.stories:
        if os.path.exists(f"{out}/{st}.npz"):
            print("cached", st); continue
        t0 = time.time()
        ev = story_events(st, a.work, "text" in a.features, a.chunk)
        loader = m.data.get_loaders(events=ev, split_to_build="all")["all"]
        X, P, S = [], [], []
        with torch.no_grad():
            for batch in loader:
                batch = batch.to(net.device)
                x = net.aggregate_features(batch)                 # (B, T, 1152)
                X.append(x.cpu().numpy().astype(np.float32))
                P.append(net(batch).cpu().numpy().astype(np.float16))
                S += [float(s.start) for s in batch.segments]
        np.savez(f"{out}/{st}.npz", x=np.concatenate(X), pred=np.concatenate(P), start_s=np.array(S))
        print(f"{st}: x {np.concatenate(X).shape}  starts {S[:3]}…  {time.time() - t0:.0f}s", flush=True)


if __name__ == "__main__":
    main()
