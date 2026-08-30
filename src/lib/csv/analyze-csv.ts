import { parseCsv } from './parse-csv';
import { type DiagnosisProfile } from '../onboarding-diagnosis';
import {
  analyzeParseResult,
  buildExpectationActualsFromSeries,
  type TradeHistoryAnalysisPreview,
  type TradeHistoryAnalysisResult,
} from '../trade-history/build-analysis';

export type CsvAnalysisPreview = TradeHistoryAnalysisPreview;
export type CsvAnalysisResult = TradeHistoryAnalysisResult;

export { buildExpectationActualsFromSeries };

export function analyzeCsvInput(
  input: string | Uint8Array | ArrayBuffer,
  diagnosis: DiagnosisProfile
): CsvAnalysisResult {
  return analyzeParseResult(parseCsv(input, { adapter: 'upbit' }), diagnosis, 'csv');
}
