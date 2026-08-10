// docs/coinmirror_demo.html renderGoalForm()/progressCard() 데이터 구조.
export type GoalTemplate = {
  id: string;
  label: string;
  description: string;
  source: string;
  defaultTarget: number;
  unit: string;
};

export type GoalProgress = {
  label: string;
  note: string;
  target: number;
  unit: string;
  current: number | null;
  progressPct: number;
  achieved: boolean | null;
};

// PRD §6.8 목표 예시를 그대로 템플릿화.
export const goalTemplates: GoalTemplate[] = [
  {
    id: 'no-reason-buy-ratio',
    label: '근거 없는 매수 비율',
    description: '"그냥/느낌" 태그로만 기록된 매수 비율',
    source: 'M1 과매매 지표',
    defaultTarget: 30,
    unit: '%',
  },
  {
    id: 'stop-loss-recorded-ratio',
    label: '손절가 입력 거래 비율',
    description: '매수 시점에 손절가를 미리 기록한 비율(반대로 이건 이상)',
    source: 'M2 익절·손절 비대칭',
    defaultTarget: 80,
    unit: '%',
  },
  {
    id: 'unplanned-averaging-count',
    label: '무계획 물타기 횟수',
    description: '사전 분할매수 계획 없이 발생한 추가매수',
    source: 'M4 물타기 지표',
    defaultTarget: 0,
    unit: '회',
  },
];

export const goalProgress: GoalProgress[] = [
  {
    label: '근거 없는 매수 비율',
    note: '이번 주 매수 12건 중 5건이 근거 태그 없이 기록됐어요.',
    target: 30,
    unit: '%',
    current: 42,
    progressPct: 71,
    achieved: false,
  },
  {
    label: '손절가 입력 거래 비율',
    note: '기록된 매수 중 손절가를 함께 남긴 비율이에요.',
    target: 80,
    unit: '%',
    current: 61,
    progressPct: 76,
    achieved: false,
  },
  {
    label: '무계획 물타기 횟수',
    note: '평단 대비 -10% 이하 구간의 무계획 추가매수예요.',
    target: 0,
    unit: '회',
    current: 0,
    progressPct: 100,
    achieved: true,
  },
];

export const weeklyTrend = [
  { week: '7/14', tradeCount: 9, nightRatio: 4 },
  { week: '7/21', tradeCount: 14, nightRatio: 8 },
  { week: '7/28', tradeCount: 11, nightRatio: 6 },
  { week: '8/4', tradeCount: 12, nightRatio: 9 },
];
