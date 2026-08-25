import { type GeneralMbti } from './investment-type';

export type DiagnosisQuestionId = 'A1' | 'A2' | 'A3' | 'A4' | 'B1' | 'B2' | 'B3' | 'B4';
export type DiagnosisBlock = 'context' | 'expectation';

export type DiagnosisProfile = Partial<{
  A1: string;
  A2: string[];
  A3: string;
  A4: string;
  B1: string;
  B2: string;
  B3: string;
  B4: string;
  generalMbti: GeneralMbti;
}>;

export type DiagnosisOption = { id: string; label: string };
export type DiagnosisQuestion = {
  id: DiagnosisQuestionId;
  block: DiagnosisBlock;
  title: string;
  description: string;
  multiple?: boolean;
  maxSelections?: number;
  options: DiagnosisOption[];
};

export type ExpectationComparison = {
  questionId: 'B1' | 'B2' | 'B3' | 'B4';
  label: string;
  expected: string;
  actual: string;
  observation: string;
  source: 'sample' | 'csv';
};

export type ExpectationActual = Omit<
  ExpectationComparison,
  'questionId' | 'expected' | 'source' | 'label'
> & {
  label?: string;
};
export type ExpectationActuals = Partial<Record<'B1' | 'B2' | 'B3' | 'B4', ExpectationActual>>;

export const diagnosisQuestions: DiagnosisQuestion[] = [
  {
    id: 'A1',
    block: 'context',
    title: '평소 투자 스타일에 가장 가까운 것은?',
    description: '점수를 바꾸지 않고 결과 설명의 맥락으로만 사용해요.',
    options: [
      { id: 'day', label: '하루 안에 사고파는 편' },
      { id: 'swing', label: '며칠~몇 주 보유' },
      { id: 'long', label: '몇 달 이상 길게 보유' },
      { id: 'momentum', label: '급등할 때만 들어가는 편' },
      { id: 'unknown', label: '아직 잘 모르겠다' },
    ],
  },
  {
    id: 'A2',
    block: 'context',
    title: '투자할 때 가장 자주 반복되는 고민은?',
    description: '최대 2개를 골라 관련 카드를 먼저 보여드려요.',
    multiple: true,
    maxSelections: 2,
    options: [
      { id: 'chase', label: '오르는 코인을 따라 산다' },
      { id: 'hold_loss', label: '손절을 못 하고 버틴다' },
      { id: 'averaging', label: '물타기를 자주 한다' },
      { id: 'overtrade', label: '거래가 너무 잦다' },
      { id: 'night', label: '새벽에 충동 매매한다' },
      { id: 'concentration', label: '한 종목에 몰아넣는다' },
    ],
  },
  {
    id: 'A3',
    block: 'context',
    title: '한 종목에서 어느 정도 손실이면 점검이 필요하다고 느끼나요?',
    description: '실제 손실 기록과 나란히 비교하며 점수 계산에는 사용하지 않아요.',
    options: [
      { id: '5', label: '-5%' },
      { id: '10', label: '-10%' },
      { id: '20', label: '-20%' },
      { id: '30', label: '-30% 이상' },
      { id: 'none', label: '기준을 정해둔 적 없다' },
    ],
  },
  {
    id: 'A4',
    block: 'context',
    title: '한 종목에 최대 몇 %까지 담아도 괜찮다고 보나요?',
    description: '선언한 한도가 있을 때만 집중도 실측값과 대조해요.',
    options: [
      { id: '10', label: '10% 이내' },
      { id: '30', label: '30% 이내' },
      { id: '50', label: '절반 이내' },
      { id: 'all_in', label: '확신 있으면 다 넣을 수도 있다' },
      { id: 'none', label: '생각해본 적 없다' },
    ],
  },
  {
    id: 'B1',
    block: 'expectation',
    title: '한 달에 몇 번 정도 거래한다고 생각하세요?',
    description: '업로드 후 월평균 주문 수와 비교해요.',
    options: [
      { id: 'under_10', label: '10회 이하' },
      { id: '11_30', label: '11~30회' },
      { id: '31_100', label: '31~100회' },
      { id: 'over_100', label: '100회 넘게' },
    ],
  },
  {
    id: 'B2',
    block: 'expectation',
    title: '주로 언제 거래한다고 생각하세요?',
    description: '거래대금 기준 실제 최빈 시간대와 비교해요.',
    options: [
      { id: 'day', label: '아침·낮' },
      { id: 'evening', label: '저녁' },
      { id: 'night', label: '밤 11시~새벽' },
      { id: 'irregular', label: '일정하지 않다' },
    ],
  },
  {
    id: 'B3',
    block: 'expectation',
    title: '이익과 손실 중 어느 쪽을 더 빨리 정리한다고 생각하세요?',
    description: '청산 거래의 실제 보유시간과 비교해요.',
    options: [
      { id: 'profit_first', label: '이익을 더 빨리' },
      { id: 'loss_first', label: '손실을 더 빨리' },
      { id: 'similar', label: '비슷하다' },
      { id: 'unknown', label: '모르겠다' },
    ],
  },
  {
    id: 'B4',
    block: 'expectation',
    title: '청산한 거래 중 이익으로 끝난 비율은 어느 정도일 것 같나요?',
    description: '실제 승률과 비교하되 수익 능력을 평가하지 않아요.',
    options: [
      { id: 'under_30', label: '30% 이하' },
      { id: '31_50', label: '31~50%' },
      { id: '51_70', label: '51~70%' },
      { id: 'over_70', label: '70% 넘게' },
    ],
  },
];

