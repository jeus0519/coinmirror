// docs/coinmirror_demo.html assetCard()/eventCard() 데이터 구조.
export type AssetInfo = {
  symbol: string;
  name: string;
  category: string;
  summary: string;
  consensus: string;
  launched: string;
  krwMarkets: string[];
  inMyHistory: boolean;
  official: string;
  whitepaper: string;
};

export const assetInfoList: AssetInfo[] = [
  {
    symbol: 'BTC',
    name: '비트코인',
    category: '레이어1',
    summary: '최초의 탈중앙 디지털 자산. 발행량 2,100만 개로 고정.',
    consensus: 'PoW',
    launched: '2009',
    krwMarkets: ['업비트', '빗썸'],
    inMyHistory: true,
    official: 'https://bitcoin.org',
    whitepaper: 'https://bitcoin.org/bitcoin.pdf',
  },
  {
    symbol: 'ETH',
    name: '이더리움',
    category: '레이어1 · 스마트컨트랙트',
    summary: '스마트 컨트랙트 플랫폼의 대표 격. PoS 전환 완료.',
    consensus: 'PoS',
    launched: '2015',
    krwMarkets: ['업비트', '빗썸'],
    inMyHistory: true,
    official: 'https://ethereum.org',
    whitepaper: 'https://ethereum.org/whitepaper',
  },
  {
    symbol: 'XRP',
    name: '리플',
    category: '결제·송금',
    summary: '국경 간 결제 속도·비용 개선을 목표로 하는 프로젝트.',
    consensus: 'XRPL Consensus',
    launched: '2012',
    krwMarkets: ['업비트', '빗썸'],
    inMyHistory: true,
    official: 'https://ripple.com',
    whitepaper: 'https://ripple.com/files/ripple_consensus_whitepaper.pdf',
  },
  {
    symbol: 'DOGE',
    name: '도지코인',
    category: '밈코인',
    summary: '밈에서 출발한 커뮤니티 중심 프로젝트.',
    consensus: 'PoW',
    launched: '2013',
    krwMarkets: ['업비트', '빗썸'],
    inMyHistory: true,
    official: 'https://dogecoin.com',
    whitepaper: 'https://github.com/dogecoin/dogecoin',
  },
  {
    symbol: 'SOL',
    name: '솔라나',
    category: '레이어1',
    summary: '고속·저비용 처리량을 내세우는 스마트컨트랙트 플랫폼.',
    consensus: 'PoH + PoS',
    launched: '2020',
    krwMarkets: ['업비트', '바이낸스'],
    inMyHistory: true,
    official: 'https://solana.com',
    whitepaper: 'https://solana.com/solana-whitepaper.pdf',
  },
  {
    symbol: 'ADA',
    name: '에이다',
    category: '레이어1',
    summary: '학술 연구 기반 개발 프로세스를 표방하는 스마트컨트랙트 플랫폼.',
    consensus: 'PoS',
    launched: '2017',
    krwMarkets: ['업비트', '빗썸'],
    inMyHistory: false,
    official: 'https://cardano.org',
    whitepaper: 'https://cardano.org/research',
  },
];

export type ExchangeEvent = {
  title: string;
  exchange: string;
  type: string;
  relatedSymbols: string[];
  period: string;
  requirement: string;
  rewardForm: string;
  riskNote: string;
  noticeUrl: string;
  matchesMyHistory: boolean;
};

export const exchangeEvents: ExchangeEvent[] = [
  {
    title: 'ETH 스테이킹 리워드 이벤트',
    exchange: '업비트',
    type: '스테이킹',
    relatedSymbols: ['ETH'],
    period: '2026-08-01 ~ 2026-08-31',
    requirement: '최소 0.1 ETH 보유 후 스테이킹 신청',
    rewardForm: '연 환산 리워드(변동)',
    riskNote: '중도 해지 시 언스테이킹 대기기간이 있을 수 있어요. 조건은 공지에서 직접 확인하세요.',
    noticeUrl: 'https://upbit.com/service_center/notice',
    matchesMyHistory: true,
  },
  {
    title: 'SOL 네트워크 정기 점검',
    exchange: '바이낸스',
    type: '점검',
    relatedSymbols: ['SOL'],
    period: '2026-08-15 02:00 ~ 06:00 (UTC)',
    requirement: '해당 없음(입출금 일시 중단)',
    rewardForm: '해당 없음',
    riskNote: '점검 시간 중 입출금·거래가 제한될 수 있어요.',
    noticeUrl: 'https://www.binance.com/en/support/announcement',
    matchesMyHistory: true,
  },
  {
    title: '신규 상장 기념 거래 이벤트',
    exchange: '빗썸',
    type: '이벤트',
    relatedSymbols: [],
    period: '2026-08-10 ~ 2026-08-17',
    requirement: '이벤트 페이지에서 별도 응모',
    rewardForm: '추첨 리워드',
    riskNote: '이벤트 참여를 위한 과도한 거래는 F6 거래 빈도 점수에서 관찰할 수 있어요.',
    noticeUrl: 'https://feed.bithumb.com/notice',
    matchesMyHistory: false,
  },
];
