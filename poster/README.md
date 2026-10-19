# poster/

Final-review poster (29 October 2026), A3 portrait, built in the VIT Project-I poster template.

| File | What it is |
|---|---|
| `Poster_Sarkar_Choudhuri_Project1.pptx` | Editable poster in the VIT template |
| `Poster_Sarkar_Choudhuri_Project1.pdf` | Print-ready PDF (print at A3, colour) |
| `poster_preview.png` | Render of the poster |
| `build_poster.py` | Fills the template from `figures/` (python-pptx) |
| `repo_qr.png`, `repo_qr_plain.png` | QR codes pointing to this repository |

Rebuild: `pip install python-pptx`, put the VIT template `Poster_-_Capstone_-_Design.pptx` and the VIT logo (`vit_logo.jpeg`) next to the script (or set `POSTER_TEMPLATE` / `VIT_LOGO`), then `python poster/build_poster.py`. The template and logo belong to VIT and are not redistributed here.
