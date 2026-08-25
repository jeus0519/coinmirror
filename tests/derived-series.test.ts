import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildPhase1DerivedSeries,
  buildPhase1ScoreMetrics,
  mergeExecutionsToOrders,
  reconstructRoundTrips,
  syntheticFixtures,
} from '../src/lib/score-engine/index.ts';

test('파생 시계열은 Order/RoundTrip만 받아 화면용 실측값을 산출한다', () => {
  const orders = mergeExecutionsToOrders(syntheticFixtures.moderate);
  const { roundTrips } = reconstructRoundTrips(orders);
  const series = buildPhase1DerivedSeries(orders, roundTrips);

  assert.equal(series.hourlyAmount.length, 24);
  assert.equal(series.weekdayOrderCount.length, 7);
  assert.ok(
    series.hourlyAmount[9] > series.hourlyAmount[3],
    'KST 09시 거래대금이 새벽보다 커야 함'
  );
  assert.ok(series.weekdayOrderCount.some((count) => count > 0));
  assert.ok(series.perSymbolBuyShare[0].share > 0.5);
  assert.ok(series.perSymbolBuyShare[0].share < 0.7);
  assert.ok(series.winRate !== null && series.winRate > 0 && series.winRate < 1);
  assert.ok(series.medianHoldingHours.profit !== null);
  assert.ok(series.medianHoldingHours.loss !== null);
  assert.ok(series.monthlyOrderCount > orders.length);
});

test('파생 시계열은 표본 미달 값을 숫자로 꾸미지 않고 null로 둔다', () => {
  const orders = mergeExecutionsToOrders([
    {
      id: 'only-buy',
      symbol: 'BTC',
      side: 'buy',
      price: 100,
      quantity: 1,
      fee: 0,
      executedAt: '2026-01-01T09:00:00+09:00',
    },
  ]);
  const { roundTrips } = reconstructRoundTrips(orders);
  const series = buildPhase1DerivedSeries(orders, roundTrips);

  assert.equal(series.medianHoldingHours.profit, null);
  assert.equal(series.medianHoldingHours.loss, null);
  assert.ok(series.winRate === 0 || series.winRate === 1 || series.winRate === null);
});

test('CSV 분석용 파생 시계열은 Phase 1 점수와 같은 전처리 결과에서 나온다', () => {
  const orders = mergeExecutionsToOrders(syntheticFixtures.chaser);
  const { roundTrips } = reconstructRoundTrips(orders);
  const series = buildPhase1DerivedSeries(orders, roundTrips);

  assert.equal(series.orderCount, orders.length);
  assert.equal(series.roundTripCount, roundTrips.length);
  assert.ok(series.perSymbolBuyShare.length > 0);
});
