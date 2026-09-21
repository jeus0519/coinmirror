import {
  buildInfoEventTabViewModel,
  type InfoEventTabViewModel,
  type MarketInterestAsset,
  type MarketMetric,
  type ExchangeEventItem,
} from './info-event-tab';

type Fetcher = typeof fetch;

type MarketContextPayload = {
  ok: true;
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
  safetyCopy: string;
};

type ExchangeEventsPayload = {
  ok: true;
  title: string;
  description: string;
  updatedAtLabel: string;
  upbit: ExchangeEventItem[];
  bithumb: ExchangeEventItem[];
  safetyCopy: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isMarketContextPayload(value: unknown): value is MarketContextPayload {
  if (!isRecord(value) || value.ok !== true) return false;
  const temperature = value.marketTemperature;
  const interest = value.upbitKrwInterest;
  return (
    isRecord(temperature) &&
    typeof temperature.title === 'string' &&
    typeof temperature.description === 'string' &&
    Array.isArray(temperature.metrics) &&
    typeof temperature.reading === 'string' &&
    isRecord(interest) &&
    typeof interest.title === 'string' &&
    typeof interest.description === 'string' &&
    Array.isArray(interest.assets) &&
    typeof interest.note === 'string' &&
    typeof value.safetyCopy === 'string'
  );
}

function isExchangeEventsPayload(value: unknown): value is ExchangeEventsPayload {
  return (
    isRecord(value) &&
    value.ok === true &&
    typeof value.title === 'string' &&
    typeof value.description === 'string' &&
    typeof value.updatedAtLabel === 'string' &&
    Array.isArray(value.upbit) &&
    Array.isArray(value.bithumb) &&
    typeof value.safetyCopy === 'string'
  );
}

async function requestJson(fetcher: Fetcher, url: string): Promise<unknown> {
  const response = await fetcher(url, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`request_failed:${response.status}`);
  return response.json();
}

export async function loadInfoEventTabViewModel(fetcher: Fetcher = fetch): Promise<InfoEventTabViewModel> {
  const fallback = buildInfoEventTabViewModel();
  const [marketResult, eventsResult] = await Promise.allSettled([
    requestJson(fetcher, '/api/market-context'),
    requestJson(fetcher, '/api/exchange-events'),
  ]);

  const market = marketResult.status === 'fulfilled' && isMarketContextPayload(marketResult.value) ? marketResult.value : null;
  const events = eventsResult.status === 'fulfilled' && isExchangeEventsPayload(eventsResult.value) ? eventsResult.value : null;

  return {
    ...fallback,
    marketTemperature: market?.marketTemperature ?? fallback.marketTemperature,
    upbitKrwInterest: market?.upbitKrwInterest ?? fallback.upbitKrwInterest,
    safetyCopy: market?.safetyCopy ?? fallback.safetyCopy,
    exchangeEvents: events
      ? {
          title: events.title,
          description: events.description,
          updatedAtLabel: events.updatedAtLabel,
          upbit: events.upbit,
          bithumb: events.bithumb,
          safetyCopy: events.safetyCopy,
        }
      : fallback.exchangeEvents,
  };
}
