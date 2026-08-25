import { type RawExecution } from './preprocess';

function trade(
  id: string,
  day: number,
  symbol: string,
  side: 'buy' | 'sell',
  price: number,
  quantity = 1,
  hour = 9
): RawExecution {
  return {
    id,
    symbol,
    side,
    price,
    quantity,
    fee: price * quantity * 0.0005,
    executedAt: `2026-01-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:00:00+09:00`,
  };
}

function normalFixture() {
  const rows: RawExecution[] = [];
  for (let i = 0; i < 8; i += 1) {
    const day = i + 1;
    const symbol = ['BTC', 'ETH', 'SOL', 'XRP'][i % 4];
    rows.push(trade(`n-b-${i}`, day, symbol, 'buy', 100 + i, 1, 9));
    rows.push(trade(`n-s-${i}`, day + 10, symbol, 'sell', 112 + i, 1, 11));
  }
  for (let i = 0; i < 5; i += 1) {
    const day = i + 12;
    const symbol = ['ADA', 'ARB', 'SUI'][i % 3];
    rows.push(trade(`n-lb-${i}`, day, symbol, 'buy', 100 + i, 1, 10));
    rows.push(trade(`n-ls-${i}`, day + 6, symbol, 'sell', 94 + i, 1, 10));
  }
  return rows;
}

function chaserFixture() {
  const rows: RawExecution[] = [];
  for (let i = 0; i < 14; i += 1) {
    const day = Math.floor(i / 3) + 1;
    const symbol = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE'][i % 5];
    rows.push(trade(`c-ref-${i}`, day, symbol, 'buy', 100, 0.4, 9 + (i % 3)));
    rows.push(trade(`c-chase-${i}`, day + 1, symbol, 'buy', 112 + (i % 3), 1, 9 + (i % 5)));
    rows.push(trade(`c-sell-${i}`, day + 1, symbol, 'sell', 118 + (i % 3), 1.4, 18));
  }
  for (let i = 0; i < 5; i += 1) {
    const day = i + 8;
    const symbol = ['ADA', 'ARB', 'SUI', 'MATIC', 'AVAX'][i];
    rows.push(trade(`c-lb-${i}`, day, symbol, 'buy', 100, 1, 9));
    rows.push(trade(`c-ls-${i}`, day + 2, symbol, 'sell', 96, 1, 10));
  }
  return rows;
}

function lossHolderFixture() {
  const rows: RawExecution[] = [];
  for (let i = 0; i < 8; i += 1) {
    const symbol = ['BTC', 'ETH', 'SOL', 'XRP'][i % 4];
    rows.push(trade(`lh-pb-${i}`, i + 1, symbol, 'buy', 100, 1, 9));
    rows.push(trade(`lh-ps-${i}`, i + 3, symbol, 'sell', 108, 1, 10));
  }
  for (let i = 0; i < 7; i += 1) {
    const symbol = ['ADA', 'ARB', 'SUI', 'MATIC'][i % 4];
    rows.push(trade(`lh-lb-${i}`, i + 1, symbol, 'buy', 100, 1, 11));
    rows.push(trade(`lh-ls-${i}`, i + 25, symbol, 'sell', 74, 1, 11));
  }
  return rows;
}

export const syntheticFixtures = {
  chaser: chaserFixture(),
  lossHolder: lossHolderFixture(),
  normal: normalFixture(),
  insufficient: [trade('i-1', 1, 'BTC', 'buy', 100), trade('i-2', 2, 'BTC', 'sell', 90)],
} as const;
