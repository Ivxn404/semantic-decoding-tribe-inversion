# report/

Final Project-I report in the revised VIT report format (2026).

| File | What it is |
|---|---|
| `Report_Sarkar_Choudhuri_Project1.pdf` | Final report (46 pages) |
| `Report_Sarkar_Choudhuri_Project1.docx` | Editable Word version |
| `content.py` | Chapter text, tables and figure list |
| `refs.py` | IEEE references (numbered in order of first citation) |
| `build_report.py` | Fills the VIT template with python-docx |
| `uno_update.py` | Updates the contents / figure / table lists in LibreOffice and exports DOCX + PDF |

Chapter 4 now answers the two Review II questions: what data TRIBE v2 was trained and evaluated on (Tables 4.1–4.2) and why fMRI rather than EEG (Section 4.1.3, Table 4.3).

Rebuild: `pip install python-docx`, place the VIT template `Project-1_Report_Format-2026.docx` next to the script (or set `REPORT_TEMPLATE`), then
```
python report/build_report.py
python report/uno_update.py $PWD/report/Report_raw.docx $PWD/report/Report_Sarkar_Choudhuri_Project1.docx $PWD/report/Report_Sarkar_Choudhuri_Project1.pdf
```
(the second step needs LibreOffice with its Python UNO bridge). The template belongs to VIT and is not redistributed here.
