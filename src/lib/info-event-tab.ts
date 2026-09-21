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
      title: '오늘 시장 온도',
      description: '시장 분위기를 과열·공포 단정이 아니라 회고 배경으로만 봐요.',
      metrics: [
        {
          label: '공포·탐욕 지수',
          value: '54',
          description: '중립에 가까운 구간',
          tone: 'neutral',
        },
        {
          label: 'BTC 24시간 변화',
          value: '+0.8%',
          description: '급등락보다 관망에 가까움',
          tone: 'up',
        },
      ],
      reading: '오늘은 “관심은 있지만 과열로 단정하기 어려운” 시장 배경으로 볼 수 있어요.',
    },
    upbitKrwInterest: {
      title: '업비트 KRW 시장 관심 분포',
      description: '최근 24시간 거래대금이 많이 몰린 자산입니다. 순위보다 관심이 어디에 몰렸는지만 참고해요.',
      assets: [
        { rankLabel: '상위권', symbol: 'BTC', note: '대표 자산 · 시장 기준점', badge: '대표' },
        { rankLabel: '상위권', symbol: 'ETH', note: '대표 알트 · 시장 동조 확인', badge: '대표' },
        { rankLabel: '테더 포함', symbol: 'USDT', note: '대기/환전성 거래 참고', badge: 'USDT' },
        { rankLabel: '4~10위 묶음', symbol: 'XRP · SOL · AVAX 외', note: '알트 관심이 넓게 퍼진 구간', badge: '묶음' },
      ],
      note: '리스트는 매수 후보가 아니라 시장 소음의 위치를 보는 배경 지표예요.',
    },
    reflectionPrompts: [
      {
        title: 'FOMO 체크',
        question: '거래대금이 몰린 날에 내가 더 빨리 매수했는지 다음 파일에서 비교해볼까요?',
      },
      {
        title: '테더 체크',
        question: 'USDT 거래가 활발한 날에 내 거래가 관망이었는지, 아니면 추격이었는지 볼 수 있어요.',
      },
      {
        title: '다음 업로드 질문',
        question: '시장 관심이 큰 날일수록 내 매수 간격이 짧아졌는지 확인해요.',
      },
    ],
    exchangeEvents: {
      title: '거래소 이벤트 참고',
      description: '업비트와 빗썸이 공개한 이벤트 공지를 원문 링크 중심으로 모아요.',
      updatedAtLabel: '서버 캐시 기준 · 이벤트 공지는 약 3시간마다 확인',
      upbit: [
        {
          exchange: '업비트',
          title: 'BTC 마켓 및 USDT 마켓 거래 수수료 인하 이벤트 안내',
          summary: '업비트 이벤트 탭 원문에서 기간과 조건을 확인하세요.',
          url: upbitNoticeBaseUrl,
        },
        {
          exchange: '업비트',
          title: '[입금·거래 더블 챌린지 ②] BTC·USDT 마켓 대상 TOP 30 트레이딩 이벤트',
          summary: '업비트 이벤트 탭 원문에서 대상 마켓과 유의사항을 확인하세요.',
          url: upbitNoticeBaseUrl,
        },
        {
          exchange: '업비트',
          title: '[입금·거래 더블 챌린지 ①] 업비트로 입금하고 업비트에서 매도하면 비트코인 경품 안내',
          summary: '업비트 이벤트 탭 원문에서 참여 조건과 종료 여부를 확인하세요.',
          url: upbitNoticeBaseUrl,
        },
      ],
      bithumb: [
        {
          exchange: '빗썸',
          title: '창립 13주년 기념 - 플러스 클럽 등록하면, 연 13% 드려요!',
          publishedAt: '2026.09.16',
          summary: '빗썸 이벤트 원문에서 기간, 조건, 유의사항을 확인하세요.',
          url: 'https://www.bithumb.com/react/feed/event/255',
        },
        {
          exchange: '빗썸',
          title: '[이벤트] 빗썸 API를 처음 시작하신다면 1,000억원 거래까지 수수료 무료!',
          publishedAt: '2026.09.16',
          summary: '빗썸 이벤트 원문에서 수수료 혜택 조건을 확인하세요.',
          url: 'https://www.bithumb.com/react/feed/event/227',
        },
        {
          exchange: '빗썸',
          title: '[이벤트] 더 강력해진 VIP 매칭 프로그램! 빗썸으로 이동하시면, 국내 최고 VIP 혜택을 즉시 드립니다!',
          publishedAt: '2026.09.16',
          summary: '빗썸 이벤트 원문에서 VIP 매칭 조건과 제한 사항을 확인하세요.',
          url: 'https://www.bithumb.com/react/feed/event/228',
        },
      ],
      safetyCopy: '거래소 이벤트는 각 거래소가 게시한 공개 공지입니다. 코인미러는 이벤트 참여나 특정 거래를 권유하지 않아요.',
    },
    systemNotes: ['서버 캐시 15분', '이벤트 캐시 3시간', '브라우저 직접 호출 없음', '실패 시 마지막 캐시 또는 원문 링크'],
    safetyCopy: '이 정보는 매수·매도 추천이 아니라, 내 거래 습관을 돌아보기 위한 시장 배경입니다.',
  };
}
