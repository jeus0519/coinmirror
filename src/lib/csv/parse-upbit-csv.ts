import { parseCsv } from './parse-csv';
import { type ParseResult } from './types';

export function parseUpbitCsv(input: string | Uint8Array | ArrayBuffer): ParseResult {
  return parseCsv(input, { adapter: 'upbit' });
}
