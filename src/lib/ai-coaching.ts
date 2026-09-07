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
  if (!metric) return '다음 달에는 거래 전후에 남긴 기준을 한 줄씩 기록해, 반복되는 행동을 먼저 확인해보세요.';
  switch (metric.id) {
    case 'F1':
      return '손실 상태가 길어지는 거래는 며칠째부터 다시 점검할지, 다음 분석 전까지 기준 문장 하나를 정해보세요.';
    case 'F3':
      return '급등을 본 직후에는 바로 판단하지 않고, 일정 시간이 지난 뒤에도 같은 생각인지 다시 확인해보세요.';
    case 'F5':
      return '손실 확정 직후 같은 흐름으로 다시 들어간 기록이 있는지, 다음 달에는 재진입 전 대기 시간을 체크해보세요.';
    case 'F6':
      return '거래가 몰리는 날에는 왜 거래가 늘었는지 한 줄로 남겨, 반복되는 상황을 다음 달에 비교해보세요.';
    case 'F8':
      return '특정 자산 비중이 커지는 시점에는 처음 정한 한도와 실제 기록이 얼마나 달랐는지 확인해보세요.';
    default:
      return `${displayMetricName(metric)} 지표가 낮게 나온 이유를 다음 달에도 같은 기준으로 다시 확인해보세요.`;
  }
}

function reinforceActionFor(metric: Metric | undefined) {
  if (!metric) return '표본이 부족한 지표는 단정하지 않고 판단 보류로 둔 점은 유지해도 좋아요.';
  switch (metric.id) {
    case 'F2':
      return '이익 거래를 지나치게 빨리 정리하는 신호가 강하지 않다면, 지금의 확인 리듬은 유지할 만해요.';
    case 'F7':
      return '새벽 시간대 거래 비중이 낮게 유지된다면, 감정적으로 흔들리는 시간대를 피하는 습관은 계속 지켜보세요.';
    case 'F10':
      return '여러 지표를 한 번에 단정하지 않고 종합적으로 보는 방식은 다음 분석에서도 유지해보세요.';
    default:
      return `${displayMetricName(metric)} 지표에서 안정적으로 보인 부분은 다음 달에도 같은 기준으로 확인해보세요.`;
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
    eyebrow: '키 지표 다음에 보는 AI 회고',
    intro: `${mbti}과 이번 분석의 키 지표를 함께 보고, 다음 달에 줄여볼 행동과 유지할 행동을 짧게 정리했어요.`,
    keySignals,
    reduceActions: [reduceActionFor(primaryWeak)],
    reinforceActions: [reinforceActionFor(primaryStrong)],
    nextQuestion: `다음 달에는 “${displayMetricName(primaryWeak ?? primaryStrong ?? input.metrics[0])} 지표가 이번 분석보다 나아졌을까요?”를 다시 확인해보세요.`,
    safetyCopy:
      '매수·매도 추천이 아니라 과거 거래 기록을 바탕으로 한 행동 회고입니다. 원본 거래내역과 PDF 비밀번호는 AI로 보내지 않아요.',
  };
}
