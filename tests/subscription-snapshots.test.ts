import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildIncrementalSnapshotFromAnalysis,
  buildSnapshotFromAnalysis,
  compareSnapshots,
} from '../src/lib/subscription/snapshots.ts';
import { analyzeCsvInput } from '../src/lib/csv/analyze-csv.ts';

function analyze(csv: string) {
  return analyzeCsvInput(csv, {});
}

test('구독 스냅샷은 원본 거래내역 없이 분석 요약 화이트리스트만 저장한다', () => {
  const csv = [
    '마켓,구분,체결시간,체결가,수량,수수료',
    'KRW-BTC,매수,2026-01-01 09:00:00,100,1,0',
    'KRW-BTC,매도,2026-01-02 09:00:00,120,1,0',
    'KRW-ETH,매수,2026-01-03 09:00:00,100,1,0',
  ].join('\n');
  const analysis = analyze(csv);
  const snapshot = buildSnapshotFromAnalysis(analysis, {
    id: 'snap-1',
    ownerId: 'local-device',
    createdAt: '2026-09-01T00:00:00.000Z',
    isBaseline: true,
  });

  assert.equal(snapshot.id, 'snap-1');
  assert.equal(snapshot.ownerId, 'local-device');
  assert.equal(snapshot.isBaseline, true);
  assert.equal(snapshot.sourceFormat, 'csv');
  assert.equal(snapshot.investmentTypeCode.length, 7);
  assert.equal(snapshot.metrics.F1 !== undefined, true);
  assert.equal(snapshot.summary.orderCount > 0, true);
  assert.equal('parse' in snapshot, false);
  assert.equal('executions' in snapshot, false);
  assert.equal('password' in snapshot, false);
});

test('직전 스냅샷과 최신 스냅샷의 승률·보유기간·거래빈도 변화를 계산한다', () => {
  const previous = buildSnapshotFromAnalysis(
    analyze(
      [
        '마켓,구분,체결시간,체결가,수량,수수료',
        'KRW-BTC,매수,2026-01-01 09:00:00,100,1,0',
        'KRW-BTC,매도,2026-01-02 09:00:00,80,1,0',
        'KRW-ETH,매수,2026-01-03 09:00:00,100,1,0',
        'KRW-ETH,매도,2026-01-05 09:00:00,120,1,0',
      ].join('\n')
    ),
    { id: 'prev', ownerId: 'local-device', createdAt: '2026-08-01T00:00:00.000Z' }
  );
  const current = buildSnapshotFromAnalysis(
    analyze(
      [
        '마켓,구분,체결시간,체결가,수량,수수료',
        'KRW-BTC,매수,2026-02-01 09:00:00,100,1,0',
        'KRW-BTC,매도,2026-02-01 21:00:00,130,1,0',
        'KRW-ETH,매수,2026-02-03 09:00:00,100,1,0',
        'KRW-ETH,매도,2026-02-03 21:00:00,120,1,0',
      ].join('\n')
    ),
    { id: 'curr', ownerId: 'local-device', createdAt: '2026-09-01T00:00:00.000Z' }
  );

  const comparison = compareSnapshots(previous, current);

  assert.equal(comparison.previousId, 'prev');
  assert.equal(comparison.currentId, 'curr');
  assert.equal(comparison.rows.find((row) => row.metricKey === 'winRate')?.direction, 'improved');
  assert.equal(
    comparison.rows.find((row) => row.metricKey === 'lossHoldingHours')?.status,
    'pending'
  );
  assert.match(comparison.summary, /직전 분석/);
});

test('엔진 버전이 다르면 비교하지 않고 판단 보류한다', () => {
  const base = buildSnapshotFromAnalysis(
    analyze(
      [
        '마켓,구분,체결시간,체결가,수량,수수료',
        'KRW-BTC,매수,2026-01-01 09:00:00,100,1,0',
        'KRW-BTC,매도,2026-01-02 09:00:00,120,1,0',
      ].join('\n')
    ),
    { id: 'a', ownerId: 'local-device', createdAt: '2026-08-01T00:00:00.000Z' }
  );
  const current = { ...base, id: 'b', engineVersion: 'v0-legacy' };

  const comparison = compareSnapshots(base, current);

  assert.equal(comparison.status, 'version-mismatch');
  assert.match(comparison.summary, /분석 기준이 달라/);
});

