"""Import the entire official legal-dong code archive; never infer names from policies."""
import csv
import hashlib
import io
import json
from pathlib import Path
import sys
from zipfile import ZipFile

root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1]) if len(sys.argv) > 1 else root / 'assets/administrative/legal-dong-codes-2026-11-20.zip'
with ZipFile(source) as archive:
    names = [name for name in archive.namelist() if name.endswith('.txt')]
    assert len(names) == 1, 'Expected one official TSV file'
    content = archive.read(names[0]).decode('cp949')
rows = list(csv.DictReader(io.StringIO(content), delimiter='\t'))
active = [r for r in rows if r['폐지여부'] == '존재']
provinces = {}
districts = []
profile = []
for row in active:
    code, label = row['법정동코드'], row['법정동명'].strip()
    assert len(code) == 10 and code.isdigit()
    # Sejong has a 36110... record, but no separate 36000... province record.
    provinces[code[:2]] = label.split()[0]
    if code.endswith('00000') and not code.endswith('00000000'):
        item = {'code': code[:5], 'label': label}
        districts.append(item)
        profile.append(item)
    elif code.endswith('00') and not code.endswith('00000'):
        profile.append({'code': code[:8], 'label': label})
provinces = [{'code': code, 'label': label, 'fullName': label} for code, label in sorted(provinces.items())]
assert len({r['code'] for r in districts}) == len(districts)
assert len({r['code'] for r in profile}) == len(profile)
assert len([r for r in districts if r['code'].startswith('26')]) == 16
assert len([r for r in districts if r['code'].startswith('27')]) == 9
assert any(r['code'] == '27720' and r['label'] == '대구광역시 군위군' for r in districts)
meta = {
    'source': 'https://www.code.go.kr/stdcode/regCodeL.do', 'downloadedAt': '2026-11-20',
    'sha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'encoding': 'cp949',
    'totalRows': len(rows), 'activeRows': len(active),
    'provinceCount': len(provinces), 'districtCount': len(districts),
    'legalDongCount': len(profile) - len(districts),
}
(root / 'src/data/administrative-regions.json').write_text(json.dumps({**meta, 'provinces': provinces, 'districts': districts}, ensure_ascii=False, indent=2)+'\n')
(root / 'src/data/regions.json').write_text(json.dumps(profile, ensure_ascii=False, separators=(',', ':'))+'\n')
print(json.dumps(meta, ensure_ascii=False))
