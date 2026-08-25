import { buildSampleInvestmentTypeProfile } from './investment-type';
import { lockedMetrics, type LockedMetricPreview, type Metric } from './mock-metrics';
import { type DiagnosisProfile, type ExpectationActuals } from './onboarding-diagnosis';
import {
  buildPhase1DerivedSeries,
  buildPhase1ScoreMetrics,
  mergeExecutionsToOrders,
  reconstructRoundTrips,
  syntheticFixtures,
  type Phase1DerivedSeries,
  type RawExecution,
} from './score-engine';
import { type CsvAnalysisResult } from './csv/analyze-csv';
import { formatKrw } from './format';

export type AnalysisViewData = {
  source: 'sample' | 'csv';
  metrics: Metric[];
  lockedMetrics: LockedMetricPreview[];
  investmentType: ReturnType<typeof buildSampleInvestmentTypeProfile>;
  expectationActuals?: ExpectationActuals;
  derivedSeries: Phase1DerivedSeries;
  summaryText: string;
  statTiles: { label: string; value: string; sub?: string; tone?: 'pos' | 'neg' }[];
  hourlyBars: { hour: number; heightPct: number; isDawn: boolean }[];
  weekdayBars: { label: string; heightPct: number; count: number }[];
  symbolRows: { symbol: string; shareLabel: string }[];
};

const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

function maxSingleAssetWeightPct(profile: DiagnosisProfile) {
  if (profile.A4 === '10' || profile.A4 === '30' || profile.A4 === '50')
    return Number(profile.A4) as 10 | 30 | 50;
  return undefined;
}

function buildSeriesFromExecutions(executions: readonly RawExecution[]) {
  const orders = mergeExecutionsToOrders(executions);
  const { roundTrips } = reconstructRoundTrips(orders);
  return buildPhase1DerivedSeries(orders, roundTrips);
}

function buildBars(values: readonly number[]) {
  const max = Math.max(...values, 1);
  return values.map((value, index) => ({
    index,
    heightPct: Math.max((value / max) * 100, value > 0 ? 3 : 0),
  }));
}

function formatSignedKrw(value: number) {
  const prefix = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${prefix}${formatKrw(Math.abs(Math.round(value)))}원`;
}

function buildViewData(input: {
  source: 'sample' | 'csv';
  metrics: Metric[];
  investmentType: ReturnType<typeof buildSampleInvestmentTypeProfile>;
  derivedSeries: Phase1DerivedSeries;
  expectationActuals?: ExpectationActuals;
  summaryText: string;
}): AnalysisViewData {
  const hourlyBars = buildBars(input.derivedSeries.hourlyAmount).map((bar) => ({
    hour: bar.index,
    heightPct: bar.heightPct,
    isDawn: bar.index < 6,
  }));
  const weekdayBars = buildBars(input.derivedSeries.weekdayOrderCount).map((bar) => ({
    label: WEEKDAY_LABELS[bar.index],
    heightPct: bar.heightPct,
    count: input.derivedSeries.weekdayOrderCount[bar.index],
  }));

  return {
    ...input,
    lockedMetrics,
    statTiles: [
      {
        label: '총 거래 건수',
        value: `${input.derivedSeries.orderCount}건`,
        sub: '분할 체결 병합 후',
      },
      {
        label: '총 거래대금',
        value: `${formatKrw(Math.round(input.derivedSeries.totalOrderAmount))}원`,
      },
      {
        label: '실현손익',
        value: formatSignedKrw(input.derivedSeries.realizedPnl),
        tone: input.derivedSeries.realizedPnl >= 0 ? 'pos' : 'neg',
      },
      { label: '미청산 보유', value: `${input.derivedSeries.openPositionCount}종목` },
    ],
    hourlyBars,
    weekdayBars,
    symbolRows: input.derivedSeries.perSymbolBuyShare.slice(0, 5).map((item) => ({
      symbol: item.symbol,
      shareLabel: `${Math.round(item.share * 100)}%`,
    })),
  };
}

export function buildSampleAnalysisViewData(diagnosis: DiagnosisProfile): AnalysisViewData {
  const metrics = buildPhase1ScoreMetrics(syntheticFixtures.normal, {
    maxSingleAssetWeightPct: maxSingleAssetWeightPct(diagnosis),
  });
  const derivedSeries = buildSeriesFromExecutions(syntheticFixtures.normal);
  return buildViewData({
    source: 'sample',
    metrics,
    investmentType: buildSampleInvestmentTypeProfile(metrics, diagnosis.generalMbti),
    derivedSeries,
    summaryText: `샘플 체결 ${derivedSeries.orderCount}건을 같은 분석 파이프라인으로 계산했어요. 내 CSV를 업로드하면 이 숫자가 사용자 데이터로 교체됩니다.`,
  });
}

export function buildCsvAnalysisViewData(
  csvAnalysis: CsvAnalysisResult,
  diagnosis: DiagnosisProfile
): AnalysisViewData {
  const derivedSeries =
    csvAnalysis.derivedSeries ?? buildSeriesFromExecutions(csvAnalysis.parse.executions);
  return buildViewData({
    source: 'csv',
    metrics: csvAnalysis.metrics,
    investmentType: csvAnalysis.investmentType,
    derivedSeries,
    expectationActuals: csvAnalysis.expectationActuals,
    summaryText: `CSV에서 정상 ${csvAnalysis.preview.normalRowCount}행을 읽어 F1/F3/F6/F8과 투자거울 타입을 계산했어요. 오류 ${csvAnalysis.preview.errorRowCount}행은 점수에 넣지 않았습니다.`,
  });
}

export function buildAnalysisViewData(input: {
  dataSource: 'sample' | 'csv' | null;
  csvAnalysis: CsvAnalysisResult | null;
  diagnosis: DiagnosisProfile;
}): AnalysisViewData {
  if (input.dataSource === 'csv' && input.csvAnalysis)
    return buildCsvAnalysisViewData(input.csvAnalysis, input.diagnosis);
  return buildSampleAnalysisViewData(input.diagnosis);
}
