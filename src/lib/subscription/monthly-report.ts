import { type SavedSubscriptionGoal } from './goals';
import { type SnapshotComparisonRow, type SubscriptionSnapshot } from './snapshots';

export type MonthlyHabitReportStatus = 'ready' | 'insufficient-data';

export type MonthlyHabitReportMetric = {
  key:
    | 'analysisCount'
    | 'uniqueExecutionCount'
    | 'duplicateExecutionCount'
    | 'contextExecutionCount'
    | 'winRate'
    | 'lossHoldingHours'
    | 'profitHoldingHours'
    | 'monthlyOrderCount';
  label: string;
  value: string;
  helper: string;
  tone?: 'positive' | 'negative' | 'neutral';
};

export type MonthlyHabitReportChange = {
  metricKey: SnapshotComparisonRow['metricKey'];
  label: string;
  copy: string;
  status: 'improved' | 'worsened' | 'unchanged' | 'pending';
};

export type MonthlyHabitReportGoalSummary = {
  total: number;
  achieved: number;
  missed: number;
  pending: number;
  active: number;
  highlights: string[];
};

export type MonthlyHabitReport = {
  status: MonthlyHabitReportStatus;
  monthKey: string;
  title: string;
  subtitle: string;
  summaryCopy: string;
  metrics: MonthlyHabitReportMetric[];
  changes: MonthlyHabitReportChange[];
  goalSummary: MonthlyHabitReportGoalSummary;
  safetyCopy: string;
};

function monthKeyFrom(value: string) {
  return value.slice(0, 7);
}

function latestMonthKey(snapshots: readonly SubscriptionSnapshot[]) {
  return [...snapshots]
    .map((snapshot) => monthKeyFrom(snapshot.createdAt))
    .sort()
    .at(-1);
}

function formatCount(value: number) {
  return `${value}건`;
}

function formatAnalysisCount(value: number) {
  return `${value}개`;
}

function formatRate(value: number | null) {
  return value === null ? '판단 보류' : `${(value * 100).toFixed(1)}%`;
}

function formatHours(value: number | null) {
  if (value === null) return '판단 보류';
  if (value < 24) return `${value.toFixed(1)}시간`;
  return `${(value / 24).toFixed(1)}일`;
}

function formatMonthlyOrders(value: number) {
  return `월 ${value.toFixed(1)}회`;
}

