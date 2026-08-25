import { upbitAdapter } from './adapters/upbit';
import { type CsvAdapter, type ParseCsvOptions, type ParseResult } from './types';

const ADAPTERS: CsvAdapter[] = [upbitAdapter];

function decodeInput(input: string | Uint8Array | ArrayBuffer) {
  if (typeof input === 'string') return input.replace(/^\uFEFF/, '');
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const utf8 = new TextDecoder('utf-8', { fatal: false }).decode(bytes).replace(/^\uFEFF/, '');
  if (!utf8.includes('\uFFFD')) return utf8;
  try {
    return new TextDecoder('euc-kr', { fatal: false }).decode(bytes).replace(/^\uFEFF/, '');
  } catch {
    return utf8;
  }
}

function parseCsvRows(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === ',' && !inQuotes) {
      row.push(cell.trim());
      cell = '';
      continue;
    }
    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(cell.trim());
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = '';
      continue;
    }
    cell += char;
  }
  if (cell.length || row.length) {
    row.push(cell.trim());
    if (row.some((value) => value.length > 0)) rows.push(row);
  }
  return rows;
}

function isCommentOrBlank(row: string[]) {
  return row.length === 0 || row.every((value) => !value) || row[0]?.trim().startsWith('#');
}

function normalizeHeader(value: string) {
  return value.trim().replace(/^\uFEFF/, '').toLowerCase().replace(/\s+/g, '');
}

function detectMapping(headers: string[], adapter: CsvAdapter) {
  const normalized = new Map(headers.map((header) => [normalizeHeader(header), header]));
  const mapping: Record<string, string> = {};
  const missing: string[] = [];
  for (const field of adapter.mappings) {
    const hit = field.candidates.find((candidate) => normalized.has(normalizeHeader(candidate)));
    if (hit) {
      mapping[field.field] = normalized.get(normalizeHeader(hit))!;
    } else if (field.required) {
      missing.push(field.field);
    }
  }
  return { mapping, missing };
}

function emptyFailure(reason: string, headers: string[] = []): ParseResult {
  return {
    executions: [],
    errors: [{ rowNumber: 1, reason, raw: headers }],
    detectedAdapter: null,
    columnMapping: {},
    skippedRowCount: 0,
    headers,
  };
}

export function parseCsv(input: string | Uint8Array | ArrayBuffer, options: ParseCsvOptions = {}): ParseResult {
  const rows = parseCsvRows(decodeInput(input));
  let skippedRowCount = 0;
  const headerIndex = rows.findIndex((row) => {
    if (isCommentOrBlank(row)) {
      skippedRowCount += 1;
      return false;
    }
    return true;
  });
  if (headerIndex < 0) return emptyFailure('CSV 헤더를 찾을 수 없습니다.');

  const headers = rows[headerIndex];
  const adapters = options.adapter === 'upbit' ? [upbitAdapter] : ADAPTERS;
  const candidates = adapters.map((adapter) => ({ adapter, ...detectMapping(headers, adapter) }));
  const detected = candidates.find((candidate) => candidate.missing.length === 0);
  if (!detected) {
    const missing = candidates[0]?.missing.join(', ') || '필수 컬럼';
    return emptyFailure(`필수 컬럼을 인식하지 못했습니다: ${missing}. 감지된 헤더: ${headers.join(', ')}`, headers);
  }

  const feePolicy: ParseResult['feePolicy'] = detected.mapping.fee ? 'provided' : 'missing_fee_column';
  const result: ParseResult = {
    executions: [],
    errors: [],
    detectedAdapter: detected.adapter.id,
    columnMapping: detected.mapping,
    skippedRowCount,
    headers,
    feePolicy,
  };

  rows.slice(headerIndex + 1).forEach((values, index) => {
    const rowNumber = headerIndex + index + 2;
    if (isCommentOrBlank(values)) {
      result.skippedRowCount += 1;
      return;
    }
    const row = Object.fromEntries(headers.map((header, i) => [header, values[i] ?? '']));
    try {
      result.executions.push(
        detected.adapter.parseRow(row, rowNumber, detected.mapping, result.executions.length, feePolicy)
      );
    } catch (error) {
      result.errors.push({
        rowNumber,
        reason: error instanceof Error ? error.message : String(error),
        raw: row,
      });
    }
  });

  return result;
}
