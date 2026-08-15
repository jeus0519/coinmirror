// docs/coinmirror_demo.html의 metricCard() 데이터 구조를 그대로 따르는 목업.
export type MetricKind = 'risk' | 'skill' | 'observation';

export type Metric = {
  id: string;
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
  risk: '위험도형',
  skill: '역량형',
  observation: '관찰형',
};

// skill 타입은 낮을수록 위험, risk/observation은 높을수록 위험 (데모 scoreLevel() 규칙 그대로)
export function scoreLevel(metric: Metric): 'low' | 'mid' | 'high' | 'danger' | 'none' {
  if (metric.score === null) return 'none';
  if (metric.kind === 'skill') {
    if (metric.score >= 70) return 'low';
    if (metric.score >= 40) return 'mid';
    return 'high';
  }
  if (metric.score >= 75) return 'danger';
  if (metric.score >= 50) return 'high';
  if (metric.score >= 30) return 'mid';
  return 'low';
}

export const baseMetrics: Metric[] = [
  {
    id: 'M1',
    name: '과매매 지표',
    kind: 'risk',
    sampleSize: 46,
    measured: true,
    score: 58,
    band: '주의',
    headline: '최근 30일 일평균 3.2건 체결, 당일 왕복 거래가 22%를 차지해요.',
    stats: {
      '일평균 체결': '3.2건',
      '당일 왕복 비율': '22%',
      '수수료/실현손익': '11%',
    },
    evidence: [
      { when: '08-09 14:32', symbol: 'BTC', fact: '매수 후 47분 만에 재매도' },
      { when: '08-08 21:10', symbol: 'DOGE', fact: '같은 날 3회 왕복 체결' },
    ],
    question: '하루에 몇 번까지 거래하는 게 적당하다고 생각하시나요?',
    limitation: '수수료는 거래소가 제공한 값을 그대로 사용했어요.',
  },
  {
    id: 'M2',
    name: '익절·손절 비대칭',
    kind: 'skill',
    sampleSize: 31,
    measured: true,
    score: 34,
    band: '개선 여지 큼',
    headline: '평균 익절률 +4.1%, 평균 손절률 -9.8%로 손실 쪽이 2배 이상 커요.',
    stats: {
      '평균 익절률': '+4.1%',
      '평균 손절률': '-9.8%',
      '이익 보유시간': '2.1일',
      '손실 보유시간': '6.4일',
    },
    evidence: [{ when: '08-05 10:02', symbol: 'ETH', fact: '손실 포지션 9일 보유 후 청산' }],
    question: '손실 포지션을 더 오래 들고 있는 이유가 있을까요?',
  },
  {
    id: 'M3',
    name: '추격 진입 지표',
    kind: 'risk',
    sampleSize: 22,
    measured: true,
    score: 47,
    band: '보통',
    headline: '직전 체결가 대비 7% 이상 높은 가격에서 재매수한 비율이 18%예요.',
    stats: { '추격 재매수 비율': '18%', '평균 추격폭': '+11.4%' },
    evidence: [{ when: '08-09 14:32', symbol: 'BTC', fact: '직전가 대비 +13% 지점 매수' }],
  },
  {
    id: 'M4',
    name: '물타기 지표',
    kind: 'risk',
    sampleSize: 18,
    measured: true,
    score: 41,
    band: '보통',
    headline: '평단 대비 -10% 이하 구간 추가매수가 5건, 총 320만원 투입됐어요.',
    stats: { '추가매수 건수': '5건', '투입 금액': '320만원' },
    evidence: [{ when: '08-07 23:58', symbol: 'DOGE', fact: '평단 대비 -14% 구간 추가매수' }],
    limitation: '분할매수를 사전에 계획했는지는 아직 반영하지 않았어요.',
  },
  {
    id: 'M5',
    name: '손실 후 재진입',
    kind: 'risk',
    sampleSize: 12,
    measured: true,
    score: 63,
    band: '주의',
    headline: '손실 확정 2시간 내 재진입이 7건, 평균 베팅 규모가 1.4배로 커졌어요.',
    stats: { '2시간 내 재진입': '7건', '평균 베팅 배율': '1.4배' },
    evidence: [{ when: '08-09 09:40', symbol: 'XRP', fact: '손절 92분 후 같은 종목 재매수' }],
    question: '손실 직후 다시 들어가고 싶어지는 순간은 언제인가요?',
  },
  {
    id: 'M6',
    name: '야간 거래 지표',
    kind: 'observation',
    sampleSize: 4,
    measured: false,
    score: null,
    band: '측정 중',
    headline: '00~06시 거래가 아직 4건뿐이라 신뢰할 만한 격차를 보여드리기 어려워요.',
    stats: { '야간 거래 비중': '9%' },
    evidence: [],
    limitation: '표본 10건 이상부터 야간·주간 승률 격차를 계산해요.',
  },
];

export type LockedMetricPreview = {
  id: string;
  name: string;
  kind: MetricKind;
  teaser: string;
};

// docs/product-specs/v5.0_score-system-and-onboarding-survey.md의 구독 스코어를 반영할 때 교체할 이전 목업 지표.
export const lockedMetrics: LockedMetricPreview[] = [
  {
    id: 'S06',
    name: '포트폴리오 집중도',
    kind: 'risk',
    teaser: '종목 쏠림·섹터 편중을 HHI 지수로 보여드려요.',
  },
  {
    id: 'S09',
    name: '계획 준수율',
    kind: 'skill',
    teaser: '기록한 목표가·손절가와 실제 실행의 일치도예요.',
  },
  {
    id: 'S11',
    name: '리벤지 트레이딩 지수',
    kind: 'risk',
    teaser: '손실 후 보복성 매매 성향을 따로 떼어 봐요.',
  },
];
