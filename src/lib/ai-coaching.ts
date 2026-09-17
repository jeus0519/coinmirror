import { buildAiPatternCard, type AiPatternCard as CanonicalAiPatternCard } from './ai-pattern-card';
import { type GeneralMbti } from './investment-type';
import { type Metric, displayMetricName, scoreLevel } from './mock-metrics';
import { type ExpectationComparison } from './onboarding-diagnosis';
import { type Phase1DerivedSeries } from './score-engine';

export type AiBehaviorCoachingType =
  | 'loss_management'
  | 'profit_taking_rhythm'
  | 'late_entry_check'
  | 'averaging_down_check'
  | 'reentry_after_loss'
  | 'trade_frequency_check'
  | 'late_night_trade_check'
  | 'asset_concentration_check'
  | 'break_even_exit_check'
  | 'balanced_observation';

export type AiBehaviorCoachingInput = {
  generalMbti?: GeneralMbti;
  metrics: readonly Metric[];
  comparisonCopy?: string;
  derivedSeries?: Phase1DerivedSeries;
  expectationComparisons?: readonly ExpectationComparison[];
};

export type AiBehaviorCoachingSafePayload = {
  schemaVersion: 'coinmirror.aiReflection.v1';
  generalMbti?: Exclude<GeneralMbti, 'unknown' | 'no_input'>;
  coachingType: AiBehaviorCoachingType;
  keySignals: {
    metricId: Metric['id'];
    displayName: string;
    scoreBand: 'stable' | 'observe' | 'caution' | 'measuring';
    scoreBucket: '80_100' | '55_79' | '0_54' | 'measuring';
    sampleSizeBucket: '0' | '1_9' | '10_49' | '50_plus';
  }[];
  comparisonHint?: 'self_perception_available';
  requestedOutput: ['observedPattern', 'reduceAction', 'reinforceAction', 'nextQuestion'];
};

export type AiPatternCard = {
  title: string;
  headline: {
    title: string;
    primaryLabel: string;
    secondaryLabel?: string;
    summary: string;
  };
  selfGap?: {
    title: '내가 답한 나 vs 기록된 나';
    expected: string;
    actual: string;
    summary: string;
  };
  patternName: {
    label: '이 패턴의 이름';
    name: string;
    explanation: string;
  };
  strength: {
    title: string;
    evidence: string;
  };
  experiment: {
    title: '다음 달 실험 1개';
    action: string;
    nextUploadPromise: string;
  };
  mbtiAnalogy?: {
    title: '재미로 보는 비유';
    body: string;
    disclaimer: string;
  };
  safetyCopy: string;
};

export type AiBehaviorCoaching = {
  coachingType: AiBehaviorCoachingType;
  title: string;
  eyebrow: string;
  intro: string;
  keySignals: string[];
  reduceActions: string[];
  reinforceActions: string[];
  nextQuestion: string;
  safetyCopy: string;
  patternCard: AiPatternCard;
};

function measuredMetrics(metrics: readonly Metric[]) {
  return metrics.filter((metric) => metric.measured && metric.score !== null);
}

function weakestMetrics(metrics: readonly Metric[]) {
  return [...measuredMetrics(metrics)].sort((a, b) => (a.score ?? 100) - (b.score ?? 100));
}

