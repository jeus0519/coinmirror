import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { GET, resetMarketContextCacheForTests } from '../api/market-context.ts';

test('/api/market-context returns BTC, ETH, XRP plus the other top 3 KRW trade-value assets', async () => {
  resetMarketContextCacheForTests();
  let calls = 0;
  const dependencies = {
    now: () => new Date('2026-09-21T01:00:00.000Z'),
    fetchUpbitKrwTickers: async () => {
      calls += 1;
      return [
        { market: 'KRW-BTC', tradePrice: 111_000_000, signedChangeRate: 0.008, accTradePrice24h: 100 },
        { market: 'KRW-ETH', tradePrice: 5_000_000, signedChangeRate: 0.002, accTradePrice24h: 90 },
        { market: 'KRW-XRP', tradePrice: 1900, signedChangeRate: -0.001, accTradePrice24h: 80 },
        { market: 'KRW-G', tradePrice: 9.6, signedChangeRate: 0.03, accTradePrice24h: 400 },
        { market: 'KRW-USDT', tradePrice: 1360, signedChangeRate: -0.0007, accTradePrice24h: 200 },
        { market: 'KRW-DOGE', tradePrice: 240, signedChangeRate: 0.01, accTradePrice24h: 150 },
        { market: 'KRW-SOL', tradePrice: 250_000, signedChangeRate: -0.02, accTradePrice24h: 50 },
      ];
    },
    fetchFearGreed: async () => ({ value: 54, classification: 'Neutral' }),
  };

  const first = await GET(new Request('http://localhost/api/market-context'), dependencies);
  assert.equal(first.status, 200);
  const firstBody = await first.json();

  assert.equal(firstBody.ok, true);
  assert.equal(firstBody.source, 'live');
  assert.equal(firstBody.marketTemperature.metrics[1].label, 'BTC 24시간 가격 변화');
  assert.match(firstBody.marketTemperature.metrics[1].description, /거래량이 아니라 가격 기준/);
  assert.deepEqual(
    firstBody.upbitKrwInterest.assets.map((asset: { symbol: string }) => asset.symbol),
    ['BTC', 'ETH', 'XRP', 'G', 'USDT', 'DOGE']
  );
  assert.deepEqual(
    firstBody.upbitKrwInterest.assets.map((asset: { rankLabel: string }) => asset.rankLabel),
    ['기본 확인', '기본 확인', '기본 확인', '그 외 상위 1', '그 외 상위 2', '그 외 상위 3']
  );
  assert.deepEqual(
    firstBody.upbitKrwInterest.assets.map((asset: { volumeShareLabel: string }) => asset.volumeShareLabel),
    ['전체 거래대금 중 9.3%', '전체 거래대금 중 8.4%', '전체 거래대금 중 7.5%', '전체 거래대금 중 37.4%', '전체 거래대금 중 18.7%', '전체 거래대금 중 14.0%']
  );

  const second = await GET(new Request('http://localhost/api/market-context'), dependencies);
  const secondBody = await second.json();
  assert.equal(secondBody.source, 'cache');
  assert.equal(calls, 1);
});

test('/api/market-context external requests use a bounded timeout', async () => {
  const source = await readFile('api/market-context.ts', 'utf8');
  assert.match(source, /EXTERNAL_REQUEST_TIMEOUT_MS = 2_000/);
  assert.match(source, /AbortSignal\.timeout\(EXTERNAL_REQUEST_TIMEOUT_MS\)/);
});

test('/api/market-context falls back without investment-advice copy when providers fail', async () => {
  resetMarketContextCacheForTests();
  const response = await GET(new Request('http://localhost/api/market-context'), {
    now: () => new Date('2026-09-21T01:00:00.000Z'),
    fetchUpbitKrwTickers: async () => {
      throw new Error('upbit unavailable');
    },
    fetchFearGreed: async () => {
      throw new Error('fng unavailable');
    },
  });
  assert.equal(response.status, 200);
  const body = await response.json();

  assert.equal(body.ok, true);
  assert.equal(body.source, 'fallback');
  const text = JSON.stringify(body);
  assert.match(text, /시장 배경/);
  assert.doesNotMatch(text, /매수 기회|추천 코인|지금 참여|수익 기회/);
});
