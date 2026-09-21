export type MarketMetric = {
  label: string;
  value: string;
  description: string;
  tone?: 'neutral' | 'up' | 'down';
};

export type MarketInterestAsset = {
  rankLabel: string;
  symbol: string;
  note: string;
  badge: string;
  volumeShareLabel: string;
};

export type ReflectionPrompt = {
  title: string;
  question: string;
};

export type ExchangeEventItem = {
  exchange: '업비트' | '빗썸';
  title: string;
  summary: string;
  url: string;
  publishedAt?: string;
};

export type InfoEventTabViewModel = {
  title: string;
  description: string;
  marketTemperature: {
    title: string;
    description: string;
    metrics: MarketMetric[];
    reading: string;
  };
  upbitKrwInterest: {
    title: string;
    description: string;
    assets: MarketInterestAsset[];
    note: string;
  };
  reflectionPrompts: ReflectionPrompt[];
  exchangeEvents: {
    title: string;
    description: string;
    updatedAtLabel: string;
    upbit: ExchangeEventItem[];
    bithumb: ExchangeEventItem[];
    safetyCopy: string;
  };
  systemNotes: string[];
  safetyCopy: string;
};

const upbitNoticeBaseUrl = 'https://www.upbit.com/service_center/notice';

export function buildInfoEventTabViewModel(): InfoEventTabViewModel {
  return {
    title: '시장 배경과 거래소 이벤트',
    description: '매수·매도 추천이 아니라, 내 거래 습관을 돌아보기 위한 공개 정보만 모았어요.',
    marketTemperature: {
      title: '오늘 시장 분위기',
      description: '시장 분위기를 과열·공포 단정이 아니라 회고 배경으로만 봐요.',
      metrics: [
        {
          label: '공포·탐욕 지수',
          value: '54',
          description: '중립에 가까운 구간',
          tone: 'neutral',
        },
        {
          label: 'BTC 24시간 가격 변화',
          value: '+0.8%',
          description: '거래량이 아니라 가격 기준 변화예요. 기준은 업비트 KRW-BTC입니다.',
          tone: 'up',
        },
      ],
      reading: '오늘은 “관심은 있지만 과열로 단정하기 어려운” 시장 배경으로 볼 수 있어요.',
    },
    upbitKrwInterest: {
      title: '업비트 KRW 시장 관심 분포',
      description: '최근 24시간 KRW 마켓 거래대금에서 USDT를 포함해 관심이 몰린 3개 자산만 봐요.',
      assets: [
        {
          rankLabel: '상위 1',
          symbol: 'G',
          note: '최근 24시간 거래대금이 가장 많이 몰린 자산',
          badge: '거래대금',
          volumeShareLabel: '전체 거래대금 중 10.2%',
        },
        {
          rankLabel: '상위 2',
          symbol: 'XRP',
          note: 'KRW 마켓에서 거래 관심이 크게 잡힌 자산',
          badge: '거래대금',
          volumeShareLabel: '전체 거래대금 중 9.3%',
        },
        {
          rankLabel: '테더 포함',
          symbol: 'USDT',
          note: '대기/환전성 거래 참고 지표',
          badge: 'USDT',
          volumeShareLabel: '전체 거래대금 중 3.3%',
        },
      ],
      note: '비중은 업비트 KRW 마켓 24시간 거래대금 합계 대비입니다. 매수 후보가 아니라 시장 관심이 어디에 몰렸는지 보는 배경 지표예요.',
    },
    reflectionPrompts: [],
    exchangeEvents: {
      title: '거래소 이벤트 참고',
      description: '업비트와 빗썸이 공개한 최신 이벤트 공지를 거래소 링크 중심으로 모아요.',
      updatedAtLabel: '서버 캐시 기준 · 이벤트 공지는 약 3시간마다 확인',
      upbit: [
        {
          exchange: '업비트',
          title: 'BTC 마켓 및 USDT 마켓 거래 수수료 인하 이벤트 안내',
          summary: '기간, 조건, 종료 여부는 거래소에서 직접 확인하세요.',
          url: upbitNoticeBaseUrl,
        },
        {
          exchange: '업비트',
          title: '[입금·거래 더블 챌린지 ②] BTC·USDT 마켓 대상 TOP 30 트레이딩 이벤트',
          summary: '대상 마켓과 유의사항은 거래소에서 직접 확인하세요.',
          url: upbitNoticeBaseUrl,
        },
        {
          exchange: '업비트',
          title: '[입금·거래 더블 챌린지 ①] 업비트로 입금하고 업비트에서 매도하면 비트코인 경품 안내',
          summary: '참여 조건과 종료 여부는 거래소에서 직접 확인하세요.',
          url: upbitNoticeBaseUrl,
        },
      ],
      bithumb: [
        {
          exchange: '빗썸',
          title: '창립 13주년 기념 - 플러스 클럽 등록하면, 연 13% 드려요!',
          publishedAt: '2026.09.16',
          summary: '기간, 조건, 유의사항은 거래소에서 직접 확인하세요.',
          url: 'https://www.bithumb.com/react/feed/event/255',
        },
        {
          exchange: '빗썸',
          title: '[이벤트] 빗썸 API를 처음 시작하신다면 1,000억원 거래까지 수수료 무료!',
          publishedAt: '2026.09.16',
          summary: '수수료 혜택 조건은 거래소에서 직접 확인하세요.',
          url: 'https://www.bithumb.com/react/feed/event/227',
        },
        {
          exchange: '빗썸',
          title: '[이벤트] 더 강력해진 VIP 매칭 프로그램! 빗썸으로 이동하시면, 국내 최고 VIP 혜택을 즉시 드립니다!',
          publishedAt: '2026.09.16',
          summary: 'VIP 매칭 조건과 제한 사항은 거래소에서 직접 확인하세요.',
          url: 'https://www.bithumb.com/react/feed/event/228',
        },
      ],
      safetyCopy: '거래소 이벤트는 각 거래소가 게시한 공개 공지입니다. 코인미러는 이벤트 참여나 특정 거래를 권유하지 않아요.',
    },
    systemNotes: ['서버 캐시 15분', '이벤트 캐시 3시간', '브라우저 직접 호출 없음', '실패 시 마지막 캐시 또는 거래소 링크'],
    safetyCopy: '이 정보는 매수·매도 추천이 아니라, 내 거래 습관을 돌아보기 위한 시장 배경입니다.',
  };
}
