import { type Metric, scoreLevel } from '../mock-metrics';
import { SCORE_CONSTANTS } from './score-constants';
import {
  mergeExecutionsToOrders,
  reconstructRoundTrips,
  type Order,
  type RawExecution,
  type RoundTrip,
} from './preprocess';

export type Phase1ScoreOptions = {
  maxSingleAssetWeightPct?: 10 | 30 | 50;
  baselineDailyOrders?: number;
  excludeFeeDrag?: boolean;
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function band(score: number | null) {
  const level = scoreLevel(score);
  if (level === 'stable') return '안정';
  if (level === 'observe') return '관찰';
  if (level === 'caution') return '주의';
  return '측정 중';
}

function metric(input: Omit<Metric, 'kind' | 'band'>): Metric {
  return { ...input, kind: 'habit', band: band(input.score) };
}

function measuredMetric(
  id: `F${number}`,
  name: string,
  score: number,
  sampleSize: number,
  headline: string,
  stats: Record<string, string>
): Metric {
  return metric({ id, name, score, measured: true, sampleSize, headline, stats, evidence: [] });
}

function measuringMetric(
  id: `F${number}`,
  name: string,
  sampleSize: number,
  limitation: string
): Metric {
  return metric({
    id,
    name,
    score: null,
    measured: false,
    sampleSize,
    headline: limitation,
    stats: {},
    evidence: [],
    limitation,
  });
}

function scoreF1(roundTrips: RoundTrip[]) {
  const lossRTs = roundTrips.filter((rt) => rt.pnl < 0);
  const profitRTs = roundTrips.filter((rt) => rt.pnl > 0);
  if (
    lossRTs.length < SCORE_CONSTANTS.f1.minLossExits ||
    profitRTs.length < SCORE_CONSTANTS.f1.minProfitExits
  ) {
    return measuringMetric(
      'F1',
      '손절 습관',
      lossRTs.length,
      `측정 중 · 손실 청산 기록 ${Math.max(0, SCORE_CONSTANTS.f1.minLossExits - lossRTs.length)}건 더 필요`
    );
  }
  const asymmetry =
    median(lossRTs.map((rt) => rt.holdingHours)) /
    Math.max(1, median(profitRTs.map((rt) => rt.holdingHours)));
  const deepLossShare =
    lossRTs.filter((rt) => rt.pnlPct <= SCORE_CONSTANTS.f1.deepLossThresholdPct).length /
    lossRTs.length;
  const penalty =
    Math.min(
      SCORE_CONSTANTS.f1.holdingAsymmetryCapWithoutCurrentPrice,
      Math.max(0, asymmetry - 1) * SCORE_CONSTANTS.f1.holdingAsymmetryMultiplier
    ) +
    Math.min(
      SCORE_CONSTANTS.f1.deepLossCapWithoutCurrentPrice,
      deepLossShare * SCORE_CONSTANTS.f1.deepLossMultiplier
    );
  const score = clampScore(100 - penalty);
  return measuredMetric(
    'F1',
    '손절 습관',
    score,
    lossRTs.length,
    '손실 거래를 이익 거래보다 얼마나 오래 보유했는지 계산했어요.',
    {
      '손실/이익 보유시간': `${asymmetry.toFixed(1)}배`,
      '깊은 손실 비중': `${Math.round(deepLossShare * 100)}%`,
    }
  );
}

function scoreF3(orders: Order[]) {
  const buyOrders = orders.filter((order) => order.side === 'buy');
  if (buyOrders.length < SCORE_CONSTANTS.f3.minBuyOrders) {
    return measuringMetric(
      'F3',
      '추격매수',
      buyOrders.length,
      `측정 중 · 매수 주문 ${Math.max(0, SCORE_CONSTANTS.f3.minBuyOrders - buyOrders.length)}건 더 필요`
    );
  }
  const lastPriceBySymbol = new Map<string, number>();
  const chaseBySymbol = new Map<string, number>();
  let chaseAmount = 0;
  let buyAmount = 0;

  for (const order of orders) {
    if (order.side === 'buy') {
      buyAmount += order.amount;
      const lastPrice = lastPriceBySymbol.get(order.symbol);
      if (
        lastPrice &&
        order.price >= lastPrice * (1 + SCORE_CONSTANTS.f3.selfReferenceRisePct / 100)
      ) {
        chaseAmount += order.amount;
        chaseBySymbol.set(order.symbol, (chaseBySymbol.get(order.symbol) ?? 0) + 1);
      }
    }
    lastPriceBySymbol.set(order.symbol, order.price);
  }

  const chaseShare = buyAmount ? chaseAmount / buyAmount : 0;
  const repeatedSymbolShare =
    [...chaseBySymbol.values()].filter((count) => count >= 2).length /
    Math.max(1, new Set(buyOrders.map((order) => order.symbol)).size);
  const penalty =
    Math.min(
      SCORE_CONSTANTS.f3.chaseShareCap,
      chaseShare * SCORE_CONSTANTS.f3.chaseShareMultiplier
    ) +
    Math.min(
      SCORE_CONSTANTS.f3.repeatedSymbolCap,
      repeatedSymbolShare * SCORE_CONSTANTS.f3.repeatedSymbolMultiplier
    );
  const score = clampScore(100 - penalty);
  return measuredMetric(
    'F3',
    '추격매수',
    score,
    buyOrders.length,
    '이미 오른 가격을 뒤따라 들어간 매수 비중을 계산했어요.',
    {
      '추격 진입 비중': `${Math.round(chaseShare * 100)}%`,
      '반복 추격 종목': `${Math.round(repeatedSymbolShare * 100)}%`,
    }
  );
}

function dateKey(value: string) {
  return value.slice(0, 10);
}

function countSameDaySymbolRoundTrips(orders: Order[]) {
  const sidesByDaySymbol = new Map<string, Set<string>>();
  for (const order of orders) {
    const key = `${dateKey(order.executedAt)}:${order.symbol}`;
    const sides = sidesByDaySymbol.get(key) ?? new Set<string>();
    sides.add(order.side);
    sidesByDaySymbol.set(key, sides);
  }
  return [...sidesByDaySymbol.values()].filter((sides) => sides.has('buy') && sides.has('sell'))
    .length;
}

function scoreF6(orders: Order[], roundTrips: RoundTrip[], options: Phase1ScoreOptions) {
  if (orders.length < SCORE_CONSTANTS.f6.minOrders) {
    return measuringMetric(
      'F6',
      '과매매',
      orders.length,
      `측정 중 · 주문 ${Math.max(0, SCORE_CONSTANTS.f6.minOrders - orders.length)}건 더 필요`
    );
  }
  const countsByDate = new Map<string, number>();
  for (const order of orders)
    countsByDate.set(
      dateKey(order.executedAt),
      (countsByDate.get(dateKey(order.executedAt)) ?? 0) + 1
    );
  const avgDailyOrders = orders.length / countsByDate.size;
  const sameDayRoundTripShare =
    countSameDaySymbolRoundTrips(orders) / Math.max(1, countsByDate.size);
  const totalFee = orders.reduce((sum, order) => sum + order.fee, 0);
  const realizedPnl = roundTrips.reduce((sum, rt) => sum + rt.pnl, 0);
  const feeDrag = options.excludeFeeDrag
    ? 0
    : totalFee / Math.max(Math.abs(realizedPnl), totalFee || 1);
  const baselineDailyOrders = options.baselineDailyOrders;
  const baselinePenalty =
    baselineDailyOrders === undefined
      ? 0
      : Math.min(
          SCORE_CONSTANTS.f6.baselineSurgeCap,
          (Math.max(0, avgDailyOrders - baselineDailyOrders) / Math.max(baselineDailyOrders, 1)) *
            SCORE_CONSTANTS.f6.baselineSurgeMultiplier
        );
  const sameDayCap =
    baselineDailyOrders === undefined
      ? SCORE_CONSTANTS.f6.sameDayRoundTripCapFirstAnalysis
      : SCORE_CONSTANTS.f6.sameDayRoundTripCap;
  const rawFeeDragCap =
    baselineDailyOrders === undefined
      ? SCORE_CONSTANTS.f6.feeDragCapFirstAnalysis
      : SCORE_CONSTANTS.f6.feeDragCap;
  const feeDragCap = options.excludeFeeDrag ? 0 : rawFeeDragCap;
  const sameDayCapAdjusted = options.excludeFeeDrag ? sameDayCap + rawFeeDragCap : sameDayCap;
  const penalty =
    baselinePenalty +
    Math.min(
      sameDayCapAdjusted,
      sameDayRoundTripShare * SCORE_CONSTANTS.f6.sameDayRoundTripMultiplier
    ) +
    Math.min(feeDragCap, feeDrag * SCORE_CONSTANTS.f6.feeDragMultiplier);
  const score = clampScore(100 - penalty);
  return measuredMetric(
    'F6',
    '과매매',
    score,
    orders.length,
    '거래 횟수와 수수료 마찰을 최근 활동일 기준으로 계산했어요.',
    {
      '활동일 평균 주문': `${avgDailyOrders.toFixed(1)}건`,
      '당일 왕복 비중': `${Math.round(sameDayRoundTripShare * 100)}%`,
      '자기 기준 급증':
        baselineDailyOrders === undefined
          ? '첫 분석 제외 · 당일 왕복/수수료 캡 재정규화'
          : `${baselineDailyOrders.toFixed(1)}건 기준`,
      '수수료 항': options.excludeFeeDrag ? '컬럼 없음 · 항 제외 후 캡 재정규화' : '포함',
    }
  );
}

function scoreF8(orders: Order[], options: Phase1ScoreOptions) {
  const buyOrders = orders.filter((order) => order.side === 'buy');
  const symbolAmounts = new Map<string, number>();
  for (const order of buyOrders)
    symbolAmounts.set(order.symbol, (symbolAmounts.get(order.symbol) ?? 0) + order.amount);
  if (!options.maxSingleAssetWeightPct) {
    return measuringMetric(
      'F8',
      '몰빵',
      buyOrders.length,
      'A4에서 한 종목 한도를 선택하면 다음 분석부터 대조할 수 있어요.'
    );
  }
  if (
    buyOrders.length < SCORE_CONSTANTS.f8.minBuyOrders ||
    symbolAmounts.size < SCORE_CONSTANTS.f8.minSymbols
  ) {
    return measuringMetric(
      'F8',
      '몰빵',
      buyOrders.length,
      '측정 중 · 매수 주문과 거래 종목 표본이 더 필요합니다.'
    );
  }
  const totalBuyAmount = buyOrders.reduce((sum, order) => sum + order.amount, 0);
  const topShare = Math.max(...symbolAmounts.values()) / totalBuyAmount;
  const cap = options.maxSingleAssetWeightPct / 100;
  const penalty = Math.min(
    SCORE_CONSTANTS.f8.excessConcentrationCap,
    Math.max(0, topShare - cap) * SCORE_CONSTANTS.f8.excessConcentrationMultiplier
  );
  const score = clampScore(100 - penalty);
  return measuredMetric(
    'F8',
    '몰빵',
    score,
    buyOrders.length,
    '최근 매수 자금이 한 종목에 얼마나 몰렸는지 선언 한도와 대조했어요.',
    {
      '최대 종목 비중': `${Math.round(topShare * 100)}%`,
      '선언 한도': `${options.maxSingleAssetWeightPct}%`,
    }
  );
}

export function buildPhase1ScoreMetrics(
  executions: readonly RawExecution[],
  options: Phase1ScoreOptions = {}
): Metric[] {
  const orders = mergeExecutionsToOrders(executions);
  const { roundTrips } = reconstructRoundTrips(orders);
  return [
    scoreF1(roundTrips),
    scoreF3(orders),
    scoreF6(orders, roundTrips, options),
    scoreF8(orders, options),
  ];
}
