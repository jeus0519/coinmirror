import assert from 'node:assert/strict';
import test from 'node:test';

import { buildSampleInvestmentTypeProfile } from '../src/lib/investment-type.ts';
import {
  buildPhase1ScoreMetrics,
  mergeExecutionsToOrders,
  reconstructRoundTrips,
  syntheticFixtures,
} from '../src/lib/score-engine/index.ts';

test('Order 전처리는 30분 이내 같은 종목·방향 체결을 1건으로 병합한다', () => {
  const orders = mergeExecutionsToOrders([
    {
      id: 'a',
      symbol: 'BTC',
      side: 'buy',
      price: 100,
      quantity: 1,
      fee: 1,
      executedAt: '2026-01-01T09:00:00+09:00',
    },
    {
      id: 'b',
      symbol: 'BTC',
      side: 'buy',
      price: 110,
      quantity: 1,
      fee: 1,
      executedAt: '2026-01-01T09:20:00+09:00',
    },
    {
      id: 'c',
      symbol: 'BTC',
      side: 'sell',
      price: 120,
      quantity: 1,
      fee: 1,
      executedAt: '2026-01-01T09:25:00+09:00',
    },
  ]);

  assert.equal(orders.length, 2);
  assert.equal(orders[0].price, 105);
  assert.equal(orders[0].quantity, 2);
  assert.equal(orders[0].sourceExecutionIds.length, 2);
});

test('FIFO RoundTrip은 매도 1건을 기존 매수 로트와 연결해 손익과 보유시간을 산출한다', () => {
  const orders = mergeExecutionsToOrders([
    {
      id: 'b1',
      symbol: 'ETH',
      side: 'buy',
      price: 100,
      quantity: 1,
      fee: 0,
      executedAt: '2026-01-01T09:00:00+09:00',
    },
    {
      id: 'b2',
      symbol: 'ETH',
      side: 'buy',
      price: 120,
      quantity: 1,
      fee: 0,
      executedAt: '2026-01-02T09:00:00+09:00',
    },
    {
      id: 's1',
      symbol: 'ETH',
      side: 'sell',
      price: 150,
      quantity: 1.5,
      fee: 0,
      executedAt: '2026-01-03T09:00:00+09:00',
    },
  ]);
  const { roundTrips, openLots } = reconstructRoundTrips(orders);

  assert.equal(roundTrips.length, 1);
  assert.equal(roundTrips[0].avgEntryPrice, 106.666667);
  assert.equal(roundTrips[0].pnl, 65);
  assert.equal(roundTrips[0].pnlPct, 40.625);
  assert.equal(openLots[0].quantity, 0.5);
});

test('합성 픽스처 3종은 의도한 투자거울 타입 4축으로 판정된다', () => {
  const cases = [
    { id: 'chaser', expectedCode: 'C-R-X-D', expectedTitle: '추격형 단기 반응가' },
    { id: 'lossHolder', expectedCode: 'W-H-L-D', expectedTitle: '손실보류형 관찰가' },
    { id: 'normal', expectedCode: 'W-H-X-D', expectedTitle: '분산형 안정 관찰가' },
  ] as const;

  for (const item of cases) {
    const metrics = buildPhase1ScoreMetrics(syntheticFixtures[item.id], {
      maxSingleAssetWeightPct: 50,
    });
    const type = buildSampleInvestmentTypeProfile(metrics);
    assert.equal(type.code, item.expectedCode, item.id);
    assert.equal(type.title, item.expectedTitle, item.id);
    assert.ok(
      metrics.every((metric) => metric.measured),
      item.id
    );
  }
});

test('표본 미달은 0점이 아니라 측정 중과 ? 축으로 처리한다', () => {
  const metrics = buildPhase1ScoreMetrics(syntheticFixtures.insufficient, {
    maxSingleAssetWeightPct: 50,
  });
  const type = buildSampleInvestmentTypeProfile(metrics);

  assert.equal(metrics.find((metric) => metric.id === 'F1')?.score, null);
  assert.equal(metrics.find((metric) => metric.id === 'F1')?.measured, false);
  assert.equal(type.axes.find((axis) => axis.axis === 'loss')?.code, '?');
});
