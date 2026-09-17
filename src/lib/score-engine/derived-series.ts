import { type Order, type RoundTrip } from './preprocess';

export type Phase1DerivedSeries = {
  orderCount: number;
  roundTripCount: number;
  totalOrderAmount: number;
  realizedPnl: number;
  openPositionCount: number;
  hourlyAmount: number[];
  weekdayOrderCount: number[];
  perSymbolBuyShare: { symbol: string; buyAmount: number; share: number }[];
  winRate: number | null;
  medianHoldingHours: { profit: number | null; loss: number | null };
  monthlyOrderCount: number;
};

function kstDate(value: string) {
  return new Date(value);
}

function kstHour(value: string) {
  const match = value.match(/T(\d{2}):/);
  return match ? Number(match[1]) : kstDate(value).getUTCHours();
}

function mondayZeroWeekday(value: string) {
  const jsDay = kstDate(value).getDay();
  return (jsDay + 6) % 7;
}

function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function monthSpan(orders: readonly Order[]) {
  if (!orders.length) return 1;
  const times = orders.map((order) => kstDate(order.executedAt).getTime());
  const days = Math.max(1, (Math.max(...times) - Math.min(...times)) / 86_400_000 + 1);
  return Math.max(days / 30, 1 / 30);
}

export function buildPhase1DerivedSeries(
  orders: readonly Order[],
  roundTrips: readonly RoundTrip[]
): Phase1DerivedSeries {
  const hourlyAmount = Array.from({ length: 24 }, () => 0);
  const weekdayOrderCount = Array.from({ length: 7 }, () => 0);
  const buyAmountBySymbol = new Map<string, number>();
  const netQuantityBySymbol = new Map<string, number>();

  for (const order of orders) {
    hourlyAmount[kstHour(order.executedAt)] += order.amount;
    weekdayOrderCount[mondayZeroWeekday(order.executedAt)] += 1;
    if (order.side === 'buy') {
      buyAmountBySymbol.set(
        order.symbol,
        (buyAmountBySymbol.get(order.symbol) ?? 0) + order.amount
      );
      netQuantityBySymbol.set(
        order.symbol,
        (netQuantityBySymbol.get(order.symbol) ?? 0) + order.quantity
      );
    } else {
      netQuantityBySymbol.set(
        order.symbol,
        (netQuantityBySymbol.get(order.symbol) ?? 0) - order.quantity
      );
    }
  }

  const totalBuyAmount = [...buyAmountBySymbol.values()].reduce((sum, value) => sum + value, 0);
  const perSymbolBuyShare = [...buyAmountBySymbol.entries()]
    .map(([symbol, buyAmount]) => ({
      symbol,
      buyAmount,
      share: totalBuyAmount ? buyAmount / totalBuyAmount : 0,
    }))
    .sort((a, b) => b.buyAmount - a.buyAmount);

  const profitRoundTrips = roundTrips.filter((rt) => rt.pnl > 0);
  const lossRoundTrips = roundTrips.filter((rt) => rt.pnl < 0);

  return {
    orderCount: orders.length,
    roundTripCount: roundTrips.length,
    totalOrderAmount: orders.reduce((sum, order) => sum + order.amount, 0),
    realizedPnl: roundTrips.reduce((sum, rt) => sum + rt.pnl, 0),
    openPositionCount: [...netQuantityBySymbol.values()].filter((quantity) => quantity > 0.000001)
      .length,
    hourlyAmount,
    weekdayOrderCount,
    perSymbolBuyShare,
    winRate: roundTrips.length ? profitRoundTrips.length / roundTrips.length : null,
    medianHoldingHours: {
      profit: median(profitRoundTrips.map((rt) => rt.holdingHours)),
      loss: median(lossRoundTrips.map((rt) => rt.holdingHours)),
    },
    monthlyOrderCount: orders.length / monthSpan(orders),
  };
}
