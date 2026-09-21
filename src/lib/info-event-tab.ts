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
          value: '확인 중',
          description: '서버에서 최신 공개 지표를 확인하고 있어요.',
          tone: 'neutral',
        },
        {
          label: 'BTC 24시간 가격 변화',
          value: '확인 중',
          description: '거래량이 아니라 가격 기준 변화예요. 기준은 업비트 KRW-BTC입니다.',
          tone: 'neutral',
        },
      ],
      reading: '두 지표는 매수·매도 판단이 아니라 당시 시장 배경을 돌아보는 참고 정보예요.',
    },
    upbitKrwInterest: {
      title: '업비트 KRW 시장 관심 분포',
      description: 'BTC·ETH·XRP는 기본으로 보고, 그 외 자산 중 최근 24시간 KRW 거래대금 상위 3개를 함께 봐요.',
      assets: [
        {
          rankLabel: '기본 확인',
          symbol: 'BTC',
          note: '시장 기준 자산으로 함께 확인',
          badge: '기본',
          volumeShareLabel: '거래대금 비중 확인 중',
        },
        {
          rankLabel: '기본 확인',
          symbol: 'ETH',
          note: '시장 기준 자산으로 함께 확인',
          badge: '기본',
          volumeShareLabel: '거래대금 비중 확인 중',
        },
        {
          rankLabel: '기본 확인',
          symbol: 'XRP',
          note: '시장 기준 자산으로 함께 확인',
          badge: '기본',
          volumeShareLabel: '거래대금 비중 확인 중',
        },
      ],
      note: '실데이터가 확인되면 BTC·ETH·XRP와 세 자산을 제외한 최근 24시간 거래대금 상위 3개의 전체 KRW 거래대금 대비 비중을 보여줘요.',
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
