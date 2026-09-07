// 목업 전용 더미 데이터. 실제 DB 연동(다음 계획)에서 제거된다.
export type MockRecord = {
  id: string;
  exchange: '업비트' | '빗썸' | '바이낸스' | '기타';
  symbol: string;
  side: 'buy' | 'sell';
  executedAt: string;
  price: number;
  quantity: number;
  reasonTags: string[];
  emotionTags: string[];
  targetPrice?: number;
  stopLossPrice?: number;
  memo?: string;
};

export const mockRecords: MockRecord[] = [
  {
    id: '1',
    exchange: '업비트',
    symbol: 'BTC',
    side: 'buy',
    executedAt: '2026-08-09T14:32:00+09:00',
    price: 92_400_000,
    quantity: 0.012,
    reasonTags: ['그냥/느낌'],
    emotionTags: ['FOMO', '조급'],
    memo: '급등하길래 홀린 듯이 매수',
  },
  {
    id: '2',
    exchange: '업비트',
    symbol: 'XRP',
    side: 'sell',
    executedAt: '2026-08-09T09:10:00+09:00',
    price: 820,
    quantity: 1500,
    reasonTags: ['차트'],
    emotionTags: ['불안'],
    stopLossPrice: 800,
    memo: '정한 기준가 근처라 정리',
  },
  {
    id: '3',
    exchange: '빗썸',
    symbol: 'ETH',
    side: 'buy',
    executedAt: '2026-08-08T21:47:00+09:00',
    price: 4_650_000,
    quantity: 0.3,
    reasonTags: ['뉴스', '장기보유'],
    emotionTags: ['확신'],
    targetPrice: 5_200_000,
    stopLossPrice: 4_300_000,
  },
  {
    id: '4',
    exchange: '업비트',
    symbol: 'DOGE',
    side: 'buy',
    executedAt: '2026-08-07T23:58:00+09:00',
    price: 210,
    quantity: 5000,
    reasonTags: ['커뮤니티', '그냥/느낌'],
    emotionTags: ['FOMO'],
    memo: '커뮤니티에서 난리나서 급하게',
  },
  {
    id: '5',
    exchange: '바이낸스',
    symbol: 'SOL',
    side: 'sell',
    executedAt: '2026-08-06T11:05:00+09:00',
    price: 268_000,
    quantity: 2.1,
    reasonTags: ['차트'],
    emotionTags: ['무덤덤'],
  },
];

export const mockWeeklySummary = {
  scoreValue: 68,
  scoreDelta: 4,
  scoreDriver: '손실 관리 개선이 견인',
  tradeCount: 12,
  planComplianceRate: 62,
  riskHighlight: '최근 7일 매수 8건 중 5건이 근거 태그 없이 기록됐어요',
};
