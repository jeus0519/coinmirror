import {
  type SnapshotComparison,
  type SubscriptionSnapshotMetricKey,
} from './snapshots';

export type SubscriptionGoalTargetDirection = 'increase' | 'decrease';
export type SubscriptionGoalStatus = 'active' | 'achieved' | 'missed' | 'pending';

export type SubscriptionGoalCandidate = {
  metricKey: SubscriptionSnapshotMetricKey;
  title: string;
  description: string;
  baselineSnapshotId: string;
  baselineValue: number;
  targetDirection: SubscriptionGoalTargetDirection;
};

export type SavedSubscriptionGoal = SubscriptionGoalCandidate & {
  id: string;
  createdAt: string;
  status: SubscriptionGoalStatus;
  latestSnapshotId: string | null;
  latestValue: number | null;
  evaluationCopy: string;
};

const GOAL_LABELS: Record<SubscriptionSnapshotMetricKey, string> = {
  winRate: '청산 승률',
  profitHoldingHours: '수익 보유기간',
  lossHoldingHours: '손실 보유기간',
  monthlyOrderCount: '월평균 주문 수',
};

function targetDirectionFor(metricKey: SubscriptionSnapshotMetricKey): SubscriptionGoalTargetDirection {
  return metricKey === 'winRate' ? 'increase' : 'decrease';
}

function formatGoalValue(metricKey: SubscriptionSnapshotMetricKey, value: number) {
  if (metricKey === 'winRate') return `${(value * 100).toFixed(1)}%`;
  if (metricKey === 'monthlyOrderCount') return `월 ${value.toFixed(1)}회`;
  if (value < 24) return `${value.toFixed(1)}시간`;
  return `${(value / 24).toFixed(1)}일`;
}

export function buildGoalCandidateFromComparison(
  comparison: SnapshotComparison | null
): SubscriptionGoalCandidate | null {
  if (!comparison || comparison.status !== 'compared') return null;
  const targetRow = comparison.rows.find(
    (row) => row.status === 'compared' && row.direction === 'worsened' && row.current !== null
  );
  if (!targetRow || targetRow.current === null) return null;

  const label = GOAL_LABELS[targetRow.metricKey];
  const targetDirection = targetDirectionFor(targetRow.metricKey);
  return {
    metricKey: targetRow.metricKey,
    title: `${label} 다시 점검하기`,
    description: `${label}이 직전 분석보다 나빠졌어요. 매수·매도 지시가 아니라 다음 업로드 때 이 행동 지표가 달라졌는지 회고하는 목표예요.`,
    baselineSnapshotId: comparison.currentId,
    baselineValue: targetRow.current,
    targetDirection,
  };
}

export function saveGoalFromCandidate(
  candidate: SubscriptionGoalCandidate,
  options: { id: string; createdAt: string }
): SavedSubscriptionGoal {
  return {
    ...candidate,
    id: options.id,
    createdAt: options.createdAt,
    status: 'active',
    latestSnapshotId: null,
    latestValue: null,
    evaluationCopy: `${GOAL_LABELS[candidate.metricKey]} 기준값 ${formatGoalValue(
      candidate.metricKey,
      candidate.baselineValue
    )}에서 다음 분석을 기다리고 있어요.`,
  };
}

export function evaluateSavedGoal(
  goal: SavedSubscriptionGoal,
  comparison: SnapshotComparison | null
): SavedSubscriptionGoal {
  if (!comparison || comparison.status !== 'compared') {
    return { ...goal, status: 'pending', evaluationCopy: '비교 가능한 다음 분석이 아직 없어요.' };
  }

  const row = comparison.rows.find((item) => item.metricKey === goal.metricKey);
  if (!row || row.status !== 'compared' || row.current === null) {
    return { ...goal, status: 'pending', evaluationCopy: '표본이 부족해 목표 달성 여부는 판단 보류예요.' };
  }

  const improved = goal.targetDirection === 'increase'
    ? row.current > goal.baselineValue
    : row.current < goal.baselineValue;
  const unchanged = Math.abs(row.current - goal.baselineValue) < 0.0001;
  const status: SubscriptionGoalStatus = improved ? 'achieved' : unchanged ? 'pending' : 'missed';
  const label = GOAL_LABELS[goal.metricKey];
  const copy = improved
    ? `${label}이 기준값 ${formatGoalValue(goal.metricKey, goal.baselineValue)}보다 개선됐어요.`
    : unchanged
      ? `${label}이 기준값과 비슷해 다음 분석까지 더 지켜봐요.`
      : `${label}이 기준값보다 나빠졌어요. 다음 회고에서 다시 확인해요.`;

  return {
    ...goal,
    status,
    latestSnapshotId: comparison.currentId,
    latestValue: row.current,
    evaluationCopy: copy,
  };
}
