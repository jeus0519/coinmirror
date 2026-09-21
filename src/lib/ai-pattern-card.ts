import { type GeneralMbti } from './investment-type';
import { displayMetricName, type Metric } from './mock-metrics';
import { type ExpectationComparison } from './onboarding-diagnosis';
import { type Phase1DerivedSeries } from './score-engine';

export type AiPatternCard = {
  title: string;
  headline: {
    title: string;
    profitLabel?: string;
    lossLabel?: string;
  };
  selfGap?: {
    expected: string;
    actual: string;
    summary: string;
  };
  pattern: {
    name: string;
    explanation: string;
  };
  strength: {
    title: string;
    evidence: string;
  };
  experiment: {
    title: string;
    action: string;
    nextUploadPromise: string;
  };
  mbtiAnalogy?: {
    text: string;
    disclaimer: string;
  };
  safetyCopy: string;
};

export type AiPatternCardInput = {
  generalMbti?: GeneralMbti;
  metrics: readonly Metric[];
  derivedSeries: Phase1DerivedSeries;
  expectationComparisons: readonly ExpectationComparison[];
};

function measuredMetrics(metrics: readonly Metric[]) {
  return metrics.filter((metric) => metric.measured && metric.score !== null);
}

function weakestMetric(metrics: readonly Metric[]) {
  return [...measuredMetrics(metrics)].sort((a, b) => (a.score ?? 100) - (b.score ?? 100))[0];
}

function strongestMetric(metrics: readonly Metric[]) {
  return [...measuredMetrics(metrics)].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
}

function formatDays(hours: number | null) {
  if (hours === null) return null;
  return `${(hours / 24).toFixed(1)}일`;
}

function customerMetricName(metric: Metric | undefined) {
  if (!metric) return '기록 속 반복 습관';
  switch (metric.id) {
    case 'F3':
      return '오른 뒤 따라 산 기록';
    case 'F5':
      return '손실 뒤 바로 다시 들어간 기록';
    case 'F8':
      return '한쪽으로 쏠린 매수 기록';
    case 'F7':
      return '새벽 시간대 거래';
    case 'F1':
      return '손실을 오래 들고 있던 흐름';
    default:
      return displayMetricName(metric);
  }
}

function holdingGap(input: AiPatternCardInput) {
  const profit = input.derivedSeries.medianHoldingHours.profit;
  const loss = input.derivedSeries.medianHoldingHours.loss;
  if (profit === null || loss === null || profit <= 0 || loss <= profit) return null;
  return {
    profitLabel: `이익 보유 ${formatDays(profit)}`,
    lossLabel: `손실 보유 ${formatDays(loss)}`,
    ratio: loss / profit,
    title: `이익은 ${formatDays(profit)} 만에 정리했고, 손실은 ${formatDays(loss)}을 더 지켜봤어요`,
  };
}

function patternFor(metric: Metric | undefined, hasHoldingGap: boolean) {
  if (hasHoldingGap || metric?.id === 'F1') {
    return {
      name: '처분효과',
      explanation:
        '손실을 확정하는 순간의 불편함이 커서 결정을 미루는, 사람이라면 흔히 겪는 반응이에요. 판단이 느린 것이라기보다 희망 쪽에 무게가 실린 흐름에 가까워요.',
    };
  }
  if (metric?.id === 'F5') {
    return {
      name: '만회 심리',
      explanation:
        '손실 뒤 마음이 바로 다음 기회를 찾는 흐름이에요. 틀렸다는 뜻이 아니라 불편함을 빨리 덜어내려는 반응에 가까워요.',
    };
  }
  if (metric?.id === 'F3') {
    return {
      name: 'FOMO',
      explanation:
        '기회를 놓칠까 봐 몸이 먼저 반응하는 흐름이에요. 비난할 문제가 아니라 즉시 보상 심리가 켜진 신호일 수 있어요.',
    };
  }
  if (metric?.id === 'F8') {
    return {
      name: '확증편향',
      explanation:
        '확신이 커진 대상에 마음속 기준이 느슨해질 수 있어요. 내가 맞다고 보는 정보에 더 끌리는 흔한 반응이에요.',
    };
  }
  return {
    name: '행동 반복 패턴',
    explanation: '이번 기록에서 반복된 행동을 하나로 묶어 본 회고예요. 좋고 나쁨보다 다음 달에도 반복되는지를 보는 게 핵심이에요.',
  };
}

