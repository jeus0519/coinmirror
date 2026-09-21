import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { GET, resetExchangeEventsCacheForTests } from '../api/exchange-events.ts';

test('/api/exchange-events returns cached event list or falls back safely', async () => {
  resetExchangeEventsCacheForTests();
  let calls = 0;
  const dependencies = {
    now: () => new Date('2026-09-21T01:00:00.000Z'),
    fetchBithumbEvents: async () => {
      calls += 1;
      return [
        {
          exchange: '빗썸' as const,
          title: '창립 13주년 이벤트',
          publishedAt: '2026.09.16',
          summary: '기간, 조건은 거래소에서 직접 확인하세요.',
          url: 'https://www.bithumb.com/react/feed/event/255',
        },
      ];
    },
  };

  const first = await GET(new Request('http://localhost/api/exchange-events'), dependencies);
  assert.equal(first.status, 200);
  const firstBody = await first.json();

  assert.equal(firstBody.ok, true);
  assert.equal(firstBody.source, 'live');
  assert.equal(firstBody.bithumb[0].title, '창립 13주년 이벤트');
  assert.equal(firstBody.upbit.length, 3);

  const second = await GET(new Request('http://localhost/api/exchange-events'), dependencies);
  const secondBody = await second.json();
  assert.equal(secondBody.source, 'cache');
  assert.equal(calls, 1);
});

test('/api/exchange-events treats an empty provider result as fallback rather than live data', async () => {
  resetExchangeEventsCacheForTests();
  const response = await GET(new Request('http://localhost/api/exchange-events'), {
    now: () => new Date('2026-09-21T01:00:00.000Z'),
    fetchBithumbEvents: async () => [],
  });
  const body = await response.json();

  assert.equal(body.source, 'fallback');
  assert.equal(body.upbit.length, 3);
  assert.equal(body.bithumb.length, 3);
});

test('/api/exchange-events external request uses a bounded timeout', async () => {
  const source = await readFile('api/exchange-events.ts', 'utf8');
  assert.match(source, /EXTERNAL_REQUEST_TIMEOUT_MS = 2_000/);
  assert.match(source, /AbortSignal\.timeout\(EXTERNAL_REQUEST_TIMEOUT_MS\)/);
});

test('/api/exchange-events falls back without promotional or advisory language when fetch fails', async () => {
  resetExchangeEventsCacheForTests();
  const response = await GET(new Request('http://localhost/api/exchange-events'), {
    now: () => new Date('2026-09-21T01:00:00.000Z'),
    fetchBithumbEvents: async () => {
      throw new Error('fetch failed');
    },
  });
  assert.equal(response.status, 200);
  const body = await response.json();

  assert.equal(body.ok, true);
  assert.equal(body.source, 'fallback');
  const text = JSON.stringify(body);
  assert.match(text, /거래소 이벤트 참고/);
  assert.doesNotMatch(text, /놓치면 손해|지금 참여|수익 기회|참여 추천/);
});
