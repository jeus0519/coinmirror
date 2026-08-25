import { SCORE_CONSTANTS } from './score-constants';

export type TradeSide = 'buy' | 'sell';

export type RawExecution = {
  id: string;
  symbol: string;
  side: TradeSide;
  price: number;
  quantity: number;
  fee: number;
  executedAt: string;
};

export type Order = {
  id: string;
  symbol: string;
  side: TradeSide;
  price: number;
  quantity: number;
  amount: number;
  fee: number;
  executedAt: string;
  sourceExecutionIds: string[];
};

export type RoundTrip = {
  symbol: string;
  exitOrderId: string;
  avgEntryPrice: number;
  exitPrice: number;
  quantity: number;
  amount: number;
  pnl: number;
  pnlPct: number;
  holdingHours: number;
  closedAt: string;
};

export type OpenLot = {
  symbol: string;
  price: number;
  quantity: number;
  amount: number;
  executedAt: string;
};

function toTime(value: string) {
  return new Date(value).getTime();
}

function round(value: number, digits = 6) {
  return Number(value.toFixed(digits));
}

export function mergeExecutionsToOrders(executions: readonly RawExecution[]): Order[] {
  const sorted = [...executions].sort((a, b) => toTime(a.executedAt) - toTime(b.executedAt));
  const orders: Order[] = [];
  const windowMs = SCORE_CONSTANTS.orderMergeWindowMinutes * 60 * 1000;

  for (const execution of sorted) {
    const prev = orders.at(-1);
    const canMerge =
      prev &&
      prev.symbol === execution.symbol &&
      prev.side === execution.side &&
      toTime(execution.executedAt) - toTime(prev.executedAt) <= windowMs;

    if (!canMerge) {
      orders.push({
        id: execution.id,
        symbol: execution.symbol,
        side: execution.side,
        price: execution.price,
        quantity: execution.quantity,
        amount: execution.price * execution.quantity,
        fee: execution.fee,
        executedAt: execution.executedAt,
        sourceExecutionIds: [execution.id],
      });
      continue;
    }

    const nextAmount = prev.amount + execution.price * execution.quantity;
    const nextQuantity = prev.quantity + execution.quantity;
    prev.price = round(nextAmount / nextQuantity);
    prev.quantity = round(nextQuantity);
    prev.amount = round(nextAmount);
    prev.fee = round(prev.fee + execution.fee);
    prev.sourceExecutionIds.push(execution.id);
  }
  return orders;
}

export function reconstructRoundTrips(orders: readonly Order[]) {
  const lotsBySymbol = new Map<string, OpenLot[]>();
  const roundTrips: RoundTrip[] = [];

  for (const order of [...orders].sort((a, b) => toTime(a.executedAt) - toTime(b.executedAt))) {
    if (order.side === 'buy') {
      const lots = lotsBySymbol.get(order.symbol) ?? [];
      lots.push({
        symbol: order.symbol,
        price: order.price,
        quantity: order.quantity,
        amount: order.amount,
        executedAt: order.executedAt,
      });
      lotsBySymbol.set(order.symbol, lots);
      continue;
    }

    const lots = lotsBySymbol.get(order.symbol) ?? [];
    let remaining = order.quantity;
    let entryCost = 0;
    let earliestEntryAt = order.executedAt;

    while (remaining > 0 && lots.length) {
      const lot = lots[0];
      const consumed = Math.min(remaining, lot.quantity);
      entryCost += consumed * lot.price;
      earliestEntryAt =
        toTime(lot.executedAt) < toTime(earliestEntryAt) ? lot.executedAt : earliestEntryAt;
      lot.quantity = round(lot.quantity - consumed);
      lot.amount = round(lot.quantity * lot.price);
      remaining = round(remaining - consumed);
      if (lot.quantity <= 0.000001) lots.shift();
    }

    const soldQuantity = round(order.quantity - remaining);
    if (soldQuantity <= 0) continue;
    const exitProceeds = soldQuantity * order.price;
    const proportionalFee = order.fee * (soldQuantity / order.quantity);
    const pnl = round(exitProceeds - entryCost - proportionalFee);
    const holdingHours = round((toTime(order.executedAt) - toTime(earliestEntryAt)) / 36e5, 3);
    roundTrips.push({
      symbol: order.symbol,
      exitOrderId: order.id,
      avgEntryPrice: round(entryCost / soldQuantity),
      exitPrice: order.price,
      quantity: soldQuantity,
      amount: round(entryCost),
      pnl,
      pnlPct: round((pnl / entryCost) * 100, 3),
      holdingHours,
      closedAt: order.executedAt,
    });
  }

  return { roundTrips, openLots: [...lotsBySymbol.values()].flat() };
}
