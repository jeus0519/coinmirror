export type DiagnosisQuestionId =
  | 'experience'
  | 'style'
  | 'painPoint'
  | 'goal'
  | 'lossLimit'
  | 'tradeTime'
  | 'planning';

export type DiagnosisAnswer = {
  questionId: DiagnosisQuestionId;
  optionId: string;
};

export type DiagnosisQuestion = {
  id: DiagnosisQuestionId;
  title: string;
  description: string;
  options: {
    id: string;
    label: string;
    scoreLinks: string[];
  }[];
};

export const diagnosisQuestions: DiagnosisQuestion[] = [
  {
    id: 'experience',
    title: '크립토 투자를 시작한 지 얼마나 되셨나요?',
    description: '경험 기간은 스코어 설명의 깊이와 용어 수준을 조절하는 데 사용합니다.',
    options: [
      { id: 'under_3m', label: '3개월 미만', scoreLinks: ['기본 설명 강화', '면책 안내'] },
      { id: '3m_1y', label: '3개월~1년', scoreLinks: ['기본 지표', '반복 패턴'] },
      { id: '1y_3y', label: '1~3년', scoreLinks: ['행동 패턴 비교', '목표 관리'] },
      { id: 'over_3y', label: '3년 이상', scoreLinks: ['심화 지표', '장기 추이'] },
    ],
  },
  {
    id: 'style',
    title: '평소 투자 스타일에 가장 가까운 것은 무엇인가요?',
    description: '같은 거래 빈도라도 단기형과 장기형의 해석 기준은 달라질 수 있습니다.',
    options: [
      { id: 'swing', label: '단기 매매 / 스윙', scoreLinks: ['M1 과매매', 'M6 야간 거래'] },
      { id: 'long_term', label: '중장기 보유', scoreLinks: ['M2 손익 비대칭', '보유시간'] },
      { id: 'momentum', label: '급등 종목 대응', scoreLinks: ['M3 추격 진입', 'M5 손실 후 재진입'] },
      { id: 'unclear', label: '아직 명확한 스타일이 없음', scoreLinks: ['진단 질문', '목표 설정'] },
    ],
  },
  {
    id: 'painPoint',
    title: '투자할 때 가장 자주 반복되는 고민은 무엇인가요?',
    description: '가장 먼저 확인할 위험 행동 지표를 정합니다.',
    options: [
      { id: 'chase', label: '급등하면 늦게라도 따라 산다', scoreLinks: ['M3 추격 진입'] },
      { id: 'hold_loss', label: '손실 중인 종목을 오래 들고 간다', scoreLinks: ['M2 손익 비대칭'] },
      { id: 'revenge', label: '손절 후 다시 급하게 진입한다', scoreLinks: ['M5 손실 후 재진입'] },
      { id: 'overtrade', label: '거래 횟수가 너무 많다', scoreLinks: ['M1 과매매'] },
      { id: 'no_plan', label: '계획 없이 매수/매도한다', scoreLinks: ['목표 설정', '워크시트'] },
    ],
  },
  {
    id: 'goal',
    title: '코인미러를 통해 가장 확인하고 싶은 것은 무엇인가요?',
    description: '분석 리포트의 첫 문장과 목표 템플릿 추천에 반영됩니다.',
    options: [
      { id: 'reduce_impulse', label: '뇌동매매를 줄이고 싶다', scoreLinks: ['M1 과매매', 'M3 추격 진입'] },
      { id: 'follow_stop', label: '손절 규칙을 지키고 싶다', scoreLinks: ['M2 손익 비대칭'] },
      { id: 'reduce_count', label: '매매 횟수를 줄이고 싶다', scoreLinks: ['M1 과매매'] },
      { id: 'objective_view', label: '내 투자 습관을 객관적으로 보고 싶다', scoreLinks: ['전체 스코어'] },
      { id: 'principle', label: '장기적으로 원칙 매매를 만들고 싶다', scoreLinks: ['목표·진행', '워크시트'] },
    ],
  },
  {
    id: 'lossLimit',
    title: '한 종목에서 어느 정도 손실이면 점검이 필요하다고 느끼나요?',
    description: '손실 관련 지표와 내 원칙의 기본값을 개인화합니다.',
    options: [
      { id: '5', label: '-5%', scoreLinks: ['손실 기준', '보수형'] },
      { id: '10', label: '-10%', scoreLinks: ['M4 물타기', '손절 기준'] },
      { id: '20', label: '-20%', scoreLinks: ['M2 손익 비대칭'] },
      { id: '30', label: '-30% 이상', scoreLinks: ['고위험 구간 점검'] },
      { id: 'none', label: '아직 기준이 없다', scoreLinks: ['목표 설정'] },
    ],
  },
  {
    id: 'tradeTime',
    title: '주로 언제 거래하시나요?',
    description: '야간 거래와 감정적 진입 가능성을 해석할 때 참고합니다.',
    options: [
      { id: 'commute', label: '출근/업무 전후', scoreLinks: ['시간대 분포'] },
      { id: 'work', label: '업무 중간', scoreLinks: ['과매매 빈도'] },
      { id: 'night', label: '밤/새벽', scoreLinks: ['M6 야간 거래'] },
      { id: 'alert', label: '급등 알림을 봤을 때', scoreLinks: ['M3 추격 진입'] },
      { id: 'none', label: '정해진 시간 없음', scoreLinks: ['M1 과매매', '목표 설정'] },
    ],
  },
  {
    id: 'planning',
    title: '매수 전 목표가나 손절가를 정하는 편인가요?',
    description: '거래 기록 입력과 4주 원칙 워크시트의 기본 질문을 조정합니다.',
    options: [
      { id: 'always', label: '항상 정한다', scoreLinks: ['계획 준수율'] },
      { id: 'sometimes', label: '가끔 정한다', scoreLinks: ['워크시트'] },
      { id: 'think_only', label: '생각은 하지만 기록하지 않는다', scoreLinks: ['기록 습관'] },
      { id: 'rarely', label: '거의 정하지 않는다', scoreLinks: ['목표 설정'] },
    ],
  },
];

export const defaultDiagnosisAnswers: Record<DiagnosisQuestionId, string> = {
  experience: '1y_3y',
  style: 'swing',
  painPoint: 'chase',
  goal: 'reduce_impulse',
  lossLimit: '10',
  tradeTime: 'night',
  planning: 'think_only',
};

export function summarizeDiagnosis(answers: Record<DiagnosisQuestionId, string>) {
  const findLabel = (questionId: DiagnosisQuestionId) => {
    const q = diagnosisQuestions.find((item) => item.id === questionId);
    return q?.options.find((option) => option.id === answers[questionId])?.label ?? '미응답';
  };

  const pain = findLabel('painPoint');
  const goal = findLabel('goal');
  const style = findLabel('style');
  const tradeTime = findLabel('tradeTime');

  return {
    primaryFocus: pain,
    goal,
    style,
    tradeTime,
    headline: `${style} 성향으로 보이며, 우선 '${pain}' 패턴을 '${goal}' 목표와 연결해 확인합니다.`,
  };
}
