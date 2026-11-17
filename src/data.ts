export type Program = {
  id: string
  type: '정책' | '활동' | '프로그램'
  title: string
  summary: string
  region: string
  target: string
  period: string
  method: string
  place: string
  source: string
}

export type Center = {
  id: string
  name: string
  region: string
  distance: string
  description: string
  address: string
  hours: string
  programs: string[]
}

export const programs: Program[] = [
  {
    id: 'p1',
    type: '정책',
    title: '청년 지원사업 A',
    summary: '청년의 진로·생활 안정을 돕는 지원사업 예시입니다.',
    region: '지역 확인 필요',
    target: '연령·거주 지역·소득 등 공식 공고 확인 필요',
    period: '모집 기간 확인 필요',
    method: '운영기관 공식 신청 페이지',
    place: '온라인 또는 운영기관 안내 장소',
    source: '공식 공고 URL 연결 예정',
  },
  {
    id: 'p2',
    type: '활동',
    title: '지역 취업 스터디',
    summary: '관심 분야가 비슷한 청년과 함께 준비하는 활동 예시입니다.',
    region: '지역 확인 필요',
    target: '참여 대상 및 인원 확인 필요',
    period: '운영 일정 확인 필요',
    method: '센터 또는 운영기관 신청',
    place: '지역 청년센터',
    source: '운영기관 페이지 연결 예정',
  },
  {
    id: 'p3',
    type: '프로그램',
    title: '청년 커뮤니티 특강',
    summary: '가벼운 주제로 새로운 사람과 만나는 프로그램 예시입니다.',
    region: '지역 확인 필요',
    target: '청년 누구나 또는 별도 자격 확인',
    period: '모집 일정 확인 필요',
    method: '온라인 신청',
    place: '청년센터 또는 온라인',
    source: '공식 모집 공고 연결 예정',
  },
]

export const centers: Center[] = [
  {
    id: 'c1',
    name: '청년센터 A',
    region: '서울 마포구 (예시)',
    distance: '0.8km',
    description: '청년 공간 이용, 진로 상담, 소모임 정보를 확인할 수 있는 센터 예시입니다.',
    address: '주소 정보 연결 예정',
    hours: '운영 시간 확인 필요',
    programs: ['청년 공간 이용 안내', '소규모 취업 스터디', '상담·진로 프로그램'],
  },
  {
    id: 'c2',
    name: '청년센터 B',
    region: '서울 마포구 (예시)',
    distance: '1.9km',
    description: '교육·네트워킹·생활 지원 프로그램을 운영하는 센터 예시입니다.',
    address: '주소 정보 연결 예정',
    hours: '운영 시간 확인 필요',
    programs: ['이달의 소모임', '청년 역량 강화 교육', '생활 정보 안내'],
  },
  {
    id: 'c3',
    name: '지역 청년 프로그램 C',
    region: '서울 마포구 (예시)',
    distance: '2.6km',
    description: '지역 청년이 함께 참여할 수 있는 행사와 모임 예시입니다.',
    address: '장소 정보 연결 예정',
    hours: '행사별 일정 확인 필요',
    programs: ['커뮤니티 행사', '지역 네트워킹', '문화 프로그램'],
  },
]

export type Application = {
  id: string
  title: string
  status: '신청 전' | '신청 완료' | '결과 대기' | '참여 완료'
  date: string
  note: string
}

export const initialApplications: Application[] = [
  { id: 'a1', title: '청년센터 취업 스터디', status: '신청 완료', date: '2026.11.17', note: '참여 예정일 11/21 · 사용자 기록 예시' },
  { id: 'a2', title: '청년 지원정책 A', status: '신청 전', date: '2026.11.16', note: '관심 등록 · 모집 기간 확인 필요' },
  { id: 'a3', title: '청년 커뮤니티 프로그램', status: '참여 완료', date: '2026.11.14', note: '후기·메모 저장 예시' },
]