function averageNullable(values: (number | null)[]) {
  const numbers = values.filter((value): value is number => value !== null);
  if (numbers.length === 0) return null;
  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

function sumBy<T>(items: readonly T[], pick: (item: T) => number) {
  return items.reduce((sum, item) => sum + pick(item), 0);
}

function buildGoalSummary(goals: readonly SavedSubscriptionGoal[]): MonthlyHabitReportGoalSummary {
  return {
    total: goals.length,
    achieved: goals.filter((goal) => goal.status === 'achieved').length,
    missed: goals.filter((goal) => goal.status === 'missed').length,
    pending: goals.filter((goal) => goal.status === 'pending').length,
    active: goals.filter((goal) => goal.status === 'active').length,
    highlights: goals.slice(0, 3).map((goal) => goal.title),
  };
}

function changeStatus(delta: number | null, higherIsBetter: boolean) {
  if (delta === null || Math.abs(delta) < 0.0001) return delta === null ? 'pending' : 'unchanged';
  const improved = higherIsBetter ? delta > 0 : delta < 0;
  return improved ? 'improved' : 'worsened';
}

function buildChanges(previous: SubscriptionSnapshot, current: SubscriptionSnapshot): MonthlyHabitReportChange[] {
  const rows = [
    {
      metricKey: 'winRate' as const,
      label: '청산 승률',
      previous: previous.summary.winRate,
      current: current.summary.winRate,
      higherIsBetter: true,
      format: formatRate,
    },
    {
      metricKey: 'lossHoldingHours' as const,
      label: '손실 보유기간',
      previous: previous.summary.lossHoldingHours,
      current: current.summary.lossHoldingHours,
      higherIsBetter: false,
      format: formatHours,
    },
    {
      metricKey: 'profitHoldingHours' as const,
      label: '수익 보유기간',
      previous: previous.summary.profitHoldingHours,
      current: current.summary.profitHoldingHours,
      higherIsBetter: false,
      format: formatHours,
    },
    {
      metricKey: 'monthlyOrderCount' as const,
      label: '월평균 주문 수',
      previous: previous.summary.monthlyOrderCount,
      current: current.summary.monthlyOrderCount,
      higherIsBetter: false,
      format: formatMonthlyOrders,
    },
  ];

  return rows.map((row) => {
    const delta = row.previous === null || row.current === null ? null : row.current - row.previous;
    const status = changeStatus(delta, row.higherIsBetter);
    return {
      metricKey: row.metricKey,
      label: row.label,
      status,
      copy:
        status === 'pending'
          ? `${row.label}은 아직 표본이 부족해 판단 보류예요.`
          : `${row.label}: ${row.format(row.previous as never)} → ${row.format(row.current as never)}`,
    };
  });
}

export function buildMonthlyHabitReport(
  snapshots: readonly SubscriptionSnapshot[],
  goals: readonly SavedSubscriptionGoal[],
  options: { monthKey?: string } = {}
): MonthlyHabitReport {
  const monthKey = options.monthKey ?? latestMonthKey(snapshots) ?? 'unknown';
  const monthlySnapshots = snapshots.filter((snapshot) => monthKeyFrom(snapshot.createdAt) === monthKey);
  const safetyCopy = '원본 PDF, PDF 비밀번호, 개별 체결 원문은 저장하지 않고 분석 요약만으로 만든 회고예요.';
  const title = `${monthKey} 월간 투자습관 리포트 미리보기`;
  const subtitle = '이번 리포트는 이 달에 저장한 분석 요약을 기준으로 만든 회고예요.';

  if (monthlySnapshots.length < 2) {
    return {
      status: 'insufficient-data',
      monthKey,
      title,
      subtitle,
      summaryCopy: '한 번 더 업로드하고 분석을 저장하면 월간 변화 요약이 생겨요.',
      metrics: [
        {
          key: 'analysisCount',
          label: '이번 달 저장한 분석',
          value: formatAnalysisCount(monthlySnapshots.length),
          helper: '2개 이상 저장되면 변화 요약을 만들 수 있어요.',
          tone: 'neutral',
        },
      ],
      changes: [],
      goalSummary: buildGoalSummary([]),
      safetyCopy,
    };
  }

  const sorted = [...monthlySnapshots].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const previous = sorted.at(-2)!;
  const current = sorted.at(-1)!;
  const uniqueExecutionCount = sumBy(sorted, (snapshot) => snapshot.dedupe.uniqueExecutionCount);
  const duplicateExecutionCount = sumBy(sorted, (snapshot) => snapshot.dedupe.duplicateExecutionCount);
  const contextExecutionCount = sumBy(sorted, (snapshot) => snapshot.dedupe.contextExecutionCount);

  return {
    status: 'ready',
    monthKey,
    title,
    subtitle,
    summaryCopy: `이번 달 저장한 분석 ${sorted.length}개를 기준으로 행동 지표 변화를 정리했어요.`,
    metrics: [
      {
        key: 'analysisCount',
        label: '이번 달 저장한 분석',
        value: formatAnalysisCount(sorted.length),
        helper: '이 달에 저장한 분석 요약 수예요.',
        tone: 'neutral',
      },
      {
        key: 'uniqueExecutionCount',
        label: '신규 반영 체결',
        value: formatCount(uniqueExecutionCount),
        helper: '중복을 제외하고 이번 리포트에 반영한 체결이에요.',
        tone: 'positive',
      },
      {
        key: 'duplicateExecutionCount',
        label: '중복 제외',
        value: formatCount(duplicateExecutionCount),
        helper: '이미 저장된 기준선과 겹쳐 제외한 체결이에요.',
        tone: duplicateExecutionCount > 0 ? 'positive' : 'neutral',
      },
      {
        key: 'contextExecutionCount',
        label: '원가 연결 보정',
        value: formatCount(contextExecutionCount),
        helper: '기간 밖 매수분을 중복 집계하지 않고 원가 연결용으로만 쓴 건수예요.',
        tone: contextExecutionCount > 0 ? 'positive' : 'neutral',
      },
      {
        key: 'winRate',
        label: '평균 청산 승률',
        value: formatRate(averageNullable(sorted.map((snapshot) => snapshot.summary.winRate))),
        helper: '저장한 분석들의 청산 승률 평균이에요.',
        tone: 'neutral',
      },
      {
        key: 'lossHoldingHours',
        label: '평균 손실 보유기간',
        value: formatHours(averageNullable(sorted.map((snapshot) => snapshot.summary.lossHoldingHours))),
        helper: '손실 청산 표본이 부족하면 판단 보류로 둬요.',
        tone: 'neutral',
      },
      {
        key: 'profitHoldingHours',
        label: '평균 수익 보유기간',
        value: formatHours(averageNullable(sorted.map((snapshot) => snapshot.summary.profitHoldingHours))),
        helper: '수익 청산 표본이 부족하면 판단 보류로 둬요.',
        tone: 'neutral',
      },
      {
        key: 'monthlyOrderCount',
        label: '평균 월 주문 수',
        value: formatMonthlyOrders(
          sumBy(sorted, (snapshot) => snapshot.summary.monthlyOrderCount) / sorted.length
        ),
        helper: '저장한 분석 기준의 월평균 주문 수예요.',
        tone: 'neutral',
      },
    ],
    changes: buildChanges(previous, current),
    goalSummary: buildGoalSummary(goals),
    safetyCopy,
  };
}