export function selectDiagnosisOption(
  profile: DiagnosisProfile,
  questionId: DiagnosisQuestionId,
  optionId: string
): DiagnosisProfile {
  const question = diagnosisQuestions.find((item) => item.id === questionId);
  if (!question?.multiple) return { ...profile, [questionId]: optionId };

  const currentValue = profile[questionId];
  const current = Array.isArray(currentValue) ? currentValue : [];
  const next = current.includes(optionId)
    ? current.filter((item) => item !== optionId)
    : [...current, optionId].slice(-(question.maxSelections ?? 1));
  return { ...profile, [questionId]: next } as DiagnosisProfile;
}

export function answeredDiagnosisCount(profile: DiagnosisProfile) {
  return diagnosisQuestions.filter((question) => {
    const value = profile[question.id];
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
  }).length;
}

export function optionLabel(questionId: DiagnosisQuestionId, optionId?: string) {
  if (!optionId) return '미응답';
  return (
    diagnosisQuestions
      .find((question) => question.id === questionId)
      ?.options.find((option) => option.id === optionId)?.label ?? '미응답'
  );
}

const SAMPLE_ACTUALS: Record<'B1' | 'B2' | 'B3' | 'B4', ExpectationActual> = {
  B1: {
    label: '월 거래 횟수',
    actual: '월평균 35.7회',
    observation: '내가 생각한 범위와 실제 월평균 주문 수를 나란히 보여드려요.',
  },
  B2: {
    label: '주 거래 시간',
    actual: '오후·저녁(14~22시)',
    observation: '새벽보다 오후와 저녁 거래대금이 더 컸어요.',
  },
  B3: {
    label: '청산 속도',
    actual: '이익 15.0일 · 손실 16.1일',
    observation: '손실 거래를 조금 더 오래 보유했어요.',
  },
  B4: {
    label: '청산 승률',
    actual: '57.9%',
    observation: '예상과 실제의 차이만 확인하고 좋고 나쁨은 판단하지 않아요.',
  },
};

export function buildExpectationComparisons(
  profile: DiagnosisProfile,
  actuals?: ExpectationActuals
): ExpectationComparison[] {
  return (['B1', 'B2', 'B3', 'B4'] as const).flatMap((questionId) => {
    const answer = profile[questionId];
    const actual = actuals?.[questionId] ?? SAMPLE_ACTUALS[questionId];
    if (typeof answer !== 'string') return [];
    return [
      {
        questionId,
        expected: optionLabel(questionId, answer),
        ...actual,
        label: actual.label ?? SAMPLE_ACTUALS[questionId].label ?? '실측 비교',
        source: actuals ? 'csv' : 'sample',
      },
    ];
  });
}

export function summarizeDiagnosis(profile: DiagnosisProfile) {
  const style = optionLabel('A1', profile.A1);
  const concerns = (profile.A2 ?? []).map((id) => optionLabel('A2', id));
  const answered = answeredDiagnosisCount(profile);
  return {
    style,
    concerns,
    answered,
    headline:
      answered === 0
        ? '아직 답하지 않아도 괜찮아요. 거래 기록만으로 먼저 살펴볼 수 있어요.'
        : `${profile.A1 ? `${style} 맥락에서 ` : ''}${concerns.length ? concerns.join(' · ') : '선택한 기준'} 관련 카드를 먼저 보여드려요. 점수 자체는 거래 기록으로만 계산합니다.`,
  };
}
