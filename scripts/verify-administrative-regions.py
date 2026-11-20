"""Check all region names/codes against the downloaded government archive."""
import csv
import hashlib
import io
import json
from pathlib import Path
from zipfile import ZipFile

root = Path(__file__).resolve().parents[1]
source = root / 'assets/administrative/legal-dong-codes-2026-11-20.zip'
with ZipFile(source) as archive:
    text = archive.read(archive.namelist()[0]).decode('cp949')
rows = list(csv.DictReader(io.StringIO(text), delimiter='\t'))
active = {r['법정동코드']: r['법정동명'].strip() for r in rows if r['폐지여부'] == '존재'}
actual = json.loads((root / 'src/data/administrative-regions.json').read_text())
expected_districts = {c[:5]: name for c, name in active.items() if c.endswith('00000') and not c.endswith('00000000')}
assert {r['code']: r['label'] for r in actual['districts']} == expected_districts
assert actual['sha256'] == hashlib.sha256(source.read_bytes()).hexdigest()
expected_provinces = {c[:2]: name.split()[0] for c, name in active.items()}
assert {r['code']: r['fullName'] for r in actual['provinces']} == expected_provinces
profile = json.loads((root / 'src/data/regions.json').read_text())
expected_profile = dict(expected_districts)
expected_profile.update({c[:8]: name for c, name in active.items() if c.endswith('00') and not c.endswith('00000')})
assert {r['code']: r['label'] for r in profile} == expected_profile
catalog = json.loads((root / 'src/data/policy-catalog.json').read_text())
assert {r['code']: r['label'] for r in catalog['regions']} == expected_districts
busan = {name.split()[-1] for code, name in expected_districts.items() if code.startswith('26')}
assert busan == {'중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구', '북구', '해운대구', '사하구', '금정구', '강서구', '연제구', '수영구', '사상구', '기장군'}
daegu = {name.split()[-1] for code, name in expected_districts.items() if code.startswith('27')}
assert daegu == {'중구', '동구', '서구', '남구', '북구', '수성구', '달서구', '달성군', '군위군'}
print(f'PASS: exact government-source equality: {len(expected_provinces)} provinces, {len(expected_districts)} district/city codes, {len(profile)-len(expected_districts)} legal dongs; Busan 16, Daegu 9; catalog and profile share all codes/names')
