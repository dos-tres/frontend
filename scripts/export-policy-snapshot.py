"""Export public backend seed data for offline policy browsing. Run from frontend."""
import json
from pathlib import Path
import sys

root = Path(__file__).resolve().parents[1]
backend = root.parent / 'backend'
sys.path.insert(0, str(backend))
from app.catalog.rows import build_rows

def clean(value):
    text = str(value or '').strip()
    return '' if text in {'-', '--', '해당없음', '없음', 'null'} else text

items = []
groups = []
group_ids = {}
for filename, kind in [('policies_serving.json', 'policy'), ('programs_serving.json', 'program')]:
    serving = json.loads((backend / 'data/seed/serving' / filename).read_text())
    for row in build_rows(kind, serving):
        p = row['payload']
        codes = tuple(sorted(row['region_cds']))
        if codes not in group_ids:
            group_ids[codes] = len(groups)
            groups.append(list(codes))
        policy = kind == 'policy'
        age = '연령 제한 없음' if not row['age_min'] and not row['age_max'] else f"만 {row['age_min'] or 0}세 ~ {str(row['age_max'])+'세' if row['age_max'] else '상한 없음'}"
        conditions = [age, p.get('jobCd_nm'), p.get('schoolCd_nm'), p.get('addAplyQlfcCndCn')]
        items.append({
            'id': row['id'], 'type': '정책' if policy else '프로그램', 'title': row['title'],
            'summary': p.get('plcyExplnCn', '') if policy else p.get('summary', ''),
            'region': p.get('region_scope') or ('전국' if policy else p.get('center_names', '지역 청년센터')),
            'regionGroup': group_ids[codes], 'ageMin': row['age_min'], 'ageMax': row['age_max'],
            'target': '\n'.join(c for c in conditions if clean(c) and c != '제한없음') if policy else p.get('target') or '운영기관 공고에서 참여 조건을 확인해 주세요.',
            'period': (p.get('aplyYmd') or p.get('aplyPrdSeCd_nm') or '공고 확인') if policy else p.get('aply_text') or '공고 확인',
            'deadline': row['deadline'].isoformat() if row['deadline'] else None,
            'method': (p.get('plcyAplyMthdCn') or '공식 공고의 신청 방법을 확인해 주세요.') if policy else ('방문 이용' if row['access_type'] == 'visit' else '공식 모집 공고에서 신청'),
            'place': p.get('place') or '운영기관 공고 확인',
            'source': (p.get('sprvsnInstCdNm') or p.get('operInstCdNm') or '온통청년') if policy else p.get('center_names') or p.get('source_name') or '청년센터',
            'support': p.get('plcySprtCn') or p.get('summary') or '',
            'documents': clean(p.get('sbmsnDcmntCn')),
            'income': clean(p.get('earnEtcCn')) or (f"연소득 {p['earn_max_clean']:,}만 원 이하" if p.get('earnCndSeCd_nm') == '연소득' and p.get('earn_max_clean') else ''),
            'exclusions': clean(p.get('ptcpPrpTrgtCn')),
            'referenceUrl': (p.get('refUrlAddr1') or p.get('refUrlAddr2') or p.get('aplyUrlAddr') or '') if policy else p.get('url') or '',
            'applyUrl': p.get('aplyUrlAddr') or '' if policy else (p.get('apply_urls') or '').split(' ')[0],
            'category': p.get('mclsfNm') or '지역 프로그램', 'domains': row['domains'],
            'evergreen': bool(p.get('evergreen')), 'updatedAt': p.get('lastMdfcnDt') or '',
        })
regions = json.loads((root / 'src/data/administrative-regions.json').read_text())['districts']
output = {'generatedAt': '2026-11-19', 'items': items, 'regionGroups': groups, 'regions': regions}
path = root / 'src/data/policy-catalog.json'
path.write_text(json.dumps(output, ensure_ascii=False, separators=(',', ':'))+'\n')
print(f'Exported {len(items)} records, {len(groups)} region groups, {len(regions)} selectable regions; {path.stat().st_size:,} bytes')
