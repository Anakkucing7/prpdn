"""Read-only workbook extraction. Run with Python + openpyxl; not part of app runtime."""
import json
import math
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[1]
WORKBOOK = ROOT / "data/Dataset Dashboard 040526.xlsx"
book = openpyxl.load_workbook(WORKBOOK, read_only=True, data_only=True)


def rows(sheet):
    return enumerate(book[sheet].iter_rows(min_row=2, values_only=True), 2)


def number(value):
    return value if isinstance(value, (int, float)) and math.isfinite(value) else None


regions = []
boundaries = []
omitted_rings = []
for row, r in rows("dim_wilayah"):
    if r[5] != "PROV":
        continue
    code = str(r[0])
    # The workbook WKT concatenates islands into one ring, producing false edges.
    # Preserve the separate closed rings from path; never repair truncated cells.
    geometry = None
    try:
        paths = json.loads(r[10] or "null")
        assert paths
        coordinates = []
        for index, path in enumerate(paths):
            if len(path) < 4:
                omitted_rings.append({"code": code, "ring": index, "sourceRow": row, "reason": "Fewer than four positions"})
                continue
            assert path[0] == path[-1]
            assert all(len(p) == 2 and -12 < p[0] < 8 and 90 < p[1] < 145 for p in path)
            coordinates.append([[[p[1], p[0]] for p in path]])
        assert coordinates
        geometry = {"type": "MultiPolygon", "coordinates": coordinates}
    except (ValueError, AssertionError, TypeError):
        pass
    if geometry:
        boundaries.append({"type": "Feature", "properties": {"code": code}, "geometry": geometry})
    short = {"31": "DKI Jakarta", "34": "DI Yogyakarta"}.get(code, r[1])
    regions.append({"code": code, "name": r[1], "label": short, "island": r[4],
                    "longitude": float(r[8]), "latitude": float(r[9]), "boundary": bool(geometry), "sourceRow": row})

codes = {r["code"] for r in regions}
records = []
for sheet, metric, value_index in [("fact_total_idsd", "idsd", 6), ("fact_kfd", "kfd", 5),
                                    ("fact_eppd", "eppd", 5), ("fact_kemiskinan", "poverty", 5)]:
    seen = set()
    for row, r in rows(sheet):
        if str(r[1]) not in ("2022", "2023", "2024") or str(r[2]) not in codes:
            continue
        if metric == "idsd" and r[7] != "PROV":
            continue
        period = str(r[4]).strip() if metric == "poverty" else None
        key = (str(r[2]), int(r[1]), period)
        assert key not in seen, (sheet, key)
        seen.add(key)
        records.append({"metric": metric, "code": str(r[2]), "year": int(r[1]),
                        "period": period, "value": number(r[value_index]), "sourceRow": row,
                        "category": r[6] if metric in ("kfd", "eppd") else None})

pillars = []
corrections = []
seen = set()
for row, r in rows("fact_skor_pilar"):
    if str(r[2]) not in ("2022", "2023", "2024"):
        continue
    code = str(r[3])
    # Explicit source-name crosswalk. Never silently overwrite Maluku's records.
    if code == "81" and str(r[4]).strip().upper() == "MALUKU UTARA":
        code = "82"
        corrections.append(row)
    assert code in codes
    key = (int(r[2]), code, int(r[1]))
    assert key not in seen, key
    seen.add(key)
    value = number(r[6])
    assert value is not None and 0 <= value <= 5
    pillars.append({"code": code, "year": int(r[2]), "pillar": int(r[1]), "value": value, "sourceRow": row})

definitions = [{"id": int(r[0]), "name": r[2], "group": r[4]} for _, r in rows("dim_pilar_idsd") if r[0]]
years = [int(r[1]) for _, r in rows("dim_waktu") if r[1]]
data = {"workbook": WORKBOOK.name, "boundaryCount": len(boundaries), "omittedRings": omitted_rings, "years": [y for y in years if y in (2022, 2023, 2024)],
        "regions": regions, "records": records, "pillars": pillars, "pillarDefinitions": definitions,
        "pillarCodeCorrections": {"sheet": "fact_skor_pilar", "from": "81", "to": "82", "name": "MALUKU UTARA", "rows": corrections}}
assert len(regions) == 38 and len(definitions) == 12 and len(corrections) == 36
assert len([r for r in records if r["metric"] == "idsd" and r["year"] == 2024 and r["value"] is not None]) == 38
out = ROOT / "src/data"
(out / "dashboard.json").write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
(out / "province-boundaries.json").write_text(json.dumps({"type": "FeatureCollection", "features": boundaries}, separators=(",", ":")), encoding="utf-8")
print(f"{len(regions)} provinces, {len(records)} observations, {len(pillars)} pillar scores, {len(boundaries)} readable boundaries")
book.close()
