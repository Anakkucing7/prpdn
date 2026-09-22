"""Extract Phase 3 fixtures without changing the workbook. Run with Python + openpyxl."""
import json
import math
import re
from collections import defaultdict
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[1]
book = openpyxl.load_workbook(ROOT / "data/Dataset Dashboard 040526.xlsx", read_only=True, data_only=True)


def rows(sheet):
    return enumerate(book[sheet].iter_rows(min_row=2, values_only=True), 2)


def number(value):
    try:
        value = float(value)
        return value if math.isfinite(value) else None
    except (TypeError, ValueError):
        return None


def name_key(value):
    name = str(value).upper().removeprefix("PROVINSI ")
    # Expand source abbreviations, preserving the administrative type and name.
    name = re.sub(r"\b(ADMINISTRASI|ADM)\.?\s*", "", name)
    name = re.sub(r"\bKEP\.(?=\s)", "KEPULAUAN", name)
    return re.sub(r"[^A-Z0-9]", "", name)


regions, features = [], []
for row, r in rows("dim_wilayah"):
    if r[5] not in ("PROV", "KAB", "KOTA"):
        continue
    code = str(r[0])
    rings = []
    dropped = 0
    try:
        paths = json.loads(r[10] or "null")
        assert isinstance(paths, list) and paths
        for path in paths:
            if len(path) < 4:
                dropped += 1
                continue
            assert path[0] == path[-1]
            assert all(len(p) == 2 and -12 < p[0] < 8 and 90 < p[1] < 145 for p in path)
            rings.append([[[round(p[1], 5), round(p[0], 5)] for p in path]])
    except (ValueError, AssertionError, TypeError):
        rings = []
    if rings:
        features.append({"type": "Feature", "properties": {"code": code}, "geometry": {"type": "MultiPolygon", "coordinates": rings}})
    longitude, latitude = number(r[8]), number(r[9])
    if longitude is None or latitude is None or not (90 < longitude < 145 and -12 < latitude < 8):
        longitude = latitude = None
    regions.append({"code": code, "name": str(r[1]), "province": str(r[3]), "island": str(r[4]), "level": r[5],
                    "provinceCode": code if r[5] == "PROV" else code[:2], "active": r[7] == 1,
                    "longitude": longitude, "latitude": latitude, "boundary": bool(rings), "omittedRings": dropped,
                    "sourceRow": row, "legacy": []})

by_code = {r["code"]: r for r in regions}
by_name = defaultdict(list)
for region in regions:
    by_name[name_key(region["name"])].append(region)
    if region["level"] == "PROV" and name_key(region["province"]) != name_key(region["name"]):
        by_name[name_key(region["province"])].append(region)


def match(code, name):
    """A name crosswalk is explicit provenance, never a silent code correction."""
    code, key = str(code), name_key(name)
    direct = by_code.get(code)
    if direct and (name_key(direct["name"]) == key or (direct["level"] == "PROV" and name_key(direct["province"]) == key)):
        return direct, "code"
    names = by_name[key]
    if len(names) == 1:
        return names[0], "name"
    return None, "unmatched"


for row, r in rows("dim_wilayah_ol"):
    if r[5] not in ("PROV", "KAB", "KOTA"):
        continue
    region, method = match(r[1], r[2])
    if region:
        region["legacy"].append({"code": str(r[1]), "name": r[2], "sourceRow": row, "match": method})

pillar_groups = defaultdict(list)
for sheet in ("fact_skor_pilar", "fact_skor_pilar_kabkota"):
    for row, r in rows(sheet):
        year, code, name, pillar = (r[2], r[3], r[4], r[1]) if sheet == "fact_skor_pilar" else (r[1], r[3], r[4], r[5])
        if not year or not pillar:
            continue
        region, method = match(code, name)
        if not region:
            continue
        pillar_groups[(region["code"], int(year), int(pillar))].append({"value": number(r[6]), "row": row, "code": str(code), "match": method})

pillar_sets = {}
for (code, year, pillar), group in pillar_groups.items():
    distinct = set(g["value"] for g in group)
    conflict = len(distinct) > 1
    pillar_sets.setdefault(f"{code}:{year}", []).append({"id": pillar, "value": None if conflict else group[0]["value"],
        "rows": [g["row"] for g in group], "conflict": conflict, "mapped": any(g["match"] == "name" for g in group)})

records = []
for row, r in rows("fact_total_idsd"):
    if not r[1]:
        continue
    region, method = match(r[2], r[4])
    records.append({"id": row, "year": int(r[1]), "code": region["code"] if region else None,
                    "sourceCode": str(r[2]), "name": str(r[4]), "value": number(r[6]), "match": method,
                    "level": "PROV" if r[7] == "PROV" else "KABKOTA", "sourceLevel": r[7],
                    "provinceCode": region["provinceCode"] if region else None})

definitions = [{"id": int(r[0]), "name": r[2], "group": r[4]} for _, r in rows("dim_pilar_idsd") if r[0]]
years = [int(r[1]) for _, r in rows("dim_waktu") if r[1]]
# These checks protect joins, zero scores, geometry, and source-row provenance.
assert len(regions) == len(by_code) == 552
assert sum(r["level"] == "PROV" for r in regions) == 38
assert len(records) == 1649 and len(definitions) == 12
assert all(r["code"] is None or r["code"] in by_code for r in records)
assert next(r for r in records if r["id"] == 452)["code"] == "6303"
assert next(r for r in records if r["id"] == 452)["value"] == 0
assert all(r["code"] == "31" for r in records if r["sourceCode"] == "31")
assert len({f["properties"]["code"] for f in features}) == len(features)

def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

write(ROOT / "src/data/regions.json", regions)
write(ROOT / "src/data/idsd.json", {"years": years, "records": records, "pillars": pillar_sets, "definitions": definitions})
write(ROOT / "public/data/region-boundaries.json", {"type": "FeatureCollection", "features": features})
print(f"{len(regions)} regions; {len(features)} readable boundaries; {len(records)} IDSD observations")
print(f"Total score joins: {dict(__import__('collections').Counter(r['match'] for r in records))}")
print(f"Conflicting pillar groups: {sum(p['conflict'] for group in pillar_sets.values() for p in group)}")
book.close()
