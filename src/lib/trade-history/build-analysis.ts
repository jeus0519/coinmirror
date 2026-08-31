import { buildSampleInvestmentTypeProfile } from '../investment-type';
import { type Metric } from '../mock-metrics';
import { type DiagnosisProfile, type ExpectationActuals } from '../onboarding-diagnosis';
import {
  buildPhase1DerivedSeries,
  buildPhase1ScoreMetrics,
  mergeExecutionsToOrders,
  reconstructRoundTrips,
  type Phase1DerivedSeries,
} from '../score-engine';
import { type ParseResult } from '../csv/types';

export type TradeHistorySourceFormat = 'csv' | 'pdf';

export type TradeHistoryAnalysisPreview = {
  adapterLabel: string;
  sourceFormatLabel: string;
  normalRowCount: number;
  errorRowCount: number;
  skippedRowCount: number;
  periodLabel: string;
  symbolCount: number;
  columnMapping: Record<string, string>;
  errors: ParseResult['errors'];
};

export type TradeHistoryAnalysisResult = {
  sourceFormat: TradeHistorySourceFormat;
  parse: ParseResult;
  metrics: Metric[];
  investmentType: ReturnType<typeof buildSampleInvestmentTypeProfile>;
  derivedSeries: Phase1DerivedSeries | null;
  expectationActuals: ExpectationActuals;
  preview: TradeHistoryAnalysisPreview;
};

function maxSingleAssetWeightPct(profile: DiagnosisProfile) {
  if (profile.A4 === '10' || profile.A4 === '30' || profile.A4 === '50') {
    return Number(profile.A4) as 10 | 30 | 50;
  }
  // 실제 거래내역을 업로드한 뒤에는 자금 배분 축을 '?'로 보류하지 않는다.
  // 사용자가 별도 기준을 고르지 않았으면 기본 위험 점검선 50%로 F8을 판정한다.
  return 50;
}

function formatDate(value: string) {
  return value.slice(0, 10).replaceAll('-', '.');
}

function sourceFormatLabel(sourceFormat: TradeHistorySourceFormat) {
  return sourceFormat === 'pdf' ? 'PDF 거래내역' : 'CSV 거래내역';
}

function buildPreview(
  parse: ParseResult,
  sourceFormat: TradeHistorySourceFormat
): TradeHistoryAnalysisPreview {
  const times = parse.executions.map((execution) => execution.executedAt).sort();
  const periodLabel = times.length
    ? `${formatDate(times[0])} ~ ${formatDate(times.at(-1)!)} KST`
    : '기간 미인식';
  return {
    adapterLabel: parse.detectedAdapter ?? '인식 실패',
    sourceFormatLabel: sourceFormatLabel(sourceFormat),
    normalRowCount: parse.executions.length,
    errorRowCount: parse.errors.length,
    skippedRowCount: parse.skippedRowCount,
    periodLabel,
    symbolCount: new Set(parse.executions.map((execution) => execution.symbol)).size,
    columnMapping: parse.columnMapping,
    errors: parse.errors.slice(0, 5),
  };
}

function dominantTimeLabel(hourlyAmount: readonly number[]) {
  const maxAmount = Math.max(...hourlyAmount);
  if (!maxAmount) return null;
  const hour = hourlyAmount.findIndex((amount) => amount === maxAmount);
  const bucket = hour >= 23 || hour < 6 ? '밤·새벽' : hour < 17 ? '아침·낮' : '저녁';
  return `${bucket}(${String(hour).padStart(2, '0')}시대)`;
}

function formatDays(hours: number) {
  return `${(hours / 24).toFixed(1)}일`;
}

export function buildExpectationActualsFromSeries(series: Phase1DerivedSeries): ExpectationActuals {
  const actuals: ExpectationActuals = {
    B1: {
      label: '월 거래 횟수',
      actual: `월평균 ${series.monthlyOrderCount.toFixed(1)}회`,
      observation: '기록된 월평균 주문 수와 나란히 보여드려요.',
    },
  };

  const timeLabel = dominantTimeLabel(series.hourlyAmount);
  if (timeLabel) {
    actuals.B2 = {
      label: '주 거래 시간',
      actual: timeLabel,
      observation: '거래대금이 가장 컸던 시간대를 기준으로 표시해요.',
    };
  }

  if (series.medianHoldingHours.profit !== null && series.medianHoldingHours.loss !== null) {
    actuals.B3 = {
      label: '청산 속도',
      actual: `이익 ${formatDays(series.medianHoldingHours.profit)} · 손실 ${formatDays(series.medianHoldingHours.loss)}`,
      observation: '이익·손실 청산의 중앙 보유시간을 비교했어요.',
    };
  }

  actuals.B4 = {
    label: '청산 승률',
    actual:
      series.winRate === null
        ? `측정 중 · 청산 기록 ${Math.max(1, 5 - series.roundTripCount)}건 더 필요`
        : `${(series.winRate * 100).toFixed(1)}%`,
    observation:
      series.winRate === null
        ? '청산 기록이 충분히 쌓이면 승률 비교를 보여드려요.'
        : '청산 기록에서 이익으로 끝난 비율입니다.',
  };

  return actuals;
}

export function analyzeParseResult(
  parse: ParseResult,
  diagnosis: DiagnosisProfile,
  sourceFormat: TradeHistorySourceFormat
): TradeHistoryAnalysisResult {
  const orders = parse.executions.length ? mergeExecutionsToOrders(parse.executions) : [];
  const { roundTrips } = reconstructRoundTrips(orders);
  const derivedSeries = orders.length ? buildPhase1DerivedSeries(orders, roundTrips) : null;
  const metrics = parse.executions.length
    ? buildPhase1ScoreMetrics(parse.executions, {
        maxSingleAssetWeightPct: maxSingleAssetWeightPct(diagnosis),
        excludeFeeDrag: parse.feePolicy === 'missing_fee_column',
      })
    : [];
  return {
    sourceFormat,
    parse,
    metrics,
    investmentType: buildSampleInvestmentTypeProfile(metrics, diagnosis.generalMbti),
    derivedSeries,
    expectationActuals: derivedSeries ? buildExpectationActualsFromSeries(derivedSeries) : {},
    preview: buildPreview(parse, sourceFormat),
  };
}
