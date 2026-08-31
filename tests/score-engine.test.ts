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
