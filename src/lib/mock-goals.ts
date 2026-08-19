export type PrinciplePreset = {
  id: string;
  label: string;
  description: string;
  check: string;
  current: string;
  achieved: boolean | null;
};

export const principlePresets: PrinciplePreset[] = [
  {
    id: 'cooldown-after-loss',
    label: '손실 뒤 2시간 쉬기',
    description: '손실 청산 직후 같은 종목에 급히 다시 들어가지 않아요.',
    check: '다음 분석에서 2시간 내 복구매수 건수 확인',
    current: '최근 7건',
    achieved: false,
  },
  {
    id: 'no-dawn-trade',
    label: '새벽 매매 줄이기',
    description: '00~06시에는 새 주문을 만들지 않아요.',
    check: '다음 분석에서 새벽 거래대금 비중 확인',
    current: '최근 6%',
    achieved: true,
  },
  {
    id: 'one-position-limit',
    label: '한 종목 집중 피하기',
    description: '한 종목 비중이 스스로 정한 범위를 넘는지 확인해요.',
    check: '다음 분석에서 최대 종목 집중도 확인',
    current: '최근 24%',
    achieved: null,
  },
  {
    id: 'one-day-off',
    label: '주 1회 매매 없는 날',
    description: '거래하지 않는 하루를 정해 과열된 리듬을 끊어봐요.',
    check: '다음 분석에서 주간 비활동일 확인',
    current: '최근 주 2일',
    achieved: true,
  },
  {
    id: 'avoid-chasing',
    label: '급등 직후 따라 사지 않기',
    description: '급등한 종목은 바로 진입하지 않고 한 번 더 관찰해요.',
    check: '다음 분석에서 추격매수 비중 확인',
    current: '최근 14%',
    achieved: false,
  },
];

export const weeklyTrend = [
  { week: '7/14', compositeScore: 62, tradeCount: 9 },
  { week: '7/21', compositeScore: 65, tradeCount: 14 },
  { week: '7/28', compositeScore: 67, tradeCount: 11 },
  { week: '8/4', compositeScore: 69, tradeCount: 12 },
];
