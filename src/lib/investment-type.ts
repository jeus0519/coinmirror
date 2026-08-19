import { type Metric } from './mock-metrics';

export type GeneralMbti =
  | 'INTJ'
  | 'INTP'
  | 'ENTJ'
  | 'ENTP'
  | 'INFJ'
  | 'INFP'
  | 'ENFJ'
  | 'ENFP'
  | 'ISTJ'
  | 'ISFJ'
  | 'ESTJ'
  | 'ESFJ'
  | 'ISTP'
  | 'ISFP'
  | 'ESTP'
  | 'ESFP'
  | 'unknown'
  | 'no_input';

export const GENERAL_MBTI_OPTIONS: GeneralMbti[] = [
  'INTJ',
  'INTP',
  'ENTJ',
  'ENTP',
  'INFJ',
  'INFP',
  'ENFJ',
  'ENFP',
  'ISTJ',
  'ISFJ',
  'ESTJ',
  'ESFJ',
  'ISTP',
  'ISFP',
  'ESTP',
  'ESFP',
  'unknown',
  'no_input',
];

export type InvestmentTypeAxisName = 'entry' | 'tempo' | 'loss' | 'allocation';
export type InvestmentTypeAxisCode = 'C' | 'W' | 'R' | 'H' | 'L' | 'X' | 'N' | 'D' | '?';

export type InvestmentTypeAxis = {
  axis: InvestmentTypeAxisName;
  code: InvestmentTypeAxisCode;
  label: string;
  evidenceMetricIds: ('F1' | 'F3' | 'F6' | 'F8')[];
  confidence: 'measured' | 'partial' | 'insufficient';
};

export type InvestmentTypeProfile = {
  version: 1;
  calculatedAt: string;
  sourceWindow: {
    from: string;
    to: string;
    orderCount: number;
  };
  code: string;
  title: string;
  axes: InvestmentTypeAxis[];
  generalMbti?: GeneralMbti;
  comparisonCopy?: string;
  disclaimer: string;
};

const AXIS_LABELS: Record<InvestmentTypeAxisName, { low: string; high: string; missing: string }> =
  {
    entry: { low: '추격형', high: '대기형', missing: '진입 방식 측정 중' },
    tempo: { low: '단기반응형', high: '장기보유형', missing: '거래 속도 측정 중' },
    loss: { low: '손실보류형', high: '손실정리형', missing: '손실 대응 측정 중' },
    allocation: { low: '집중형', high: '분산형', missing: '자금 배분 측정 중' },
  };

function metricById(metrics: Metric[], id: 'F1' | 'F3' | 'F6' | 'F8') {
  return metrics.find((metric) => metric.id === id);
}

function buildAxis(
  axis: InvestmentTypeAxisName,
  metric: Metric | undefined,
  lowCode: InvestmentTypeAxisCode,
  highCode: InvestmentTypeAxisCode,
  evidenceMetricId: 'F1' | 'F3' | 'F6' | 'F8'
): InvestmentTypeAxis {
  if (!metric || !metric.measured || metric.score === null) {
    return {
      axis,
      code: '?',
      label: AXIS_LABELS[axis].missing,
      evidenceMetricIds: [evidenceMetricId],
      confidence: 'insufficient',
    };
  }
  const isLowScore = metric.score < 55;
  return {
    axis,
    code: isLowScore ? lowCode : highCode,
    label: isLowScore ? AXIS_LABELS[axis].low : AXIS_LABELS[axis].high,
    evidenceMetricIds: [evidenceMetricId],
    confidence: 'measured',
  };
}

function titleFromAxes(axes: InvestmentTypeAxis[]) {
  const measuredLabels = axes
    .filter((axis) => axis.confidence !== 'insufficient')
    .map((axis) => axis.label);
  const codeLabels = new Set(measuredLabels);

  if (codeLabels.has('추격형') && codeLabels.has('단기반응형')) return '추격형 단기 반응가';
  if (codeLabels.has('집중형') && codeLabels.has('손실보류형')) return '집중형 손실 보류가';
  if (codeLabels.has('추격형') && codeLabels.has('집중형')) return '집중 추격 관찰가';
  if (codeLabels.has('단기반응형') && codeLabels.has('손실정리형')) return '짧은 점검형 반응가';
  if (codeLabels.has('대기형') && codeLabels.has('장기보유형')) return '분산형 안정 관찰가';
  return `${measuredLabels[0] ?? '측정 중'} 관찰가`;
}

export function buildMbtiComparisonCopy(generalMbti: GeneralMbti | undefined, title: string) {
  if (!generalMbti || generalMbti === 'unknown' || generalMbti === 'no_input') {
    return '평소 MBTI를 입력하지 않아도 괜찮아요. 투자거울 타입은 거래 기록만으로 산출됩니다.';
  }
  return `평소 MBTI(${generalMbti})는 점수 계산에 사용되지 않아요. 최근 거래 기록에서는 ${title} 패턴이 요약되어, 자기인식과 실제 행동을 나란히 볼 수 있습니다.`;
}

export function buildSampleInvestmentTypeProfile(
  metrics: Metric[],
  generalMbti?: GeneralMbti
): InvestmentTypeProfile {
  const axes: InvestmentTypeAxis[] = [
    buildAxis('entry', metricById(metrics, 'F3'), 'C', 'W', 'F3'),
    buildAxis('tempo', metricById(metrics, 'F6'), 'R', 'H', 'F6'),
    buildAxis('loss', metricById(metrics, 'F1'), 'L', 'X', 'F1'),
    buildAxis('allocation', metricById(metrics, 'F8'), 'N', 'D', 'F8'),
  ];
  const title = titleFromAxes(axes);
  return {
    version: 1,
    calculatedAt: '2026-08-19T00:00:00+09:00',
    sourceWindow: { from: '2026-02-09', to: '2026-08-07', orderCount: 214 },
    code: axes.map((axis) => axis.code).join('-'),
    title,
    axes,
    generalMbti,
    comparisonCopy: buildMbtiComparisonCopy(generalMbti, title),
    disclaimer: '이 타입은 성격검사가 아니라, 최근 거래 기록에 나타난 행동 패턴 요약입니다.',
  };
}
