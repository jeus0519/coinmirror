import { type DiagnosisProfile } from '../onboarding-diagnosis';
import { type Metric } from '../mock-metrics';
import {
  analyzeParseResult,
  type TradeHistoryAnalysisResult,
  type TradeHistorySourceFormat,
} from '../trade-history/build-analysis';
import { type RawExecution } from '../score-engine/preprocess';

export const SUBSCRIPTION_SNAPSHOT_ENGINE_VERSION = 'phase1-v1';

export type SubscriptionSnapshotMetricKey =
  | 'winRate'
  | 'profitHoldingHours'
  | 'lossHoldingHours'
  | 'monthlyOrderCount';

export type SubscriptionSnapshotDedupe = {
  totalExecutionCount: number;
  duplicateExecutionCount: number;
  uniqueExecutionCount: number;
  contextExecutionCount: number;
  duplicateRate: number;
  copy: string;
};

export type SubscriptionSnapshot = {
  id: string;
  ownerId: string;
  createdAt: string;
  isBaseline: boolean;
  sourceFormat: TradeHistorySourceFormat;
  engineVersion: string;
  periodLabel: string;
  periodStart: string | null;
  periodEnd: string | null;
  investmentTypeCode: string;
  investmentTypeTitle: string;
  metrics: Record<string, number | null>;
  executionFingerprints: string[];
  sourceFingerprint: string;
  dedupe: SubscriptionSnapshotDedupe;
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
  dedupe: SubscriptionSnapshotDedupe;
  rows: SnapshotComparisonRow[];
};

function metricsToRecord(metrics: readonly Metric[]) {
  return Object.fromEntries(metrics.map((metric) => [metric.id, metric.score])) as Record<
    string,
    number | null
  >;
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fp_${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function normalizeNumber(value: number) {
  return Number(value.toFixed(8)).toString();
}

export function buildExecutionFingerprint(execution: RawExecution) {
  return stableHash(
    [
      execution.executedAt,
      execution.symbol,
      execution.side,
      normalizeNumber(execution.price),
      normalizeNumber(execution.quantity),
      normalizeNumber(execution.fee),
    ].join('|')
  );
}

function periodFromExecutions(executions: readonly RawExecution[]) {
  const times = executions.map((execution) => execution.executedAt).sort();
  return {
    periodStart: times[0] ?? null,
    periodEnd: times.at(-1) ?? null,
  };
}

function sourceFingerprintFrom(executionFingerprints: readonly string[]) {
  return stableHash([...executionFingerprints].sort().join('|'));
}

function dedupeCopy(total: number, duplicate: number, unique: number, context = 0) {
  const contextCopy = context > 0 ? ` 기간 밖 매수 ${context}건을 원가 연결용으로만 사용했어요.` : '';
  if (duplicate === 0) return `중복 체결 없이 ${unique}건을 기준으로 저장했어요.`;
  if (unique === 0) {
    return `이미 저장된 기준선과 모두 겹쳐 중복 체결 ${duplicate}건을 제외했어요.${contextCopy}`;
  }
  return `이미 저장된 기준선과 겹치는 중복 체결 ${duplicate}건을 제외하고 신규 체결 ${unique}건만 비교했어요.${contextCopy}`;
}

function buildSnapshot(
  analysis: TradeHistoryAnalysisResult,
  options: { id: string; ownerId: string; createdAt: string; isBaseline?: boolean },
  dedupe: SubscriptionSnapshotDedupe,
  sourceExecutions: readonly RawExecution[]
): SubscriptionSnapshot {
  const series = analysis.derivedSeries;
  const executionFingerprints = sourceExecutions.map(buildExecutionFingerprint);
  const { periodStart, periodEnd } = periodFromExecutions(sourceExecutions);
  return {
    id: options.id,
    ownerId: options.ownerId,
    createdAt: options.createdAt,
    isBaseline: options.isBaseline ?? false,
    sourceFormat: analysis.sourceFormat,
    engineVersion: SUBSCRIPTION_SNAPSHOT_ENGINE_VERSION,
    periodLabel: analysis.preview.periodLabel,
    periodStart,
    periodEnd,
    investmentTypeCode: analysis.investmentType.code,
    investmentTypeTitle: analysis.investmentType.title,
    metrics: metricsToRecord(analysis.metrics),
    executionFingerprints,
    sourceFingerprint: sourceFingerprintFrom(executionFingerprints),
    dedupe,
    summary: {
      orderCount: Math.max(0, (series?.orderCount ?? 0) - dedupe.contextExecutionCount),
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

export function buildSnapshotFromAnalysis(
  analysis: TradeHistoryAnalysisResult,
  options: { id: string; ownerId: string; createdAt: string; isBaseline?: boolean }
): SubscriptionSnapshot {
  const executions = analysis.parse.executions;
  const dedupe: SubscriptionSnapshotDedupe = {
    totalExecutionCount: executions.length,
    duplicateExecutionCount: 0,
    uniqueExecutionCount: executions.length,
    contextExecutionCount: 0,
    duplicateRate: 0,
    copy: dedupeCopy(executions.length, 0, executions.length),
  };
  return buildSnapshot(analysis, options, dedupe, executions);
}

export function buildIncrementalSnapshotFromAnalysis(
  analysis: TradeHistoryAnalysisResult,
  previousSnapshots: readonly SubscriptionSnapshot[],
  diagnosis: DiagnosisProfile,
  options: { id: string; ownerId: string; createdAt: string; isBaseline?: boolean }
): SubscriptionSnapshot {
  const seen = new Set(previousSnapshots.flatMap((snapshot) => snapshot.executionFingerprints));
  const uniqueExecutions = analysis.parse.executions.filter(
    (execution) => !seen.has(buildExecutionFingerprint(execution))
  );
  const duplicateExecutions = analysis.parse.executions.filter((execution) =>
    seen.has(buildExecutionFingerprint(execution))
  );
  const contextExecutions = duplicateExecutions.filter((execution) => execution.side === 'buy');
  const duplicateExecutionCount = analysis.parse.executions.length - uniqueExecutions.length;
  const nextAnalysis = analyzeParseResult(
    { ...analysis.parse, executions: [...contextExecutions, ...uniqueExecutions] },
    diagnosis,
    analysis.sourceFormat
  );
  const dedupe: SubscriptionSnapshotDedupe = {
    totalExecutionCount: analysis.parse.executions.length,
    duplicateExecutionCount,
    uniqueExecutionCount: uniqueExecutions.length,
    contextExecutionCount: contextExecutions.length,
    duplicateRate: analysis.parse.executions.length
      ? duplicateExecutionCount / analysis.parse.executions.length
      : 0,
    copy: dedupeCopy(
      analysis.parse.executions.length,
      duplicateExecutionCount,
      uniqueExecutions.length,
      contextExecutions.length
    ),
  };
  return buildSnapshot(nextAnalysis, options, dedupe, uniqueExecutions);
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
      dedupe: current.dedupe,
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
    dedupe: current.dedupe,
    rows,
  };
}
