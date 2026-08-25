import { buildSampleInvestmentTypeProfile } from '../investment-type';
import { type DiagnosisProfile } from '../onboarding-diagnosis';
import { buildPhase1ScoreMetrics } from '../score-engine';
import { type Metric } from '../mock-metrics';
import { parseCsv } from './parse-csv';
import { type ParseResult } from './types';

export type CsvAnalysisPreview = {
  adapterLabel: string;
  normalRowCount: number;
  errorRowCount: number;
  skippedRowCount: number;
  periodLabel: string;
  symbolCount: number;
  columnMapping: Record<string, string>;
  errors: ParseResult['errors'];
};

export type CsvAnalysisResult = {
  parse: ParseResult;
  metrics: Metric[];
  investmentType: ReturnType<typeof buildSampleInvestmentTypeProfile>;
  preview: CsvAnalysisPreview;
};

function maxSingleAssetWeightPct(profile: DiagnosisProfile) {
  if (profile.A4 === '10' || profile.A4 === '30' || profile.A4 === '50') return Number(profile.A4) as 10 | 30 | 50;
  return undefined;
}

function formatDate(value: string) {
  return value.slice(0, 10).replaceAll('-', '.');
}

function buildPreview(parse: ParseResult): CsvAnalysisPreview {
  const times = parse.executions.map((execution) => execution.executedAt).sort();
  const periodLabel = times.length ? `${formatDate(times[0])} ~ ${formatDate(times.at(-1)!)} KST` : '기간 미인식';
  return {
    adapterLabel: parse.detectedAdapter ?? '인식 실패',
    normalRowCount: parse.executions.length,
    errorRowCount: parse.errors.length,
    skippedRowCount: parse.skippedRowCount,
    periodLabel,
    symbolCount: new Set(parse.executions.map((execution) => execution.symbol)).size,
    columnMapping: parse.columnMapping,
    errors: parse.errors.slice(0, 5),
  };
}

export function analyzeCsvInput(
  input: string | Uint8Array | ArrayBuffer,
  diagnosis: DiagnosisProfile
): CsvAnalysisResult {
  const parse = parseCsv(input, { adapter: 'upbit' });
  const metrics = parse.executions.length
    ? buildPhase1ScoreMetrics(parse.executions, {
        maxSingleAssetWeightPct: maxSingleAssetWeightPct(diagnosis),
        excludeFeeDrag: parse.feePolicy === 'missing_fee_column',
      })
    : [];
  return {
    parse,
    metrics,
    investmentType: buildSampleInvestmentTypeProfile(metrics, diagnosis.generalMbti),
    preview: buildPreview(parse),
  };
}