test('2회차 업로드에 이전 체결이 섞여 있으면 중복 체결을 제외하고 신규 체결만 스냅샷으로 저장한다', () => {
  const first = buildSnapshotFromAnalysis(
    analyze(
      [
        '마켓,구분,체결시간,체결가,수량,수수료',
        'KRW-BTC,매수,2026-01-01 09:00:00,100,1,0',
        'KRW-BTC,매도,2026-01-02 09:00:00,120,1,0',
      ].join('\n')
    ),
    { id: 'first', ownerId: 'local-device', createdAt: '2026-08-01T00:00:00.000Z' }
  );

  const secondUpload = analyze(
    [
      '마켓,구분,체결시간,체결가,수량,수수료',
      'KRW-BTC,매수,2026-01-01 09:00:00,100,1,0',
      'KRW-BTC,매도,2026-01-02 09:00:00,120,1,0',
      'KRW-ETH,매수,2026-02-01 09:00:00,100,1,0',
      'KRW-ETH,매도,2026-02-02 09:00:00,80,1,0',
    ].join('\n')
  );

  const second = buildIncrementalSnapshotFromAnalysis(secondUpload, [first], {}, {
    id: 'second',
    ownerId: 'local-device',
    createdAt: '2026-09-01T00:00:00.000Z',
  });

  assert.equal(first.dedupe.totalExecutionCount, 2);
  assert.equal(second.dedupe.totalExecutionCount, 4);
  assert.equal(second.dedupe.duplicateExecutionCount, 2);
  assert.equal(second.dedupe.uniqueExecutionCount, 2);
  assert.equal(second.summary.orderCount, 2);
  assert.match(second.dedupe.copy, /중복 체결 2건을 제외/);
});

test('중복 체결이 포함된 비교는 자동 제외 사실과 비교 신뢰도 문구를 보여준다', () => {
  const previous = buildSnapshotFromAnalysis(
    analyze(
      [
        '마켓,구분,체결시간,체결가,수량,수수료',
        'KRW-BTC,매수,2026-01-01 09:00:00,100,1,0',
        'KRW-BTC,매도,2026-01-02 09:00:00,120,1,0',
      ].join('\n')
    ),
    { id: 'prev', ownerId: 'local-device', createdAt: '2026-08-01T00:00:00.000Z' }
  );
  const current = {
    ...previous,
    id: 'curr',
    dedupe: {
      totalExecutionCount: 4,
      duplicateExecutionCount: 2,
      uniqueExecutionCount: 2,
      contextExecutionCount: 0,
      duplicateRate: 0.5,
      copy: '이미 저장된 기준선과 겹치는 중복 체결 2건을 제외하고 신규 체결 2건만 비교했어요.',
    },
  };

  const comparison = compareSnapshots(previous, current);

  assert.equal(comparison.dedupe.duplicateExecutionCount, 2);
  assert.equal(comparison.dedupe.duplicateRate, 0.5);
  assert.match(comparison.dedupe.copy, /신규 체결 2건만 비교/);
});

test('기간 밖 매수분이 다음 업로드의 신규 매도로 청산되면 중복 매수를 context lot으로만 사용해 왕복거래를 보정한다', () => {
  const first = buildSnapshotFromAnalysis(
    analyze(
      [
        '마켓,구분,체결시간,체결가,수량,수수료',
        'KRW-BTC,매수,2026-01-01 09:00:00,100,1,0',
      ].join('\n')
    ),
    { id: 'first-open', ownerId: 'local-device', createdAt: '2026-08-01T00:00:00.000Z' }
  );

  const secondUpload = analyze(
    [
      '마켓,구분,체결시간,체결가,수량,수수료',
      'KRW-BTC,매수,2026-01-01 09:00:00,100,1,0',
      'KRW-BTC,매도,2026-02-01 09:00:00,130,1,0',
    ].join('\n')
  );

  const second = buildIncrementalSnapshotFromAnalysis(secondUpload, [first], {}, {
    id: 'second-close',
    ownerId: 'local-device',
    createdAt: '2026-09-01T00:00:00.000Z',
  });

  assert.equal(second.dedupe.totalExecutionCount, 2);
  assert.equal(second.dedupe.duplicateExecutionCount, 1);
  assert.equal(second.dedupe.uniqueExecutionCount, 1);
  assert.equal(second.dedupe.contextExecutionCount, 1);
  assert.equal(second.summary.roundTripCount, 1);
  assert.equal(second.summary.winRate, 1);
  assert.match(second.dedupe.copy, /기간 밖 매수 1건을 원가 연결용으로만 사용/);
});
