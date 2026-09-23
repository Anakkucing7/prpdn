"""Read only the two Phase 4 sheets; never write to the source workbook."""
import json
from pathlib import Path

import openpyxl

root = Path(__file__).resolve().parents[1]
with (root / "data/Dataset Dashboard 040526.xlsx").open("rb") as source:
    book = openpyxl.load_workbook(source, read_only=True, data_only=True)
    def records(sheet):
        rows = book[sheet].iter_rows(values_only=True)
        headers = next(rows)
        return [dict(zip(headers, row), sourceRow=index) for index, row in enumerate(rows, 2) if any(value is not None for value in row)]
    indicators = records("dim_indikator_rpjmd")
    years = records("dim_waktu")
    assert len({r["id_indikator_rpjmd"] for r in indicators}) == len(indicators)
    assert len({r["tahun"] for r in years}) == len(years)
    assert all(r["tahun_mulai"] <= r["tahun_selesai"] for r in indicators)
    fixture = {"workbook": "Dataset Dashboard 040526.xlsx", "indicators": indicators, "years": years}
    (root / "src/data/masters.json").write_text(json.dumps(fixture, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(indicators)} indicators; {len(years)} years")
    book.close()
