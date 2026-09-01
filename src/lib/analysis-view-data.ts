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
import { type TradeHistoryAnalysisResult } from './trade-history/build-analysis';
import { formatKrw } from './format';

export type AnalysisViewData = {
  source: 'sample' | 'csv' | 'pdf';
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
  subscriptionInsights: SubscriptionInsight[];
};

export type SubscriptionInsight = {
  kind: 'holding-gap' | 'low-win-rate' | 'concentration';
  title: string;
  evidence: string;
  prompt: string;
  trackingGoal: string;
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

function formatRate(value: number | null) {
  return value === null ? '측정 중' : `${(value * 100).toFixed(1)}%`;
}

function formatHoldingHours(hours: number | null) {
  if (hours === null) return '측정 중';
  if (hours < 24) return `${hours.toFixed(1)}시간`;
  return `${(hours / 24).toFixed(1)}일`;
}

function buildSubscriptionInsights(derivedSeries: Phase1DerivedSeries): SubscriptionInsight[] {
  const insights: SubscriptionInsight[] = [];
  const profitHours = derivedSeries.medianHoldingHours.profit;
  const lossHours = derivedSeries.medianHoldingHours.loss;

  if (profitHours !== null && lossHours !== null && lossHours > profitHours * 2) {
    insights.push({
      kind: 'holding-gap',
      title: '손실 거래를 더 오래 들고 있었어요',
      evidence: `수익 거래 중앙값은 ${formatHoldingHours(profitHours)}, 손실 거래 중앙값은 ${formatHoldingHours(lossHours)}였어요.`,
      prompt: '손실 거래를 오래 들고 있었던 순간에 어떤 기준을 보고 있었나요?',
      trackingGoal: '다음 업로드 때 손실 보유기간이 줄었는지 확인하기',
    });
  }

  if (derivedSeries.winRate !== null && derivedSeries.winRate < 0.4) {
    insights.push({
      kind: 'low-win-rate',
      title: '청산 승률이 낮은 구간이었어요',
      evidence: `왕복거래 ${derivedSeries.roundTripCount}건의 청산 승률은 ${formatRate(derivedSeries.winRate)}였어요.`,
      prompt: '손실 청산이 많았던 거래들은 진입 기준이 비슷했나요?',
      trackingGoal: '다음 업로드 때 청산 승률과 거래 빈도를 함께 비교하기',
    });
  }

  const topSymbol = derivedSeries.perSymbolBuyShare[0];
  if (topSymbol && topSymbol.share >= 0.5) {
    insights.push({
      kind: 'concentration',
      title: '매수 금액이 한 종목에 크게 몰렸어요',
      evidence: `${topSymbol.symbol} 매수 비중이 전체 매수금액의 ${Math.round(topSymbol.share * 100)}%였어요.`,
      prompt: '비중이 커진 시점에 사전에 정한 한도나 근거가 있었나요?',
      trackingGoal: '다음 업로드 때 상위 종목 매수 비중 변화 확인하기',
    });
  }

  return insights.slice(0, 3);
}

function buildViewData(input: {
  source: 'sample' | 'csv' | 'pdf';
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
        label: '청산 승률',
        value: formatRate(input.derivedSeries.winRate),
        sub: `왕복거래 ${input.derivedSeries.roundTripCount}건 기준`,
        tone:
          input.derivedSeries.winRate === null
            ? undefined
            : input.derivedSeries.winRate >= 0.5
              ? 'pos'
              : 'neg',
      },
      {
        label: '수익 보유기간',
        value: formatHoldingHours(input.derivedSeries.medianHoldingHours.profit),
        sub: '수익 청산 중앙값',
        tone: 'pos',
      },
      {
        label: '손실 보유기간',
        value: formatHoldingHours(input.derivedSeries.medianHoldingHours.loss),
        sub: '손실 청산 중앙값',
        tone: 'neg',
      },
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
    subscriptionInsights: buildSubscriptionInsights(input.derivedSeries),
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
    summaryText: `샘플 체결 ${derivedSeries.orderCount}건을 같은 분석 파이프라인으로 계산했어요. 내 PDF/CSV 거래내역을 업로드하면 이 숫자가 사용자 데이터로 교체됩니다.`,
  });
}

export function buildTradeAnalysisViewData(
  tradeAnalysis: TradeHistoryAnalysisResult,
  diagnosis: DiagnosisProfile
): AnalysisViewData {
  const derivedSeries =
    tradeAnalysis.derivedSeries ?? buildSeriesFromExecutions(tradeAnalysis.parse.executions);
  return buildViewData({
    source: tradeAnalysis.sourceFormat,
    metrics: tradeAnalysis.metrics,
    investmentType: tradeAnalysis.investmentType,
    derivedSeries,
    expectationActuals: tradeAnalysis.expectationActuals,
    summaryText: `${tradeAnalysis.preview.sourceFormatLabel}에서 정상 ${tradeAnalysis.preview.normalRowCount}행을 읽어 F1/F3/F6/F8과 투자거울 타입을 계산했어요. 오류 ${tradeAnalysis.preview.errorRowCount}행은 점수에 넣지 않았습니다.`,
  });
}

export function buildAnalysisViewData(input: {
  dataSource: 'sample' | 'csv' | 'pdf' | null;
  tradeAnalysis: TradeHistoryAnalysisResult | null;
  diagnosis: DiagnosisProfile;
}): AnalysisViewData {
  if ((input.dataSource === 'csv' || input.dataSource === 'pdf') && input.tradeAnalysis)
    return buildTradeAnalysisViewData(input.tradeAnalysis, input.diagnosis);
  return buildSampleAnalysisViewData(input.diagnosis);
}
