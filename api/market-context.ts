import { buildInfoEventTabViewModel, type InfoEventTabViewModel } from '../src/lib/info-event-tab';

type UpbitTicker = {
  market: string;
  tradePrice: number;
  signedChangeRate: number;
  accTradePrice24h: number;
};

type FearGreed = {
  value: number;
  classification: string;
};

type MarketContextDependencies = {
  now?: () => Date;
  fetchUpbitKrwTickers?: () => Promise<UpbitTicker[]>;
  fetchFearGreed?: () => Promise<FearGreed>;
};

type CacheEntry = {
  expiresAt: number;
  body: Record<string, unknown>;
};

const MARKET_CONTEXT_TTL_MS = 15 * 60 * 1000;
const EXTERNAL_REQUEST_TIMEOUT_MS = 2_000;
let cache: CacheEntry | null = null;

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 's-maxage=900, stale-while-revalidate=86400',
    },
  });
}

function percent(value: number) {
  return `${value.toFixed(1)}%`;
}

function symbolFromMarket(market: string) {
  return market.replace(/^KRW-/, '');
}

function buildFallbackBody(now: Date, source: 'fallback' | 'stale' = 'fallback') {
  const vm = buildInfoEventTabViewModel();
  return {
    ok: true,
    source,
    updatedAt: now.toISOString(),
    marketTemperature: vm.marketTemperature,
    upbitKrwInterest: vm.upbitKrwInterest,
    safetyCopy: vm.safetyCopy,
  };
}

function buildMarketContextFromLiveData(now: Date, tickers: UpbitTicker[], fearGreed: FearGreed) {
  const vm: InfoEventTabViewModel = buildInfoEventTabViewModel();
  const totalTradeValue = tickers.reduce((sum, ticker) => sum + Math.max(0, ticker.accTradePrice24h || 0), 0);
  const ranked = [...tickers].sort((a, b) => b.accTradePrice24h - a.accTradePrice24h);
  const fixedMarkets = ['KRW-BTC', 'KRW-ETH', 'KRW-XRP'];
  const fixed = fixedMarkets
    .map((market) => tickers.find((ticker) => ticker.market === market))
    .filter((ticker): ticker is UpbitTicker => Boolean(ticker));
  const otherTopThree = ranked.filter((ticker) => !fixedMarkets.includes(ticker.market)).slice(0, 3);
  const selected = [...fixed, ...otherTopThree];

  const btc = tickers.find((ticker) => ticker.market === 'KRW-BTC');
  const btcChange = btc ? btc.signedChangeRate * 100 : 0;

  return {
    ok: true,
    source: 'live',
    updatedAt: now.toISOString(),
    marketTemperature: {
      ...vm.marketTemperature,
      metrics: [
        {
          label: '공포·탐욕 지수',
          value: String(fearGreed.value),
          description: fearGreed.classification === 'Neutral' ? '중립에 가까운 구간' : fearGreed.classification,
          tone: 'neutral',
        },
        {
          label: 'BTC 24시간 가격 변화',
          value: `${btcChange >= 0 ? '+' : ''}${percent(btcChange)}`,
          description: '거래량이 아니라 가격 기준 변화예요. 기준은 업비트 KRW-BTC입니다.',
          tone: btcChange >= 0 ? 'up' : 'down',
        },
      ],
    },
    upbitKrwInterest: {
      ...vm.upbitKrwInterest,
      assets: selected.map((ticker, index) => {
        const symbol = symbolFromMarket(ticker.market);
        const share = totalTradeValue > 0 ? (ticker.accTradePrice24h / totalTradeValue) * 100 : 0;
        const isFixed = index < fixed.length;
        return {
          rankLabel: isFixed ? '기본 확인' : `그 외 상위 ${index - fixed.length + 1}`,
          symbol,
          note: isFixed
            ? '시장 기준 자산으로 함께 확인'
            : ticker.market === 'KRW-USDT'
              ? '대기/환전성 거래 참고 지표'
              : '최근 24시간 KRW 마켓 거래대금 상위 자산',
          badge: isFixed ? '기본' : ticker.market === 'KRW-USDT' ? 'USDT' : '거래대금',
          volumeShareLabel: `전체 거래대금 중 ${percent(share)}`,
        };
      }),
    },
    safetyCopy: vm.safetyCopy,
  };
}

async function fetchUpbitKrwTickers(): Promise<UpbitTicker[]> {
  const marketsResponse = await fetch('https://api.upbit.com/v1/market/all', {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(EXTERNAL_REQUEST_TIMEOUT_MS),
  });
  if (!marketsResponse.ok) throw new Error(`upbit_markets_failed:${marketsResponse.status}`);
  const markets = (await marketsResponse.json()) as Array<{ market: string }>;
  if (!Array.isArray(markets)) throw new Error('upbit_markets_invalid');
  const krwMarkets = markets.filter((item) => item.market.startsWith('KRW-')).map((item) => item.market);
  const tickerResponse = await fetch(`https://api.upbit.com/v1/ticker?markets=${krwMarkets.join(',')}`, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(EXTERNAL_REQUEST_TIMEOUT_MS),
  });
  if (!tickerResponse.ok) throw new Error(`upbit_tickers_failed:${tickerResponse.status}`);
  const tickers = (await tickerResponse.json()) as Array<{
    market: string;
    trade_price: number;
    signed_change_rate: number;
    acc_trade_price_24h: number;
  }>;
  if (!Array.isArray(tickers)) throw new Error('upbit_tickers_invalid');
  return tickers.map((ticker) => ({
    market: ticker.market,
    tradePrice: ticker.trade_price,
    signedChangeRate: ticker.signed_change_rate,
    accTradePrice24h: ticker.acc_trade_price_24h,
  }));
}

async function fetchFearGreed(): Promise<FearGreed> {
  const response = await fetch('https://api.alternative.me/fng/?limit=1', {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(EXTERNAL_REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`fear_greed_failed:${response.status}`);
  const body = (await response.json()) as { data?: Array<{ value: string; value_classification: string }> };
  const first = body.data?.[0];
  return {
    value: first ? Number(first.value) : 0,
    classification: first?.value_classification ?? 'Unknown',
  };
}

export function resetMarketContextCacheForTests() {
  cache = null;
}

export async function GET(_request: Request, dependencies: MarketContextDependencies = {}) {
  const now = dependencies.now?.() ?? new Date();
  const nowMs = now.getTime();
  if (cache && cache.expiresAt > nowMs) {
    return jsonResponse({ ...cache.body, source: 'cache' });
  }

  try {
    const [tickers, fearGreed] = await Promise.all([
      (dependencies.fetchUpbitKrwTickers ?? fetchUpbitKrwTickers)(),
      (dependencies.fetchFearGreed ?? fetchFearGreed)(),
    ]);
    const body = buildMarketContextFromLiveData(now, tickers, fearGreed);
    cache = { expiresAt: nowMs + MARKET_CONTEXT_TTL_MS, body };
    return jsonResponse(body);
  } catch {
    if (cache) return jsonResponse({ ...cache.body, source: 'stale' });
    return jsonResponse(buildFallbackBody(now));
  }
}
