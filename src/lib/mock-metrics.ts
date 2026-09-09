export type MetricKind = 'habit' | 'composite';
export type ScoreLevel = 'stable' | 'observe' | 'caution' | 'measuring';

export type Metric = {
  id: `F${number}`;
  name: string;
  kind: MetricKind;
  sampleSize: number;
  measured: boolean;
  score: number | null;
  band: string;
  headline: string;
  stats: Record<string, string>;
  evidence: { when: string; symbol: string; fact: string }[];
  question?: string;
  limitation?: string;
};

export const KIND_LABEL: Record<MetricKind, string> = {
  habit: '자동 분석',
  composite: '종합',
};


export const DISPLAY_METRIC_NAMES: Partial<Record<Metric['id'], string>> = {
  F1: '손실 관리',
  F3: '직전 거래가 대비 높은 매수',
  F6: '거래 빈도',
  F8: '기간 내 매수금액 집중도',
};

export function displayMetricName(metric: Pick<Metric, 'id' | 'name'>) {
  return DISPLAY_METRIC_NAMES[metric.id] ?? metric.name;
}

export function scoreLevel(score: number | null): ScoreLevel {
  if (score === null) return 'measuring';
  if (score >= 80) return 'stable';
  if (score >= 55) return 'observe';
  return 'caution';
}

export const baseMetrics: Metric[] = [
  {
    id: 'F1',
    name: '손실 관리',
    kind: 'habit',
    sampleSize: 72,
    measured: true,
    score: 61,
    band: '관찰',
    headline: '손실 거래를 이익 거래보다 조금 더 오래 보유했어요.',
    stats: { '손실 보유 중앙값': '16.1일', '깊은 손실 비중': '13%' },
    evidence: [{ when: '07-15', symbol: 'ARB', fact: '손실 구간 21일 보유 후 청산' }],
  },
  {
    id: 'F2',
    name: '익절 습관',
    kind: 'habit',
    sampleSize: 99,
    measured: true,
    score: 82,
    band: '안정',
    headline: '작은 이익을 지나치게 빨리 확정하는 패턴은 많지 않았어요.',
    stats: { '이익 보유 중앙값': '15.0일', '초단기 익절': '8%' },
    evidence: [],
  },
  {
    id: 'F3',
    name: '직전 거래가 대비 높은 매수',
    kind: 'habit',
    sampleSize: 113,
    measured: true,
    score: 73,
    band: '관찰',
    headline: '직전 본인 체결가 대비 높은 가격에서 이어진 매수는 14%였어요.',
    stats: { '직전 대비 높은 매수 비중': '14%', '평균 상승 폭': '+7.8%' },
    evidence: [{ when: '06-21', symbol: 'SOL', fact: '직전 본인 체결가보다 7.8% 높은 가격에 매수' }],
  },
  {
    id: 'F4',
    name: '물타기',
    kind: 'habit',
    sampleSize: 34,
    measured: true,
    score: 67,
    band: '관찰',
    headline: '하락 구간 추가매수 9건 중 3건은 규모가 이전 매수보다 컸어요.',
    stats: { '하락 추가매수': '9건', '규모 확대': '3건' },
    evidence: [],
  },
  {
    id: 'F5',
    name: '복구매수',
    kind: 'habit',
    sampleSize: 22,
    measured: true,
    score: 48,
    band: '주의',
    headline: '손실 확정 후 2시간 안에 다시 진입한 거래가 7건 있었어요.',
    stats: { '2시간 내 재진입': '7건', '베팅 확대': '1.4배' },
    evidence: [{ when: '08-09', symbol: 'XRP', fact: '손실 청산 92분 뒤 재매수' }],
  },
  {
    id: 'F6',
    name: '거래 빈도',
    kind: 'habit',
    sampleSize: 214,
    measured: true,
    score: 71,
    band: '관찰',
    headline: '최근 자기 기준보다 거래가 급증한 주가 두 번 있었어요.',
    stats: { '월평균 주문': '35.7회', '누적 수수료': '120,633원' },
    evidence: [],
  },
  {
    id: 'F7',
    name: '새벽거래',
    kind: 'habit',
    sampleSize: 214,
    measured: true,
    score: 86,
    band: '안정',
    headline: '00~06시 거래대금 비중은 6%로 낮은 편이었어요.',
    stats: { '새벽 거래 비중': '6%', '직전 4주': '7%' },
    evidence: [],
  },
  {
    id: 'F8',
    name: '기간 내 매수금액 집중도',
    kind: 'habit',
    sampleSize: 8,
    measured: false,
    score: null,
    band: '측정 중',
    headline: '분석 기간 매수금액 한도가 없어 실측 집중도만 보여드려요.',
    stats: { '기간 내 최대 매수금액 비중': '24%' },
    evidence: [],
    limitation: 'A4에서 분석 기간 매수금액 한도를 선택하면 다음 분석부터 대조할 수 있어요.',
  },
  {
    id: 'F9',
    name: '본전 탈출',
    kind: 'habit',
    sampleSize: 18,
    measured: true,
    score: 64,
    band: '관찰',
    headline: '손실 후 본전 부근에서 바로 정리한 패턴이 일부 있었어요.',
    stats: { '본전 부근 청산': '5건', '중앙 보유시간': '9.2일' },
    evidence: [],
  },
  {
    id: 'F10',
    name: '투자 체력 종합점수',
    kind: 'composite',
    sampleSize: 214,
    measured: true,
    score: 69,
    band: '관찰',
    headline: '측정 가능한 8개 습관 점수를 거래 기록만으로 종합했어요.',
    stats: { '측정 점수': '8/9', 신뢰도: '높음' },
    evidence: [],
    limitation: '수익률이나 투자 실력을 평가하는 점수가 아니에요.',
  },
];

export type LockedMetricPreview = {
  id: `P${number}`;
  name: string;
  teaser: string;
};

export const lockedMetrics: LockedMetricPreview[] = [
  { id: 'P1', name: '습관 변화 그래프', teaser: '최대 12주의 점수 변화를 같은 기준으로 추적해요.' },
  { id: 'P2', name: '회복탄력성 지수', teaser: '손실 뒤 거래 속도와 규모가 안정되는 시간을 봐요.' },
  { id: 'P3', name: '하락장 적응력', teaser: '하락 국면에서 평소 습관이 어떻게 달라졌는지 봐요.' },
  { id: 'P4', name: '또래 거울', teaser: '익명 집단과 비교하되 순위나 경쟁을 만들지 않아요.' },
  { id: 'P5', name: '자기인식 갭', teaser: '내 예상과 실제 기록의 차이를 장기 추적해요.' },
  { id: 'P6', name: '운·규율 분해', teaser: '분기 리포트에서 결과와 행동의 관계를 분리해 봐요.' },
  { id: 'P7', name: '원칙 지키기', teaser: '고른 프리셋 원칙을 다음 분석에서 자동 확인해요.' },
];
