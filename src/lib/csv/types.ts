import { type RawExecution } from '../score-engine/preprocess';

export type RowError = {
  rowNumber: number;
  reason: string;
  raw: Record<string, string> | string[];
};

export type ColumnMapping = {
  field: 'symbol' | 'side' | 'executedAt' | 'price' | 'quantity' | 'fee';
  candidates: string[];
  required: boolean;
};

export type ParseResult = {
  executions: RawExecution[];
  errors: RowError[];
  detectedAdapter: string | null;
  columnMapping: Record<string, string>;
  skippedRowCount: number;
  headers?: string[];
  feePolicy?: 'provided' | 'missing_fee_column';
};

export type CsvAdapter = {
  id: string;
  label: string;
  mappings: ColumnMapping[];
  parseRow: (
    row: Record<string, string>,
    rowNumber: number,
    mapping: Record<string, string>,
    rowIndex: number,
    feePolicy: ParseResult['feePolicy']
  ) => RawExecution;
};

export type ParseCsvOptions = {
  adapter?: 'upbit' | 'auto';
};
