"""Read-only extraction for Phase 6. Preserves source rows; never guesses region codes."""
import collections
import hashlib
import json
import math
import re
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'data/Dataset Dashboard 040526.xlsx'


def number(value):
    return value if isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value) else None


def name_key(value):
    value = re.sub(r'^(PROVINSI |PEMERINTAH )+', '', str(value or '').strip().upper())
    return {'DKI JAKARTA': 'DAERAH KHUSUS IBUKOTA JAKARTA', 'DI YOGYAKARTA': 'DAERAH ISTIMEWA YOGYAKARTA',
            'BANGKA BELITUNG': 'KEPULAUAN BANGKA BELITUNG'}.get(value, value)


def extract():
    book = openpyxl.load_workbook(SOURCE, read_only=True, data_only=True)
    provinces = {str(r[0]): r[1] for r in list(book['dim_wilayah'].values)[1:] if r[5] == 'PROV'}
    time = {int(r[0]): int(r[1]) for r in list(book['dim_waktu'].values)[1:] if number(r[0]) is not None}
    output = {}
    for module, sheets in {'kfd': ['fact_kfd'], 'poverty': ['fact_kemiskinan'], 'eppd': ['fact_eppd'],
                           'rpjmd': ['fact_rpjmd_prov', 'fact_rpjmd_prov_master']}.items():
        records, excluded = [], []
        for sheet in sheets:
            source_rows = list(book[sheet].values)
            headers = source_rows[0]
            for row_number, values in enumerate(source_rows[1:], 2):
                if not any(v is not None for v in values):
                    continue
                raw = dict(zip(headers, values))
                rp = module == 'rpjmd'
                # Keep incomplete fact rows, but exclude repeated headers and master annotations.
                if (not rp and number(raw.get('id_waktu')) is None) or (rp and sheet.endswith('_master') and number(raw.get('tahun_kinerja')) is None):
                    excluded.append({'sheet': sheet, 'row': row_number, 'reason': 'Header berulang atau anotasi, bukan observasi.', 'raw': raw})
                    continue
                source_code = str(raw['id_wilayah']).strip() if raw.get('id_wilayah') is not None else None
                source_name = raw.get('nama_provinsi') if rp else raw.get('nama_wilayah') if module == 'poverty' else raw.get(f'nama_provinsi_{module}')
                long_name = raw.get('nama_provinsi_long') if rp else raw.get(f'nama_provinsi_pjg_{module}')
                code = source_code if source_code in provinces else None
                issues = []
                if code is None:
                    issues.append('Kode wilayah kosong atau tidak ditemukan pada master; tidak dipadankan melalui nama.')
                elif name_key(provinces[code]) not in (name_key(source_name), name_key(long_name)):
                    issues.append(f'Kode {code} merujuk {provinces[code]}, berbeda dari nama sumber. Pasangan perlu ditinjau.')
                    code = None
                source_year = number(raw.get('tahun_kinerja') if rp else raw.get('id_waktu'))
                year = source_year if rp else time.get(source_year, source_year)
                if year is None:
                    issues.append('Tahun kinerja belum terisi.')
                elif year not in time.values():
                    issues.append('Tahun tercatat pada fakta, di luar cakupan dim_waktu (2021–2025).')
                value_key = {'kfd': 'rasio_kfd', 'poverty': 'persentase_penduduk_miskin', 'eppd': 'skor_eppd', 'rpjmd': 'nilai_awal'}[module]
                value = number(raw.get(value_key))
                end = number(raw.get('nilai_akhir')) if rp else None
                indicator = str(raw.get('indikator_rpjmd') or '').strip() if rp else None
                unit = str(raw.get('satuan') or '').strip() if rp else {'kfd': 'rasio', 'eppd': 'skor', 'poverty': '%'}[module]
                category = raw.get('tipe') if rp else raw.get('kategori_kfd') if module == 'kfd' else raw.get('status_eppd') if module == 'eppd' else None
                if rp and (not indicator or not unit or not category):
                    issues.append('Indikator, tipe, atau satuan sumber belum lengkap.')
                if rp and unit == 'Realisasi':
                    issues.append('Satuan tertulis “Realisasi”; perlu ditinjau, tidak dikoreksi otomatis.')
                if value == 0 or (rp and end == 0):
                    issues.append('Nilai nol mengikuti sumber; maknanya belum dikonfirmasi.')
                records.append({'id': f'{sheet}:{row_number}', 'sheet': sheet, 'row': row_number,
                                'sourceCode': source_code, 'code': code, 'name': str(source_name or long_name or 'Nama wilayah belum tersedia').strip(),
                                'year': year, 'period': str(raw.get('bulan') or '').strip() or None,
                                'value': value, 'end': end, 'category': category, 'indicator': indicator or None,
                                'unit': unit or None, 'issues': issues, 'raw': raw})
        groups = collections.Counter((r['sheet'], r['code'], r['year'], r['period'], r['indicator'], r['category'] if rp else None, r['unit']) for r in records)
        for r in records:
            key = (r['sheet'], r['code'], r['year'], r['period'], r['indicator'], r['category'] if module == 'rpjmd' else None, r['unit'])
            if r['code'] and groups[key] > 1:
                r['issues'].append('Lebih dari satu baris pada kombinasi yang sama; tidak diringkas untuk tren.')
        output[module] = {'records': records, 'excluded': excluded}
    definitions = list(book['dim_indikator_rpjmd'].values)
    output['rpjmd']['definitions'] = [dict(zip(definitions[0], r)) for r in definitions[1:] if r[0] is not None]
    output['poverty']['rawNote'] = 'kemiskinan_raw: September 2023 tidak dilakukan penghitungan kemiskinan (J3). Data mentah 2025 belum memiliki pasangan fakta berkode; tidak digabung otomatis.'
    book.close()
    result = {'workbook': SOURCE.name, 'sha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(), 'modules': output}
    # Runnable extraction invariants: repeated headers removed, incomplete observations retained.
    assert [len(output[m]['records']) for m in ('kfd', 'poverty', 'eppd', 'rpjmd')] == [102, 304, 368, 1919]
    assert sum(r['code'] is None for r in output['poverty']['records']) == 28
    assert len(output['rpjmd']['excluded']) == 7
    return result


if __name__ == '__main__':
    data = extract()
    (ROOT / 'src/data/analytical.json').write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    for key, module in data['modules'].items():
        print(key, len(module['records']), 'records;', sum(r['code'] is None for r in module['records']), 'unresolved region codes')
