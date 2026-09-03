import { parseCsv } from '../parse-csv';
import { type CsvAdapter, type ParseResult } from '../types';

function read(row: Record<string, string>, mapping: Record<string, string>, field: string) {
  const header = mapping[field];
  return header ? (row[header]?.trim() ?? '') : '';
}

export function parseNumber(value: string, label: string) {
  const normalized = value.replace(/[₩원,$\s]/g, '').replace(/,/g, '');
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) throw new Error(`${label} 숫자를 인식하지 못했습니다`);
  return parsed;
}

export function parseSide(value: string) {
  const normalized = value.trim().toLowerCase();
  if (['매수', 'bid', 'buy', 'b'].includes(normalized)) return 'buy' as const;
  if (['매도', 'ask', 'sell', 's'].includes(normalized)) return 'sell' as const;
  throw new Error(`side/구분 값을 인식하지 못했습니다: ${value}`);
}

export function normalizeSymbol(value: string) {
  const raw = value.trim().toUpperCase();
  if (!raw) throw new Error('마켓/종목 값을 인식하지 못했습니다');
  return raw.replace(/^KRW[-_/]/, '').replace(/[-_/]KRW$/, '');
}

export function normalizeKstDate(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(
    /^(\d{4})[-./](\d{1,2})[-./](\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/
  );
  if (!match) throw new Error(`체결시간 날짜를 인식하지 못했습니다: ${value}`);
  const [, y, m, d, hh = '0', mm = '0', ss = '0'] = match;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${hh.padStart(2, '0')}:${mm.padStart(2, '0')}:${ss.padStart(2, '0')}+09:00`;
}

export const upbitMappings: CsvAdapter['mappings'] = [
  {
    field: 'symbol',
    required: true,
    candidates: ['마켓', '시장', '종목', '종목명', 'market', 'symbol', 'ticker'],
  },
  {
    field: 'side',
    required: true,
    candidates: ['구분', '매수/매도', '종류', '거래종류', '거래유형', 'side', 'type', 'order side'],
  },
  {
    field: 'executedAt',
    required: true,
    candidates: ['체결시간', '체결 일시', '거래일시', '일시', 'date', 'time', 'executed at'],
  },
  {
    field: 'price',
    required: true,
    candidates: ['체결가', '가격', '거래가격', '거래단가', 'price', 'executed price'],
  },
  {
    field: 'quantity',
    required: true,
    candidates: ['수량', '체결수량', '거래수량', 'quantity', 'amount', 'volume'],
  },
  {
    field: 'fee',
    required: false,
    candidates: ['수수료', 'fee', 'commission'],
  },
];

export const upbitAdapter: CsvAdapter = {
  id: 'upbit-krw-estimated',
  label: '업비트 KRW 추정 CSV',
  mappings: upbitMappings,
  parseRow(row, _rowNumber, mapping, index, feePolicy) {
    return {
      id: `upbit-${index + 1}`,
      symbol: normalizeSymbol(read(row, mapping, 'symbol')),
      side: parseSide(read(row, mapping, 'side')),
      price: parseNumber(read(row, mapping, 'price'), '체결가'),
      quantity: parseNumber(read(row, mapping, 'quantity'), '수량'),
      fee:
        feePolicy === 'missing_fee_column'
          ? 0
          : parseNumber(read(row, mapping, 'fee') || '0', '수수료'),
      executedAt: normalizeKstDate(read(row, mapping, 'executedAt')),
    };
  },
};

export function parseUpbitCsv(input: string | Uint8Array | ArrayBuffer): ParseResult {
  return parseCsv(input, { adapter: 'upbit' });
}
