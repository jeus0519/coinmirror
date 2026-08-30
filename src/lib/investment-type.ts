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
  strengths: string[];
  watchouts: string[];
  biasSuggestions: {
    metricId: 'F1' | 'F3' | 'F5' | 'F6' | 'F8';
    title: string;
    suggestion: string;
  }[];
  similarMbtiCodes: Extract<GeneralMbti, string>[];
  similarMbtiCopy: string;
  disclaimer: string;
};

type ExpectedTypeInput = Partial<{
  A1: string;
  A2: string[];
  A4: string;
  B1: string;
  B3: string;
  generalMbti: GeneralMbti;
}>;

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
  if (codeLabels.has('손실보류형')) return '손실보류형 관찰가';
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

function buildStrengths(metrics: Metric[], axes: InvestmentTypeAxis[]) {
  const strengths: string[] = [];
  if (metricById(metrics, 'F3')?.score && metricById(metrics, 'F3')!.score! >= 55) {
    strengths.push(
      '급등 직후 따라 들어가는 비중이 과도하게 높지는 않아, 한 번 더 보고 들어가는 여지가 있어요.'
    );
  }
  if (metricById(metrics, 'F6')?.score && metricById(metrics, 'F6')!.score! >= 55) {
    strengths.push('거래 빈도가 극단적으로 흔들리기보다 관찰 가능한 리듬 안에 머무는 편이에요.');
  }
  if (metricById(metrics, 'F1')?.score && metricById(metrics, 'F1')!.score! >= 55) {
    strengths.push(
      '손실 거래를 무한정 방치하는 신호는 강하지 않아, 점검 기준을 붙이면 개선 여지가 커요.'
    );
  }
  if (axes.some((axis) => axis.confidence === 'insufficient')) {
    strengths.push('측정되지 않은 축은 단정하지 않고 보류해, 과잉 해석을 피합니다.');
  }
  return strengths.slice(0, 3);
}

function buildWatchouts(metrics: Metric[], axes: InvestmentTypeAxis[]) {
  const watchouts: string[] = [];
  const recovery = metrics.find((metric) => metric.id === 'F5');
  if (recovery?.score !== null && recovery?.score !== undefined && recovery.score < 55) {
    watchouts.push('손실 직후 빠르게 다시 진입하는 복구매수 패턴은 먼저 줄었는지 확인하면 좋아요.');
  }
  if (axes.some((axis) => axis.axis === 'allocation' && axis.confidence === 'insufficient')) {
    watchouts.push('한 종목 최대 비중 기준이 없어 자금 배분 축은 아직 확정하지 않았어요.');
  }
  if (!watchouts.length)
    watchouts.push(
      '현재 타입은 안정적으로 보이지만, 다음 데이터에서도 같은 리듬이 유지되는지 확인이 필요해요.'
    );
  return watchouts;
}

function buildBiasSuggestions(metrics: Metric[]) {
  const suggestions: InvestmentTypeProfile['biasSuggestions'] = [];
  const recovery = metrics.find((metric) => metric.id === 'F5');
  if (recovery?.score !== null && recovery?.score !== undefined && recovery.score < 55) {
    suggestions.push({
      metricId: 'F5',
      title: '손실회피·만회 심리',
      suggestion:
        '손실을 확정한 뒤 2시간은 같은 종목 재진입을 쉬는 원칙을 다음 분석에서 확인해 보세요.',
    });
  }
  const chase = metricById(metrics, 'F3');
  if (chase?.score !== null && chase?.score !== undefined && chase.score < 80) {
    suggestions.push({
      metricId: 'F3',
      title: 'FOMO·주의 기반 매수',
      suggestion: '급등을 본 직후에는 바로 매수하지 않고 30분 뒤에도 같은 판단인지 확인해 보세요.',
    });
  }
  return suggestions.slice(0, 2);
}

function buildSimilarMbti(axes: InvestmentTypeAxis[]) {
  const labels = new Set(axes.map((axis) => axis.label));
  if (labels.has('대기형') && labels.has('장기보유형')) return ['ISTJ', 'INTJ'] as GeneralMbti[];
  if (labels.has('추격형') && labels.has('단기반응형')) return ['ESTP', 'ENTP'] as GeneralMbti[];
  if (labels.has('손실보류형') && labels.has('집중형')) return ['ISFJ', 'INFJ'] as GeneralMbti[];
  if (labels.has('단기반응형')) return ['ESTP', 'ESFP'] as GeneralMbti[];
  return ['ISTJ', 'INTJ'] as GeneralMbti[];
}

