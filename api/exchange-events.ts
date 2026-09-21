import { buildInfoEventTabViewModel, type ExchangeEventItem } from '../src/lib/info-event-tab';

type ExchangeEventsDependencies = {
  now?: () => Date;
  fetchBithumbEvents?: () => Promise<ExchangeEventItem[]>;
};

type CacheEntry = {
  expiresAt: number;
  body: Record<string, unknown>;
};

const EXCHANGE_EVENTS_TTL_MS = 3 * 60 * 60 * 1000;
const EXTERNAL_REQUEST_TIMEOUT_MS = 2_000;
let cache: CacheEntry | null = null;

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 's-maxage=10800, stale-while-revalidate=86400',
    },
  });
}

function buildFallbackBody(now: Date, source: 'fallback' | 'stale' = 'fallback') {
  const vm = buildInfoEventTabViewModel();
  return {
    ok: true,
    source,
    updatedAt: now.toISOString(),
    title: vm.exchangeEvents.title,
    description: vm.exchangeEvents.description,
    updatedAtLabel: vm.exchangeEvents.updatedAtLabel,
    upbit: vm.exchangeEvents.upbit,
    bithumb: vm.exchangeEvents.bithumb,
    safetyCopy: vm.exchangeEvents.safetyCopy,
  };
}

async function fetchBithumbEvents(): Promise<ExchangeEventItem[]> {
  const response = await fetch('https://www.bithumb.com/react/feed/event', {
    headers: { accept: 'text/html,application/xhtml+xml' },
    signal: AbortSignal.timeout(EXTERNAL_REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`bithumb_events_failed:${response.status}`);
  const html = await response.text();
  const matches = [...html.matchAll(/<a[^>]+href="(\/react\/feed\/event\/\d+)"[^>]*>([\s\S]*?)<\/a>/g)];
  const items: ExchangeEventItem[] = [];

  for (const match of matches) {
    if (items.length >= 3) break;
    const href = match[1];
    const inner = match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (inner) {
      items.push({
        exchange: '빗썸',
        title: inner.slice(0, 80),
        summary: '기간, 조건, 유의사항은 거래소에서 직접 확인하세요.',
        url: `https://www.bithumb.com${href}`,
      });
    }
  }

  if (items.length === 0) throw new Error('bithumb_event_parse_failed');
  return items;
}

export function resetExchangeEventsCacheForTests() {
  cache = null;
}

export async function GET(_request: Request, dependencies: ExchangeEventsDependencies = {}) {
  const now = dependencies.now?.() ?? new Date();
  const nowMs = now.getTime();
  if (cache && cache.expiresAt > nowMs) {
    return jsonResponse({ ...cache.body, source: 'cache' });
  }

  const vm = buildInfoEventTabViewModel();
  try {
    const bithumb = await (dependencies.fetchBithumbEvents ?? fetchBithumbEvents)();
    if (bithumb.length === 0) throw new Error('empty_exchange_events');
    const body = {
      ok: true,
      source: 'live',
      updatedAt: now.toISOString(),
      title: vm.exchangeEvents.title,
      description: vm.exchangeEvents.description,
      updatedAtLabel: vm.exchangeEvents.updatedAtLabel,
      upbit: vm.exchangeEvents.upbit,
      bithumb: bithumb.slice(0, 3),
      safetyCopy: vm.exchangeEvents.safetyCopy,
    };
    cache = { expiresAt: nowMs + EXCHANGE_EVENTS_TTL_MS, body };
    return jsonResponse(body);
  } catch {
    if (cache) return jsonResponse({ ...cache.body, source: 'stale' });
    return jsonResponse(buildFallbackBody(now));
  }
}