function buildSelfGap(input: AiPatternCardInput, gap: ReturnType<typeof holdingGap>): AiPatternCard['selfGap'] | undefined {
  const b3 = input.expectationComparisons.find((item) => item.questionId === 'B3');
  if (!b3) return undefined;
  if (gap) {
    return {
      expected: `내가 답한 나: ${b3.expected}`,
      actual: `기록된 나: ${b3.actual}`,
      summary: `기록에서는 손실 거래를 약 ${gap.ratio.toFixed(1)}배 더 오래 들고 있었어요.`,
    };
  }
  return {
    expected: `내가 답한 나: ${b3.expected}`,
    actual: `기록된 나: ${b3.actual}`,
    summary: b3.observation,
  };
}

function strengthFor(metric: Metric | undefined) {
  if (!metric) {
    return { title: '반전: 이미 잘하고 있는 것', evidence: '잘하고 있는 것을 단정하기보다 판단을 보류한 점이 좋아요.' };
  }
  if (metric.id === 'F7') {
    return {
      title: '반전: 이미 잘하고 있는 것',
      evidence: `${metric.headline} 감정이 흔들리기 쉬운 시간을 피한 건 이미 잘하고 있는 것 중 하나예요.`,
    };
  }
  return {
    title: '반전: 이미 잘하고 있는 것',
    evidence: `${displayMetricName(metric)}에서는 비교적 안정적인 흐름이 보였어요. 잘하고 있는 것은 다음 달에도 같은 기준으로 확인해볼 만해요.`,
  };
}

function experimentFor(patternName: string) {
  if (patternName === '처분효과') {
    return {
      title: '다음 달 실험 1개',
      action: '손실 상태에서 정리 여부를 고민할 때 “지금 새로 시작해도 같은 선택을 할까?”를 한 번 적어보세요.',
      nextUploadPromise: '다음 업로드 때 손실 보유기간이 줄었는지 비교해 드릴게요.',
    };
  }
  if (patternName === 'FOMO') {
    return {
      title: '다음 달 실험 1개',
      action: '오른 뒤 따라 들어가고 싶을 때 “지금 놓친 기회를 되찾고 싶은 마음인가?”를 한 번 적어보세요.',
      nextUploadPromise: '다음 업로드 때 오른 뒤 따라 산 기록이 줄었는지 비교해 드릴게요.',
    };
  }
  if (patternName === '만회 심리') {
    return {
      title: '다음 달 실험 1개',
      action: '손실을 확정한 직후에는 바로 다음 거래를 찾기 전에 “지금 만회하고 싶은가?”를 한 번 적어보세요.',
      nextUploadPromise: '다음 업로드 때 손실 뒤 재진입 간격이 달라졌는지 비교해 드릴게요.',
    };
  }
  if (patternName === '확증편향') {
    return {
      title: '다음 달 실험 1개',
      action: '한쪽으로 쏠리는 느낌이 들면 “내 근거와 반대 근거를 각각 하나씩 적었나?”를 먼저 확인해보세요.',
      nextUploadPromise: '다음 업로드 때 한쪽으로 쏠린 기록이 줄었는지 비교해 드릴게요.',
    };
  }
  return {
    title: '다음 달 실험 1개',
    action: '비슷한 상황이 다시 오면, 바로 행동하기 전 이유를 한 문장으로 적어보세요.',
    nextUploadPromise: '다음 업로드 때 같은 패턴이 줄었는지 비교해 드릴게요.',
  };
}

function mbtiAnalogy(mbti: GeneralMbti | undefined, patternName: string): AiPatternCard['mbtiAnalogy'] | undefined {
  if (!mbti || mbti === 'unknown' || mbti === 'no_input') return undefined;
  return {
    text: `재미로 보는 비유: 평소 ${mbti}라고 답했다면, 이번 기록에서는 ${patternName} 앞에서 “끝까지 믿어주는 보호자 모드”가 살짝 보였어요.`,
    disclaimer: '성격 진단이 아니라 재미용 비유예요.',
  };
}

export function buildAiPatternCard(input: AiPatternCardInput): AiPatternCard {
  const gap = holdingGap(input);
  const weak = weakestMetric(input.metrics);
  const strong = strongestMetric(input.metrics);
  const pattern = patternFor(weak, Boolean(gap));
  return {
    title: '이번 기록에서 가장 선명했던 패턴',
    headline: gap
      ? { title: gap.title, profitLabel: gap.profitLabel, lossLabel: gap.lossLabel }
      : { title: `${customerMetricName(weak ?? input.metrics[0])}에서 가장 먼저 볼 패턴이 있었어요` },
    selfGap: buildSelfGap(input, gap),
    pattern,
    strength: strengthFor(strong),
    experiment: experimentFor(pattern.name),
    mbtiAnalogy: mbtiAnalogy(input.generalMbti, pattern.name),
    safetyCopy: '매수·매도 추천이 아닌 과거 기록 회고입니다.',
  };
}