function expectedAxis(
  axis: InvestmentTypeAxisName,
  code: InvestmentTypeAxisCode,
  label: string,
  evidenceMetricId: 'F1' | 'F3' | 'F6' | 'F8',
  answered: boolean
): InvestmentTypeAxis {
  return {
    axis,
    code: answered ? code : '?',
    label: answered ? label : AXIS_LABELS[axis].missing,
    evidenceMetricIds: [evidenceMetricId],
    confidence: answered ? 'partial' : 'insufficient',
  };
}

export function buildExpectedInvestmentTypeProfile(
  input: ExpectedTypeInput
): InvestmentTypeProfile {
  const concerns = input.A2 ?? [];
  const entryAnswered = Boolean(input.A1) || concerns.includes('chase');
  const tempoAnswered = Boolean(input.A1) || Boolean(input.B1);
  const lossAnswered = concerns.includes('hold_loss') || Boolean(input.B3);
  const allocationAnswered = concerns.includes('concentration') || Boolean(input.A4);
  const tempoFast =
    input.A1 === 'day' ||
    input.A1 === 'momentum' ||
    input.B1 === '31_100' ||
    input.B1 === 'over_100' ||
    concerns.includes('overtrade');

  const axes: InvestmentTypeAxis[] = [
    expectedAxis(
      'entry',
      concerns.includes('chase') || input.A1 === 'momentum' ? 'C' : 'W',
      concerns.includes('chase') || input.A1 === 'momentum' ? '추격형' : '대기형',
      'F3',
      entryAnswered
    ),
    expectedAxis(
      'tempo',
      tempoFast ? 'R' : 'H',
      tempoFast ? '단기반응형' : '장기보유형',
      'F6',
      tempoAnswered
    ),
    expectedAxis(
      'loss',
      concerns.includes('hold_loss') || input.B3 === 'profit_first' ? 'L' : 'X',
      concerns.includes('hold_loss') || input.B3 === 'profit_first' ? '손실보류형' : '손실정리형',
      'F1',
      lossAnswered
    ),
    expectedAxis(
      'allocation',
      concerns.includes('concentration') || input.A4 === 'all_in' ? 'N' : 'D',
      concerns.includes('concentration') || input.A4 === 'all_in' ? '집중형' : '분산형',
      'F8',
      allocationAnswered
    ),
  ];
  const baseTitle = titleFromAxes(axes);
  const similarMbtiCodes = buildSimilarMbti(axes);
  return {
    version: 1,
    calculatedAt: '2026-08-19T00:00:00+09:00',
    sourceWindow: { from: 'survey', to: 'survey', orderCount: 0 },
    code: axes.map((axis) => axis.code).join('-'),
    title: `예상 ${baseTitle}`,
    axes,
    generalMbti: input.generalMbti,
    comparisonCopy:
      'CSV 없이 만든 예상 타입입니다. 업로드 후 기록된 타입과의 갭을 나란히 보여드려요.',
    strengths: [
      '거래내역 업로드 전에도 자기인식 기반으로 시작할 수 있어요.',
      '점수 숫자 없이 공유 가능한 가벼운 카드로 쓸 수 있어요.',
    ],
    watchouts: ['예상 타입은 실제 거래 기록이 아니라 설문 답변만으로 만든 가설입니다.'],
    biasSuggestions: [],
    similarMbtiCodes,
    similarMbtiCopy: `유사 MBTI 비유는 재미용 비유입니다. 설문 답변만 놓고 보면 ${similarMbtiCodes.join('·')} 이미지와 가깝게 설명할 수 있어요.`,
    disclaimer: '이 카드는 거래내역 업로드 전 예상 타입이며, 성격검사나 투자 조언이 아닙니다.',
  };
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
  const similarMbtiCodes = buildSimilarMbti(axes);
  return {
    version: 1,
    calculatedAt: '2026-08-19T00:00:00+09:00',
    sourceWindow: { from: '2026-02-09', to: '2026-08-07', orderCount: 214 },
    code: axes.map((axis) => axis.code).join('-'),
    title,
    axes,
    generalMbti,
    comparisonCopy: buildMbtiComparisonCopy(generalMbti, title),
    strengths: buildStrengths(metrics, axes),
    watchouts: buildWatchouts(metrics, axes),
    biasSuggestions: buildBiasSuggestions(metrics),
    similarMbtiCodes,
    similarMbtiCopy: `유사 MBTI 비유는 재미용 비유입니다. 최근 거래 리듬만 놓고 보면 ${similarMbtiCodes.join('·')}의 신중한 관찰 이미지와 가깝게 설명할 수 있어요.`,
    disclaimer: '이 타입은 성격검사가 아니라, 최근 거래 기록에 나타난 행동 패턴 요약입니다.',
  };
}
