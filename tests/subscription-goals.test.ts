import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildGoalCandidateFromComparison,
  evaluateSavedGoal,
  saveGoalFromCandidate,
} from '../src/lib/subscription/goals.ts';
import { type SnapshotComparison } from '../src/lib/subscription/snapshots.ts';

const comparison: SnapshotComparison = {
  status: 'compared',
  previousId: 'prev',
  currentId: 'curr',
  summary: '직전 분석과 최신 분석을 비교했어요.',
  dedupe: {
    totalExecutionCount: 2,
    duplicateExecutionCount: 0,
    uniqueExecutionCount: 2,
    contextExecutionCount: 0,
    duplicateRate: 0,
    copy: '중복 체결 없이 2건을 기준으로 저장했어요.',
  },
  rows: [
    {
      metricKey: 'lossHoldingHours',
      label: '손실 보유기간',
      previous: 120,
      current: 160,
      delta: 40,
      direction: 'worsened',
      status: 'compared',
      copy: '손실 보유기간: 5.0일 → 6.7일',
    },
    {
      metricKey: 'winRate',
      label: '청산 승률',
      previous: 0.4,
      current: 0.5,
      delta: 0.1,
      direction: 'improved',
      status: 'compared',
      copy: '청산 승률: 40.0% → 50.0%',
    },
  ],
};

test('직전 비교에서 악화된 회고 지표를 목표 후보로 만든다', () => {
  const candidate = buildGoalCandidateFromComparison(comparison);

  assert.equal(candidate?.metricKey, 'lossHoldingHours');
  assert.match(candidate?.title ?? '', /손실 보유기간/);
  assert.match(candidate?.description ?? '', /매수·매도 지시가 아니라/);
  assert.equal(candidate?.targetDirection, 'decrease');
});

test('목표 후보를 저장 목표로 바꾸면 기준 스냅샷과 기준값을 보존한다', () => {
  const candidate = buildGoalCandidateFromComparison(comparison)!;
  const saved = saveGoalFromCandidate(candidate, {
    id: 'goal-1',
    createdAt: '2026-09-02T00:00:00.000Z',
  });

  assert.equal(saved.id, 'goal-1');
  assert.equal(saved.baselineSnapshotId, 'curr');
  assert.equal(saved.baselineValue, 160);
  assert.equal(saved.status, 'active');
});

test('다음 비교에서 목표 지표가 개선되면 달성으로 평가한다', () => {
  const candidate = buildGoalCandidateFromComparison(comparison)!;
  const saved = saveGoalFromCandidate(candidate, {
    id: 'goal-1',
    createdAt: '2026-09-02T00:00:00.000Z',
  });
  const nextComparison: SnapshotComparison = {
    ...comparison,
    previousId: 'curr',
    currentId: 'next',
    rows: [
      {
        metricKey: 'lossHoldingHours',
        label: '손실 보유기간',
        previous: 160,
        current: 100,
        delta: -60,
        direction: 'improved',
        status: 'compared',
        copy: '손실 보유기간: 6.7일 → 4.2일',
      },
    ],
  };

  const evaluated = evaluateSavedGoal(saved, nextComparison);

  assert.equal(evaluated.status, 'achieved');
  assert.equal(evaluated.latestSnapshotId, 'next');
  assert.match(evaluated.evaluationCopy, /개선/);
});
