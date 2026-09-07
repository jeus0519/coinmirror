import assert from 'node:assert/strict';
import test from 'node:test';

import { buildMonthlyHabitReport } from '../src/lib/subscription/monthly-report.ts';
import { analyzeCsvInput } from '../src/lib/csv/analyze-csv.ts';
import {
  buildIncrementalSnapshotFromAnalysis,
  buildSnapshotFromAnalysis,
} from '../src/lib/subscription/snapshots.ts';
import { buildGoalCandidateFromComparison, saveGoalFromCandidate } from '../src/lib/subscription/goals.ts';
import { compareSnapshots } from '../src/lib/subscription/snapshots.ts';

function csv(rows: string[]) {
  return ['마켓,구분,체결시간,체결가,수량,수수료', ...rows].join('\n');
}

test('같은 월에 저장된 스냅샷 2개 이상이면 월간 리포트 ready view model을 만든다', () => {
  const baseline = buildSnapshotFromAnalysis(
    analyzeCsvInput(csv(['KRW-BTC,매수,2026-01-01 09:00:00,100,1,0']), {}),
    { id: 'snap-1', ownerId: 'local-device', createdAt: '2026-09-01T00:00:00.000Z', isBaseline: true }
  );
  const current = buildIncrementalSnapshotFromAnalysis(
    analyzeCsvInput(
      csv([
        'KRW-BTC,매수,2026-01-01 09:00:00,100,1,0',
        'KRW-BTC,매도,2026-02-01 09:00:00,130,1,0',
        'KRW-ETH,매수,2026-02-03 09:00:00,100,1,0',
        'KRW-ETH,매도,2026-02-04 09:00:00,80,1,0',
      ]),
      {}
    ),
    [baseline],
    {},
    { id: 'snap-2', ownerId: 'local-device', createdAt: '2026-09-10T00:00:00.000Z' }
  );
  const comparison = compareSnapshots(baseline, current);
  const candidate = buildGoalCandidateFromComparison(comparison);
  const goals = candidate ? [saveGoalFromCandidate(candidate, { id: 'goal-1', createdAt: '2026-09-10T00:00:00.000Z' })] : [];

  const report = buildMonthlyHabitReport([baseline, current], goals, { monthKey: '2026-09' });

  assert.equal(report.status, 'ready');
  assert.equal(report.monthKey, '2026-09');
  assert.match(report.title, /월간 투자습관 리포트/);
  assert.match(report.subtitle, /이 달에 저장한 분석 요약/);
  assert.equal(report.metrics.find((metric) => metric.key === 'analysisCount')?.value, '2개');
  assert.equal(report.metrics.find((metric) => metric.key === 'uniqueExecutionCount')?.value, '4건');
  assert.equal(report.metrics.find((metric) => metric.key === 'duplicateExecutionCount')?.value, '1건');
  assert.equal(report.metrics.find((metric) => metric.key === 'contextExecutionCount')?.value, '1건');
  assert.equal(report.goalSummary.total, goals.length);
  assert.match(report.safetyCopy, /원본 PDF/);
  assert.match(report.safetyCopy, /개별 체결 원문/);
});

test('스냅샷이 2개 미만이면 숫자를 과장하지 않고 insufficient-data 리포트를 만든다', () => {
  const single = buildSnapshotFromAnalysis(
    analyzeCsvInput(csv(['KRW-BTC,매수,2026-01-01 09:00:00,100,1,0']), {}),
    { id: 'snap-1', ownerId: 'local-device', createdAt: '2026-09-01T00:00:00.000Z', isBaseline: true }
  );

  const report = buildMonthlyHabitReport([single], [], { monthKey: '2026-09' });

  assert.equal(report.status, 'insufficient-data');
  assert.match(report.summaryCopy, /한 번 더/);
  assert.equal(report.changes.length, 0);
  assert.equal(report.goalSummary.total, 0);
});

test('월간 리포트는 요청 월의 스냅샷만 묶고 최신 월을 기본값으로 선택한다', () => {
  const august = buildSnapshotFromAnalysis(
    analyzeCsvInput(csv(['KRW-BTC,매수,2026-08-01 09:00:00,100,1,0']), {}),
    { id: 'aug', ownerId: 'local-device', createdAt: '2026-08-15T00:00:00.000Z' }
  );
  const september1 = buildSnapshotFromAnalysis(
    analyzeCsvInput(csv(['KRW-BTC,매수,2026-09-01 09:00:00,100,1,0']), {}),
    { id: 'sep-1', ownerId: 'local-device', createdAt: '2026-09-01T00:00:00.000Z' }
  );
  const september2 = buildSnapshotFromAnalysis(
    analyzeCsvInput(csv(['KRW-ETH,매수,2026-09-02 09:00:00,100,1,0']), {}),
    { id: 'sep-2', ownerId: 'local-device', createdAt: '2026-09-02T00:00:00.000Z' }
  );

  const report = buildMonthlyHabitReport([august, september1, september2], []);

  assert.equal(report.monthKey, '2026-09');
  assert.equal(report.metrics.find((metric) => metric.key === 'analysisCount')?.value, '2개');
});


test('스냅샷이 없어도 unknown 같은 개발자용 fallback을 고객 제목에 노출하지 않는다', () => {
  const report = buildMonthlyHabitReport([], []);

  assert.equal(report.status, 'insufficient-data');
  assert.equal(report.monthKey, 'current');
  assert.doesNotMatch(report.title, /unknown/i);
  assert.match(report.title, /이번 달 월간 투자습관 리포트 미리보기/);
});
