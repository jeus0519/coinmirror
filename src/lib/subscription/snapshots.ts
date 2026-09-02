import { type Metric } from '../mock-metrics';
import { type TradeHistoryAnalysisResult, type TradeHistorySourceFormat } from '../trade-history/build-analysis';

export const SUBSCRIPTION_SNAPSHOT_ENGINE_VERSION = 'phase1-v1';

export type SubscriptionSnapshotMetricKey =
  | 'winRate'
  | 'profitHoldingHours'
  | 'lossHoldingHours'
  | 'monthlyOrderCount';

export type SubscriptionSnapshot = {
  id: string;
  ownerId: string;
  createdAt: string;
  isBaseline: boolean;
  sourceFormat: TradeHistorySourceFormat;
  engineVersion: string;
  periodLabel: string;
  investmentTypeCode: string;
  investmentTypeTitle: string;
  metrics: Record<string, number | null>;
  summary: {
    orderCount: number;
    roundTripCount: number;
    winRate: number | null;
    profitHoldingHours: number | null;
    lossHoldingHours: number | null;
    monthlyOrderCount: number;
    openPositionCount: number;
    symbolCount: number;
  };
};

export type SnapshotComparisonRow = {
  metricKey: SubscriptionSnapshotMetricKey;
  label: string;
  previous: number | null;
  current: number | null;
  delta: number | null;
  direction: 'improved' | 'worsened' | 'unchanged';
  status: 'compared' | 'pending';
  copy: string;
};

export type SnapshotComparison = {
  status: 'compared' | 'version-mismatch';
  previousId: string;
  currentId: string;
  summary: string;
  rows: SnapshotComparisonRow[];
};

function metricsToRecord(metrics: readonly Metric[]) {
  return Object.fromEntries(metrics.map((metric) => [metric.id, metric.score])) as Record<
    string,
    number | null
  >;
}

export function buildSnapshotFromAnalysis(
  analysis: TradeHistoryAnalysisResult,
  options: { id: string; ownerId: string; createdAt: string; isBaseline?: boolean }
): SubscriptionSnapshot {
  const series = analysis.derivedSeries;
  return {
    id: options.id,
    ownerId: options.ownerId,
    createdAt: options.createdAt,
    isBaseline: options.isBaseline ?? false,
    sourceFormat: analysis.sourceFormat,
    engineVersion: SUBSCRIPTION_SNAPSHOT_ENGINE_VERSION,
    periodLabel: analysis.preview.periodLabel,
    investmentTypeCode: analysis.investmentType.code,
    investmentTypeTitle: analysis.investmentType.title,
    metrics: metricsToRecord(analysis.metrics),
    summary: {
      orderCount: series?.orderCount ?? 0,
      roundTripCount: series?.roundTripCount ?? 0,
      winRate: series?.winRate ?? null,
      profitHoldingHours: series?.medianHoldingHours.profit ?? null,
      lossHoldingHours: series?.medianHoldingHours.loss ?? null,
      monthlyOrderCount: series?.monthlyOrderCount ?? 0,
      openPositionCount: series?.openPositionCount ?? 0,
      symbolCount: analysis.preview.symbolCount,
    },
  };
}

function formatValue(metricKey: SubscriptionSnapshotMetricKey, value: number | null) {
  if (value === null) return '판단 보류';
  if (metricKey === 'winRate') return `${(value * 100).toFixed(1)}%`;
  if (metricKey === 'monthlyOrderCount') return `월 ${value.toFixed(1)}회`;
  if (value < 24) return `${value.toFixed(1)}시간`;
  return `${(value / 24).toFixed(1)}일`;
}

function compareRow(
  metricKey: SubscriptionSnapshotMetricKey,
  label: string,
  previous: number | null,
  current: number | null,
  higherIsBetter: boolean
): SnapshotComparisonRow {
  if (previous === null || current === null) {
    return {
      metricKey,
      label,
      previous,
      current,
      delta: null,
      direction: 'unchanged',
      status: 'pending',
      copy: `${label}은 아직 표본이 부족해 판단 보류예요.`,
    };
  }

  const delta = current - previous;
  const isSame = Math.abs(delta) < 0.0001;
  const improved = higherIsBetter ? delta > 0 : delta < 0;
  const direction = isSame ? 'unchanged' : improved ? 'improved' : 'worsened';
  return {
    metricKey,
    label,
    previous,
    current,
    delta,
    direction,
    status: 'compared',
    copy: `${label}: ${formatValue(metricKey, previous)} → ${formatValue(metricKey, current)}`,
  };
}

export function compareSnapshots(
  previous: SubscriptionSnapshot,
  current: SubscriptionSnapshot
): SnapshotComparison {
  if (previous.engineVersion !== current.engineVersion) {
    return {
      status: 'version-mismatch',
      previousId: previous.id,
      currentId: current.id,
      summary: '분석 기준이 달라 이번 회차는 이전 기준선과 직접 비교하지 않았어요.',
      rows: [],
    };
  }

  const rows = [
    compareRow('winRate', '청산 승률', previous.summary.winRate, current.summary.winRate, true),
    compareRow(
      'lossHoldingHours',
      '손실 보유기간',
      previous.summary.lossHoldingHours,
      current.summary.lossHoldingHours,
      false
    ),
    compareRow(
      'profitHoldingHours',
      '수익 보유기간',
      previous.summary.profitHoldingHours,
      current.summary.profitHoldingHours,
      false
    ),
    compareRow(
      'monthlyOrderCount',
      '월평균 주문 수',
      previous.summary.monthlyOrderCount,
      current.summary.monthlyOrderCount,
      false
    ),
  ];

  return {
    status: 'compared',
    previousId: previous.id,
    currentId: current.id,
    summary: `직전 분석(${previous.periodLabel})과 최신 분석(${current.periodLabel})을 비교했어요.`,
    rows,
  };
}
