import { type GeneralMbti } from './investment-type';
import { type Metric, displayMetricName, scoreLevel } from './mock-metrics';

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
    return '쉽게 풀어보면, 아직은 한 가지 성향으로 단정하기보다 거래 전후에 무엇을 생각했는지 기록하는 단계예요. 다음 달에는 거래 직전 이유와 거래 직후 감정을 한 줄씩 남겨, 반복되는 심리 패턴을 먼저 확인해보세요.';
  }
  switch (metric.id) {
    case 'F1':
      return '쉽게 말하면 손실회피 때문에 손실을 확정하기 싫어 판단을 미루는 흐름일 수 있어요. 다음 달에는 손실 상태가 며칠째 이어질 때 다시 점검할지 미리 정하고, 그 기준을 넘으면 감정이 아니라 기록으로 확인해보세요.';
    case 'F3':
      return '쉽게 풀어보면 가격이 오를 때 놓칠까 봐 따라붙는 FOMO와 즉시 보상 심리가 섞일 수 있어요. 직전 본인 체결가보다 높은 가격에 바로 들어가기 전, 10분 뒤에도 같은 판단인지 한 번 적어보세요.';
    case 'F5':
      return '쉽게 말하면 손실을 빨리 만회하고 싶은 즉시 보상 욕구와 감정 조절 문제가 같이 나타날 수 있어요. 손실 확정 직후에는 바로 재진입하지 말고, 다음 달에는 최소 대기 시간과 재진입 이유 한 줄을 체크해보세요.';
    case 'F6':
      return '쉽게 풀어보면 거래가 몰리는 날은 확증편향이나 흥분 상태 때문에 같은 판단을 반복하기 쉬워요. 거래가 갑자기 늘어난 날에는 “왜 지금 계속 누르고 있는지”를 한 줄로 남겨 다음 분석 때 비교해보세요.';
    case 'F8':
      return '쉽게 말하면 특정 자산에 비중이 커질 때는 내가 맞다고 보는 정보만 더 찾는 확증편향이 강해질 수 있어요. 비중이 커지는 시점마다 처음 정한 한도와 실제 기록이 얼마나 달랐는지 확인해보세요.';
    default:
      return `쉽게 풀어보면 ${displayMetricName(metric)} 지표는 반복 습관을 보는 신호예요. 다음 달에는 같은 상황에서 어떤 감정과 생각이 먼저 올라왔는지 적고, 이번 기록과 같은 기준으로 비교해보세요.`;
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
    intro: `${mbti}과 이번 분석의 핵심 지표를 함께 보고, 초보자도 이해하기 쉽게 심리 패턴과 다음 달 행동을 풀어봤어요.`,
    keySignals,
    reduceActions: [reduceActionFor(primaryWeak)],
    reinforceActions: [reinforceActionFor(primaryStrong)],
    nextQuestion: `다음 달에는 “${displayMetricName(primaryWeak ?? primaryStrong ?? input.metrics[0])} 상황에서 내가 먼저 느낀 감정은 무엇이었고, 이번보다 한 번 더 멈췄을까요?”를 다시 확인해보세요.`,
    safetyCopy:
      '매수·매도 추천이 아니라 과거 거래 기록을 바탕으로 한 행동 회고입니다. 원본 거래내역과 PDF 비밀번호는 AI로 보내지 않아요.',
  };
}