function strongestMetrics(metrics: readonly Metric[]) {
  return [...measuredMetrics(metrics)].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

function mbtiLabel(mbti: GeneralMbti | undefined) {
  if (!mbti || mbti === 'unknown' || mbti === 'no_input') return '선택한 자기인식 답변';
  return `평소 MBTI(${mbti})`;
}


function coachingTypeFor(metric: Metric | undefined): AiBehaviorCoachingType {
  if (!metric) return 'balanced_observation';
  switch (metric.id) {
    case 'F1':
      return 'loss_management';
    case 'F2':
      return 'profit_taking_rhythm';
    case 'F3':
      return 'late_entry_check';
    case 'F4':
      return 'averaging_down_check';
    case 'F5':
      return 'reentry_after_loss';
    case 'F6':
      return 'trade_frequency_check';
    case 'F7':
      return 'late_night_trade_check';
    case 'F8':
      return 'asset_concentration_check';
    case 'F9':
      return 'break_even_exit_check';
    default:
      return 'balanced_observation';
  }
}

function scoreBucket(score: Metric['score']): AiBehaviorCoachingSafePayload['keySignals'][number]['scoreBucket'] {
  if (score === null) return 'measuring';
  if (score >= 80) return '80_100';
  if (score >= 55) return '55_79';
  return '0_54';
}

function sampleSizeBucket(sampleSize: number): AiBehaviorCoachingSafePayload['keySignals'][number]['sampleSizeBucket'] {
  if (sampleSize <= 0) return '0';
  if (sampleSize < 10) return '1_9';
  if (sampleSize < 50) return '10_49';
  return '50_plus';
}

export function buildAiBehaviorCoachingSafePayload(input: AiBehaviorCoachingInput): AiBehaviorCoachingSafePayload {
  const weakest = weakestMetrics(input.metrics);
  const primaryWeak = weakest[0];
  const keyMetrics = weakest.slice(0, 2);
  const payload: AiBehaviorCoachingSafePayload = {
    schemaVersion: 'coinmirror.aiReflection.v1',
    coachingType: coachingTypeFor(primaryWeak),
    keySignals: keyMetrics.map((metric) => ({
      metricId: metric.id,
      displayName: displayMetricName(metric),
      scoreBand: scoreLevel(metric.score),
      scoreBucket: scoreBucket(metric.score),
      sampleSizeBucket: sampleSizeBucket(metric.sampleSize),
    })),
    requestedOutput: ['observedPattern', 'reduceAction', 'reinforceAction', 'nextQuestion'],
  };

  if (input.generalMbti && input.generalMbti !== 'unknown' && input.generalMbti !== 'no_input') {
    payload.generalMbti = input.generalMbti;
  }
  if (input.comparisonCopy) {
    payload.comparisonHint = 'self_perception_available';
  }

  return payload;
}

function reduceActionFor(metric: Metric | undefined) {
  if (!metric) {
    return '이번 기록에서 보이는 핵심은 아직 성급하게 타입을 붙일 단계가 아니라는 점이에요. 아하 싶은 단서를 찾으려면 거래 전후 마음속 이유를 한 줄 메모로 남기고, 다음 달 실험으로 같은 감정이 반복되는지 확인해보세요.';
  }
  switch (metric.id) {
    case 'F1':
      return '이번 기록에서 보이는 핵심은 판단이 늦다기보다, 손실을 확정하는 순간의 불안을 관리하려고 결정을 뒤로 미루는 흐름에 가까워요. 게으르다는 뜻이 아니라 희망 쪽에 무게가 실리는 패턴일 수 있으니, 다음 달 실험으로 손실 상태에서 떠오른 첫 감정을 한 줄 메모로 남겨보세요.';
    case 'F3':
      return '이번 기록에서 보이는 핵심은 기회를 놓칠까 봐 나도 모르게 몸이 먼저 반응하는 흐름이에요. 비난할 문제가 아니라 FOMO와 즉시 보상 심리가 섞인 신호일 수 있으니, 다음 달 실험으로 직전 체결가보다 높은 구간에 들어가고 싶을 때 이유를 한 줄 메모로 남겨보세요.';
    case 'F5':
      return '이번 기록에서 보이는 핵심은 손실 뒤에 마음이 바로 다음 기회를 찾는다는 점이에요. 게으르다는 뜻도, 판단이 틀렸다는 뜻도 아니라 손실의 불편함을 빨리 덜어내려는 만회 심리가 희망 쪽에 무게를 싣는 흐름일 수 있어요. 다음 달 실험으로 손실 직후 “지금 만회하고 싶은가?”를 한 줄 메모로 남겨보세요.';
    case 'F6':
      return '이번 기록에서 보이는 핵심은 거래가 몰리는 날 마음속 확신이 빠르게 커질 수 있다는 점이에요. 비난할 문제가 아니라 확증편향과 흥분 상태가 겹칠 수 있으니, 다음 달 실험으로 거래가 갑자기 늘어난 날의 첫 이유를 한 줄 메모로 남겨보세요.';
    case 'F8':
      return '이번 기록에서 보이는 핵심은 특정 자산에 확신이 생길 때 마음속 기준이 점점 느슨해질 수 있다는 점이에요. 나도 모르게 내가 맞다고 보는 정보에 더 끌리는 확증편향일 수 있으니, 다음 달 실험으로 비중이 커지는 순간의 근거를 한 줄 메모로 남겨보세요.';
    default:
      return `이번 기록에서 보이는 핵심은 ${displayMetricName(metric)} 지표가 반복 습관을 보여주는 신호라는 점이에요. 아하 싶은 패턴을 찾으려면 다음 달 실험으로 같은 상황에서 먼저 올라온 감정과 생각을 한 줄 메모로 남겨보세요.`;
  }
}

function reinforceActionFor(metric: Metric | undefined) {
  if (!metric) return '초보자에게 중요한 점은 모르는 것을 억지로 해석하지 않는 태도예요. 표본이 부족한 지표를 판단 보류로 둔 것은 과잉확신을 줄이는 좋은 습관이라 유지해도 좋아요.';
  switch (metric.id) {
    case 'F2':
      return '이익 거래를 지나치게 빨리 닫는 신호가 강하지 않다면, 즉시 보상에 끌려 조급하게 끝내지 않는 리듬이 어느 정도 유지된 거예요. 다음 달에도 “왜 지금 정리하려는지”를 먼저 확인해보세요.';
    case 'F7':
      return '새벽 시간대 거래 비중이 낮다면 감정 조절에 불리한 시간대를 피한 셈이에요. 피곤하거나 외로운 시간에는 판단이 흔들리기 쉬우니, 이 회피 습관은 계속 유지해볼 만해요.';
    case 'F10':
      return '여러 지표를 한 번에 단정하지 않고 종합해서 보는 태도는 초보자에게 특히 중요해요. 한두 번의 결과에 과잉확신하지 않고 기록을 누적해 보는 방식은 다음 분석에서도 유지해보세요.';
    default:
      return `쉽게 말하면 ${displayMetricName(metric)} 지표에서 안정적으로 보인 부분은 이미 도움이 되는 습관일 수 있어요. 다음 달에도 같은 기준으로 확인해, 감정이 아니라 반복 기록으로 유지 여부를 판단해보세요.`;
  }
}


function customerMetricName(metric: Metric | undefined) {
  if (!metric) return '이번 기록';
  switch (metric.id) {
    case 'F1':
      return '손실을 오래 들고 있던 흐름';
    case 'F2':
      return '이익을 정리하는 리듬';
    case 'F3':
      return '오른 뒤 따라 산 기록';
    case 'F4':
      return '하락 중 추가로 담은 기록';
    case 'F5':
      return '손실 뒤 바로 다시 들어간 기록';
    case 'F6':
      return '거래가 몰린 날';
    case 'F7':
      return '새벽 시간대 거래';
    case 'F8':
      return '한쪽으로 쏠린 매수 기록';
    case 'F9':
      return '본전 근처에서 정리한 기록';
    default:
      return '기록 속 반복 습관';
  }
}

function patternNameFor(metric: Metric | undefined) {
  switch (metric?.id) {
    case 'F1':
    case 'F2':
    case 'F9':
      return '처분효과';
    case 'F3':
      return 'FOMO';
    case 'F4':
    case 'F8':
      return '확증편향';
    case 'F5':
      return '만회 심리';
    case 'F6':
      return '즉시 보상';
    case 'F7':
      return '감정 피로 시간대 거래';
    default:
      return '자기인식 갭';
  }
}

function patternExplanationFor(metric: Metric | undefined) {
  switch (metric?.id) {
    case 'F1':
      return '손실을 확정하는 순간의 불편함 때문에 결정을 미루는, 사람이라면 흔히 겪는 반응이에요. 판단이 느린 것이라기보다 희망 쪽에 무게가 실린 흐름에 가까워요.';
    case 'F3':
      return '기회를 놓칠까 봐 몸이 먼저 반응하는 흐름이에요. 틀렸다는 뜻이 아니라, 놓친 기회를 빨리 되찾고 싶은 마음이 커진 장면으로 볼 수 있어요.';
    case 'F5':
      return '손실 뒤에 마음이 바로 다음 기회를 찾는 반응이에요. 손실의 불편함을 빨리 덜어내고 싶은 자연스러운 만회 심리로 볼 수 있어요.';
    case 'F6':
      return '거래가 몰리는 날에는 확신과 흥분이 같이 커질 수 있어요. 능력 문제가 아니라 즉시 확인하고 싶은 마음이 강해진 신호일 수 있어요.';
    case 'F8':
      return '한쪽 근거에 마음이 실리면 반대 근거보다 내가 맞다고 보는 정보가 더 크게 보일 수 있어요. 확신이 커진 순간을 돌아보자는 뜻이에요.';
    default:
      return '기록은 성격을 단정하지 않고 반복된 행동의 단서만 보여줘요. 나를 탓하기보다 다음에 같은 장면을 알아차리기 위한 이름표로 보면 좋아요.';
  }
}

function firstStat(metric: Metric | undefined) {
  const entry = Object.entries(metric?.stats ?? {})[0];
  return entry ? `${entry[0]} ${entry[1]}` : undefined;
}

function headlineFor(metric: Metric | undefined) {
  const stat = firstStat(metric);
  const name = customerMetricName(metric);
  return {
    title: stat ? `기록에서 ${stat}이 가장 먼저 보였어요` : `기록에서 ${name}이 가장 먼저 보였어요`,
    primaryLabel: stat ?? `${name} 관찰 중`,
    secondaryLabel: metric?.score !== null && metric?.score !== undefined ? `행동 점수 ${metric.score}점` : undefined,
    summary: metric?.headline ?? '아직 숫자로 단정하기보다 다음 기록에서 반복 여부를 보는 단계예요.',
  };
}

function selfGapFor(comparisonCopy: string | undefined) {
  if (!comparisonCopy) return undefined;
  const [expectedRaw, actualRaw] = comparisonCopy.split('|').map((item) => item.trim()).filter(Boolean);
  return {
    title: '내가 답한 나 vs 기록된 나' as const,
    expected: expectedRaw ?? '설문에서 답한 나',
    actual: actualRaw ?? '기록 속 나',
    summary: '아하 포인트는 평가가 아니라, 내가 믿던 나와 기록 속 행동이 어긋난 지점을 찾는 데 있어요.',
  };
}

function strengthFor(metric: Metric | undefined) {
  if (!metric) {
    return {
      title: '반전: 이미 잘하고 있는 것',
      evidence: '표본이 부족한 지표를 억지로 단정하지 않은 점은 좋은 출발이에요. 기록이 더 쌓이면 강점도 더 선명해져요.',
    };
  }
  if (metric.id === 'F7') {
    return {
      title: '반전: 이미 잘하고 있는 것',
      evidence: `${firstStat(metric) ?? '새벽 시간대 거래 비중이 낮은 편이에요'}. 감정이 흔들리기 쉬운 시간을 피한 건 이미 잘하고 있는 것 중 하나예요.`,
    };
  }
  return {
    title: '반전: 이미 잘하고 있는 것',
    evidence: `${customerMetricName(metric)}에서는 비교적 안정적인 흐름이 보였어요. 잘한 부분도 같이 봐야 다음 달 실험을 이어가기 쉬워요.`,
  };
}

function experimentFor(metric: Metric | undefined) {
  switch (metric?.id) {
    case 'F1':
      return {
        title: '다음 달 실험 1개' as const,
        action: '손실 상태에서 정리 여부를 고민할 때 “지금 새로 시작해도 같은 선택을 할까?”를 한 번 적어보세요.',
        nextUploadPromise: '다음 업로드 때 손실 보유기간이 줄었는지 비교해 드릴게요.',
      };
    case 'F3':
      return {
        title: '다음 달 실험 1개' as const,
        action: '오른 뒤 따라 들어가고 싶을 때 “지금 놓친 기회를 되찾고 싶은 마음인가?”를 한 번 적어보세요.',
        nextUploadPromise: '다음 업로드 때 오른 뒤 따라 산 기록이 줄었는지 비교해 드릴게요.',
      };
    case 'F5':
      return {
        title: '다음 달 실험 1개' as const,
        action: '손실을 확정한 직후에는 바로 다음 거래를 찾기 전에 “지금 만회하고 싶은가?”를 한 번 적어보세요.',
        nextUploadPromise: '다음 업로드 때 손실 뒤 재진입 간격이 달라졌는지 비교해 드릴게요.',
      };
    default:
      return {
        title: '다음 달 실험 1개' as const,
        action: '같은 상황이 다시 오면 바로 행동하기 전에 “지금 감정이 먼저 움직였나, 기준이 먼저 있었나?”를 한 번 적어보세요.',
        nextUploadPromise: '다음 업로드 때 같은 패턴이 줄었는지 비교해 드릴게요.',
      };
  }
}

function mbtiAnalogyFor(mbti: GeneralMbti | undefined, metric: Metric | undefined) {
  if (!mbti || mbti === 'unknown' || mbti === 'no_input') return undefined;
  const mode = metric?.id === 'F1' ? '끝까지 믿어주는 보호자 모드' : metric?.id === 'F3' ? '기회를 놓치기 싫은 추적자 모드' : '기록을 다시 확인하는 관찰자 모드';
  return {
    title: '재미로 보는 비유' as const,
    body: `평소 ${mbti}라고 답했다면, 이번 기록에서는 “${mode}”가 살짝 보였어요.`,
    disclaimer: '성격 진단이 아니라 재미용 비유예요.',
  };
}


function adaptCanonicalPatternCard(card: CanonicalAiPatternCard): AiPatternCard {
  return {
    title: card.title,
    headline: {
      title: card.headline.title,
      primaryLabel: card.headline.profitLabel ?? card.headline.title,
      secondaryLabel: card.headline.lossLabel,
      summary: [card.headline.profitLabel, card.headline.lossLabel].filter(Boolean).join(' · ') || card.headline.title,
    },
    selfGap: card.selfGap
      ? {
          title: '내가 답한 나 vs 기록된 나',
          expected: card.selfGap.expected,
          actual: card.selfGap.actual,
          summary: card.selfGap.summary,
        }
      : undefined,
    patternName: {
      label: '이 패턴의 이름',
      name: card.pattern.name,
      explanation: card.pattern.explanation,
    },
    strength: card.strength,
    experiment: {
      title: '다음 달 실험 1개',
      action: card.experiment.action,
      nextUploadPromise: card.experiment.nextUploadPromise,
    },
    mbtiAnalogy: card.mbtiAnalogy
      ? {
          title: '재미로 보는 비유',
          body: card.mbtiAnalogy.text.replace(/^재미로 보는 비유:\s*/, ''),
          disclaimer: card.mbtiAnalogy.disclaimer,
        }
      : undefined,
    safetyCopy: card.safetyCopy,
  };
}

function buildPatternCard(input: AiBehaviorCoachingInput, primaryWeak: Metric | undefined, primaryStrong: Metric | undefined): AiPatternCard {
  if (input.derivedSeries && input.expectationComparisons) {
    return adaptCanonicalPatternCard(buildAiPatternCard({
      generalMbti: input.generalMbti,
      metrics: input.metrics,
      derivedSeries: input.derivedSeries,
      expectationComparisons: input.expectationComparisons,
    }));
  }
  return {
    title: '이번 기록에서 가장 선명했던 패턴',
    headline: headlineFor(primaryWeak),
    selfGap: selfGapFor(input.comparisonCopy),
    patternName: {
      label: '이 패턴의 이름',
      name: patternNameFor(primaryWeak),
      explanation: patternExplanationFor(primaryWeak),
    },
    strength: strengthFor(primaryStrong),
    experiment: experimentFor(primaryWeak),
    mbtiAnalogy: mbtiAnalogyFor(input.generalMbti, primaryWeak),
    safetyCopy: '매수·매도 추천이 아닌 과거 기록 회고입니다.',
  };
}

export function buildAiBehaviorCoaching(input: AiBehaviorCoachingInput): AiBehaviorCoaching {
  const weakest = weakestMetrics(input.metrics);
  const strongest = strongestMetrics(input.metrics);
  const primaryWeak = weakest[0];
  const secondaryWeak = weakest[1];
  const primaryStrong = strongest[0];
  const mbti = mbtiLabel(input.generalMbti);
  const keySignals = [primaryWeak, secondaryWeak]
    .filter((metric): metric is Metric => Boolean(metric))
    .map((metric) => `${displayMetricName(metric)} · ${metric.score ?? '측정 중'}점 · ${metric.headline}`)
    .slice(0, 2);

  return {
    coachingType: coachingTypeFor(primaryWeak),
    title: 'AI 행동코칭',
    eyebrow: '핵심 지표 다음에 보는 심리 기반 AI 회고',
    intro: `${mbti}과 이번 분석의 핵심 지표를 함께 보면, “아하, 내가 이럴 때 이렇게 반응하는구나” 싶은 심리 패턴을 찾을 수 있어요. 투자 판단이 아니라 과거 기록을 초보자도 이해하기 쉽게 풀어보는 해설이에요.`,
    keySignals,
    reduceActions: [reduceActionFor(primaryWeak)],
    reinforceActions: [reinforceActionFor(primaryStrong)],
    nextQuestion: `다음 달 실험: “${displayMetricName(primaryWeak ?? primaryStrong ?? input.metrics[0])} 상황에서 내가 먼저 느낀 감정은 무엇이었고, 그때의 확인 질문을 한 줄 메모로 남겼을까요?”를 다시 확인해보세요.`,
    safetyCopy: '매수·매도 추천이 아니라 과거 거래 기록을 바탕으로 한 행동 회고입니다.',
    patternCard: buildPatternCard(input, primaryWeak, primaryStrong),
  };
}
