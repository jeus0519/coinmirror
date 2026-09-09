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

test('Order 전처리는 타 종목 체결이 사이에 있어도 같은 종목의 연속 매수 체결을 병합한다', () => {
  const orders = mergeExecutionsToOrders([
    {
      id: 'btc-1',
      symbol: 'BTC',
      side: 'buy',
      price: 100,
      quantity: 1,
      fee: 1,
      executedAt: '2026-01-01T09:00:00+09:00',
    },
    {
      id: 'eth-1',
      symbol: 'ETH',
      side: 'buy',
      price: 50,
      quantity: 1,
      fee: 0.5,
      executedAt: '2026-01-01T09:01:00+09:00',
    },
    {
      id: 'btc-2',
      symbol: 'BTC',
      side: 'buy',
      price: 110,
      quantity: 1,
      fee: 1,
      executedAt: '2026-01-01T09:02:00+09:00',
    },
  ]);

  const btcOrder = orders.find((order) => order.symbol === 'BTC');
  assert.equal(orders.length, 2);
  assert.deepEqual(btcOrder?.sourceExecutionIds, ['btc-1', 'btc-2']);
  assert.equal(btcOrder?.price, 105);
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
    { id: 'chaser', expectedCode: 'C-R-X-D', expectedTitle: '추격형 (직전가 대비) 단기 반응가' },
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

test('픽스처별 기대 밴드와 전체 관찰 밴드 분포를 검증한다', () => {
  const expectedBands = {
    chaser: { F1: ['안정', '관찰'], F3: ['주의'], F6: ['주의', '관찰'], F8: ['관찰', '안정'] },
    lossHolder: { F1: ['주의'], F3: ['안정'], F6: ['안정'], F8: ['관찰', '안정'] },
    normal: { F1: ['안정'], F3: ['안정'], F6: ['안정'], F8: ['안정'] },
    concentrated: { F8: ['주의'] },
    moderate: { F1: ['관찰'], F3: ['관찰'], F6: ['관찰'], F8: ['관찰'] },
  } as const;
  const observedBands: string[] = [];

  for (const [fixtureId, metricBands] of Object.entries(expectedBands)) {
    const metrics = buildPhase1ScoreMetrics(
      syntheticFixtures[fixtureId as keyof typeof expectedBands],
      { maxSingleAssetWeightPct: 50 }
    );
    for (const [metricId, allowedBands] of Object.entries(metricBands)) {
      const metric = metrics.find((item) => item.id === metricId);
      assert.ok(metric, `${fixtureId} ${metricId}`);
      assert.ok(
        (allowedBands as readonly string[]).includes(metric.band),
        `${fixtureId} ${metricId}: ${metric.band}`
      );
      observedBands.push(metric.band);
    }
  }

  assert.ok(observedBands.filter((band) => band === '관찰').length >= 4);
});

test('F8은 A4 10/30/50 한도별로 자금 배분 축을 검증한다', () => {
  const loose = buildPhase1ScoreMetrics(syntheticFixtures.concentrated, {
    maxSingleAssetWeightPct: 50,
  }).find((metric) => metric.id === 'F8');
  const medium = buildPhase1ScoreMetrics(syntheticFixtures.concentrated, {
    maxSingleAssetWeightPct: 30,
  }).find((metric) => metric.id === 'F8');
  const strict = buildPhase1ScoreMetrics(syntheticFixtures.normal, {
    maxSingleAssetWeightPct: 10,
  }).find((metric) => metric.id === 'F8');
  const moderate = buildPhase1ScoreMetrics(syntheticFixtures.moderate, {
    maxSingleAssetWeightPct: 50,
  }).find((metric) => metric.id === 'F8');

  assert.equal(loose?.band, '주의');
  assert.equal(medium?.band, '주의');
  assert.equal(strict?.band, '안정');
  assert.equal(moderate?.band, '관찰');
});

test('F6는 첫 분석에서 절대 일평균 임계값 없이 P1을 제외하고 캡을 재정규화한다', () => {
  const firstRun = buildPhase1ScoreMetrics(syntheticFixtures.chaser, {
    maxSingleAssetWeightPct: 50,
  }).find((metric) => metric.id === 'F6');
  const withBaseline = buildPhase1ScoreMetrics(syntheticFixtures.chaser, {
    maxSingleAssetWeightPct: 50,
    baselineDailyOrders: 2,
  }).find((metric) => metric.id === 'F6');

  assert.match(firstRun?.stats['자기 기준 급증'] ?? '', /첫 분석 제외/);
  assert.ok(['주의', '관찰'].includes(firstRun?.band ?? ''));
  assert.equal(withBaseline?.band, '주의');
});

test('F1/F3/F6/F8은 실제 주문과 청산에서 근거 거래를 채우고 손익률 표현은 쓰지 않는다', () => {
  const metrics = buildPhase1ScoreMetrics(syntheticFixtures.chaser, {
    maxSingleAssetWeightPct: 50,
  });

  for (const id of ['F1', 'F3', 'F6', 'F8']) {
    const metric = metrics.find((item) => item.id === id);
    assert.ok(metric, `${id} metric missing`);
    assert.ok(metric.evidence.length > 0, `${id} evidence missing`);
    assert.ok(metric.evidence.length <= 3, `${id} evidence too many`);
    assert.equal(
      metric.evidence.every((item) => item.when && item.symbol && item.fact),
      true
    );
    assert.doesNotMatch(metric.evidence.map((item) => item.fact).join(' '), /[+-]\d+(?:\.\d+)?%/);
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

test('실제 거래내역 분석은 A4 답변이 없어도 자금 배분 축을 기본 50 기준으로 판정한다', () => {
  const metrics = buildPhase1ScoreMetrics(syntheticFixtures.concentrated, {
    maxSingleAssetWeightPct: 50,
  });
  const type = buildSampleInvestmentTypeProfile(metrics);

  assert.equal(type.axes.find((axis) => axis.axis === 'allocation')?.code, 'N');
  assert.equal(type.code.endsWith('-N'), true);
});

test('F3은 90일(SCORE_CONSTANTS.chaseLookbackDays) 이내의 직전 거래만 추격으로 인정하고, 90일을 초과한 거래는 인정하지 않는다', () => {
  // Scenario 1: Older than 90 days (e.g., 92 days) -> Should NOT count as chase (score remains 100)
  const executionsOlderThan90: any[] = [
    { id: 'b1', symbol: 'BTC', side: 'buy', price: 100, quantity: 1, fee: 0, executedAt: '2026-01-01T00:00:00Z' },
    { id: 'b2', symbol: 'BTC', side: 'buy', price: 108, quantity: 1, fee: 0, executedAt: '2026-04-03T00:00:00Z' }, // 92 days later (rise 8% >= 7%)
  ];
  // Add 8 more buy orders to satisfy minBuyOrders = 10
  for (let i = 3; i <= 10; i++) {
    executionsOlderThan90.push({
      id: `b${i}`,
      symbol: 'BTC',
      side: 'buy',
      price: 108,
      quantity: 1,
      fee: 0,
      executedAt: `2026-04-04T0${i}:00:00Z` // Hour-separated to prevent merging
    });
  }

  const metricsOlder = buildPhase1ScoreMetrics(executionsOlderThan90, { maxSingleAssetWeightPct: 50 });
  const f3Older = metricsOlder.find(m => m.id === 'F3');
  assert.ok(f3Older);
  assert.equal(f3Older.score, 100); // Because the only price rise was >90 days ago, so 0% chase share

  // Scenario 2: Within 90 days (e.g., 88 days) -> Should COUNT as chase (score should be < 100)
  const executionsWithin90: any[] = [
    { id: 'b1', symbol: 'BTC', side: 'buy', price: 100, quantity: 1, fee: 0, executedAt: '2026-01-01T00:00:00Z' },
    { id: 'b2', symbol: 'BTC', side: 'buy', price: 108, quantity: 1, fee: 0, executedAt: '2026-03-30T00:00:00Z' }, // 88 days later (rise 8% >= 7%)
  ];
  for (let i = 3; i <= 10; i++) {
    executionsWithin90.push({
      id: `b${i}`,
      symbol: 'BTC',
      side: 'buy',
      price: 108,
      quantity: 1,
      fee: 0,
      executedAt: `2026-03-31T0${i}:00:00Z` // Hour-separated to prevent merging
    });
  }

  const metricsWithin = buildPhase1ScoreMetrics(executionsWithin90, { maxSingleAssetWeightPct: 50 });
  const f3Within = metricsWithin.find(m => m.id === 'F3');
  assert.ok(f3Within);
  assert.ok(f3Within.score !== null && f3Within.score < 100); // Should have a penalty
});

test('FIFO RoundTrip은 full close 시 매수 수수료를 entryCost(진입 원가)와 pnlPct 분모에 포함하여 계산한다', () => {
  const orders = mergeExecutionsToOrders([
    {
      id: 'b1',
      symbol: 'BTC',
      side: 'buy',
      price: 100,
      quantity: 1,
      fee: 2,
      executedAt: '2026-01-01T09:00:00+09:00',
    },
    {
      id: 's1',
      symbol: 'BTC',
      side: 'sell',
      price: 101,
      quantity: 1,
      fee: 0,
      executedAt: '2026-01-01T10:00:00+09:00',
    },
  ]);
  const { roundTrips, openLots } = reconstructRoundTrips(orders);

  assert.equal(roundTrips.length, 1);
  assert.equal(roundTrips[0].amount, 102); // 100 * 1 + 2 (buy fee)
  assert.equal(roundTrips[0].pnl, -1);     // 101 - 102
  assert.equal(roundTrips[0].pnlPct, -0.98); // (-1 / 102) * 100
  assert.equal(openLots.length, 0);
});

test('FIFO RoundTrip은 partial close 시 매수 수수료를 비례 분배하고 남은 openLot에 잔여 수수료와 원가 정보를 유지한다', () => {
  const orders = mergeExecutionsToOrders([
    {
      id: 'b1',
      symbol: 'ETH',
      side: 'buy',
      price: 100,
      quantity: 2,
      fee: 4,
      executedAt: '2026-01-01T09:00:00+09:00',
    },
    {
      id: 's1',
      symbol: 'ETH',
      side: 'sell',
      price: 105,
      quantity: 0.5,
      fee: 1,
      executedAt: '2026-01-01T10:00:00+09:00',
    },
  ]);
  const { roundTrips, openLots } = reconstructRoundTrips(orders);

  assert.equal(roundTrips.length, 1);
  assert.equal(roundTrips[0].quantity, 0.5);
  assert.equal(roundTrips[0].amount, 51); // 0.5 * 100 + (4 * 0.5/2) = 51
  assert.equal(roundTrips[0].pnl, 0.5);    // 52.5 - 51 - 1 = 0.5
  assert.equal(roundTrips[0].pnlPct, 0.98); // (0.5 / 51) * 100 = 0.98
  assert.equal(openLots.length, 1);
  assert.equal(openLots[0].quantity, 1.5);
  assert.equal(openLots[0].amount, 150);
  assert.equal(openLots[0].fee, 3);       // 4 - 1 = 3
});
