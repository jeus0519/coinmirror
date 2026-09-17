import { type CsvAdapter } from '../types';

function read(row: Record<string, string>, mapping: Record<string, string>, field: string) {
  const header = mapping[field];
  return header ? (row[header]?.trim() ?? '') : '';
}

export function parseNumber(value: string, label: string) {
  const trimmed = value.trim();
  if (trimmed === '') throw new Error(`${label} 값이 비어 있습니다`);
  const normalized = trimmed.replace(/[₩원,$\s]/g, '');
  if (normalized === '') throw new Error(`${label} 숫자를 인식하지 못했습니다`);
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

function isLeapYear(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function isValidDateAndTime(y: string, m: string, d: string, hh: string, mm: string, ss: string) {
  const year = parseInt(y, 10);
  const month = parseInt(m, 10);
  const day = parseInt(d, 10);
  const hour = parseInt(hh, 10);
  const minute = parseInt(mm, 10);
  const second = parseInt(ss, 10);

  if (month < 1 || month > 12) return false;
  if (hour < 0 || hour > 23) return false;
  if (minute < 0 || minute > 59) return false;
  if (second < 0 || second > 59) return false;
  if (day < 1) return false;

  const daysInMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day > daysInMonth[month - 1]) return false;

  return true;
}

export function normalizeKstDate(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(
    /^(\d{4})[-./](\d{1,2})[-./](\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/
  );
  if (!match) throw new Error(`체결시간 날짜를 인식하지 못했습니다: ${value}`);
  const [, y, m, d, hh = '0', mm = '0', ss = '0'] = match;

  if (!isValidDateAndTime(y, m, d, hh, mm, ss)) {
    throw new Error(`유효하지 않은 체결시간 날짜/시간입니다: ${value}`);
  }

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
    const price = parseNumber(read(row, mapping, 'price'), '체결가');
    if (price <= 0) {
      throw new Error('체결가는 0보다 커야 합니다');
    }

    const quantity = parseNumber(read(row, mapping, 'quantity'), '수량');
    if (quantity <= 0) {
      throw new Error('수량은 0보다 커야 합니다');
    }

    const fee =
      feePolicy === 'missing_fee_column'
        ? 0
        : parseNumber(read(row, mapping, 'fee') || '0', '수수료');
    if (fee < 0) {
      throw new Error('수수료는 0보다 작을 수 없습니다');
    }

    return {
      id: `upbit-${index + 1}`,
      symbol: normalizeSymbol(read(row, mapping, 'symbol')),
      side: parseSide(read(row, mapping, 'side')),
      price,
      quantity,
      fee,
      executedAt: normalizeKstDate(read(row, mapping, 'executedAt')),
    };
  },
};
