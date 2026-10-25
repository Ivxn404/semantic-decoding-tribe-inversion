# data/

| Path | Contents | In git? |
|---|---|---|
| `lebel/pycx/sampler.npz` | Sparse 20 484 × 95 556 matrix that maps UTS03's functional voxels to fsaverage5 vertices with TRIBE v2's projector settings (3-mm ball, 20 points, trilinear, mask-restricted, rows normalised). Built by `scripts/lebel_sampler.py`. | yes |
| `lebel/hf5/` | Authors' preprocessed responses from OpenNeuro ds003020 (`derivatives/preprocessed_data/UTS03/*.hf5`), downloaded by `lebel_apply.py`. | no (GBs) |
| `lebel/bold_fs5/` | Projected responses, (n_TR, 20 484) float16 per story. | no |
| `lebel/stimuli/`, `lebel/textgrids/` | Story audio and word timings, downloaded on demand by `lebel_features.py`. | no |
| `lebel/feats_<tag>/` | Model-ready representations x and TRIBE v2 predictions per story. | no |
| `atlas/` | Destrieux atlas, fetched by nilearn. | no |

Stories: wheretheressmoke (held out; mean of 10 repeats), adollshouse, avatar, legacy, souls, undertheinfluence. 66.6 min of speech, 10 363 words.

Source: A. LeBel *et al.*, "A natural language fMRI dataset for voxelwise encoding models," *Sci. Data* 10, 555 (2023). OpenNeuro [ds003020](https://openneuro.org/datasets/ds003020).

`real_x/`: TRIBE v2's aggregated representations (x, 45 segments × 200 steps × 1 152, audio slot from w2v-BERT) of the six LeBel stories, used to check the synthetic ground truth (`scripts/real_x_groundtruth.py`).
