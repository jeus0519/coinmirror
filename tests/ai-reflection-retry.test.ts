import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AI_REFLECTION_MAX_RETRIES,
  AI_REFLECTION_RETRY_COOLDOWN_MS,
  buildAiReflectionFingerprint,
  createAiReflectionRetryState,
  getAiReflectionRetryStatus,
  isAiReflectionRequestCurrent,
  markAiReflectionFailure,
  markAiReflectionSuccess,
} from '../src/lib/ai-reflection-retry.ts';

test('AI 행동코칭은 최초 실패 후 30초 뒤 최대 3회 재시도할 수 있다', () => {
  const fingerprint = 'analysis-a';
  const initial = createAiReflectionRetryState();
  const firstFailure = markAiReflectionFailure(initial, fingerprint, 1_000);

  assert.equal(AI_REFLECTION_MAX_RETRIES, 3);
  assert.equal(AI_REFLECTION_RETRY_COOLDOWN_MS, 30_000);
  assert.equal(firstFailure[fingerprint]?.failedAttempts, 1);

  const coolingDown = getAiReflectionRetryStatus(firstFailure, fingerprint, 30_999);
  assert.equal(coolingDown.kind, 'cooldown');
  assert.equal(coolingDown.cooldownSeconds, 1);
  assert.equal(coolingDown.remainingRetries, 3);

  const ready = getAiReflectionRetryStatus(firstFailure, fingerprint, 31_000);
  assert.equal(ready.kind, 'ready');
  assert.equal(ready.remainingRetries, 3);
});

test('AI 행동코칭은 최초 시도와 재시도 3회가 모두 실패하면 해당 분석을 잠근다', () => {
  const fingerprint = 'analysis-a';
  let state = createAiReflectionRetryState();

  state = markAiReflectionFailure(state, fingerprint, 0);
  assert.equal(getAiReflectionRetryStatus(state, fingerprint, 30_000).remainingRetries, 3);
  state = markAiReflectionFailure(state, fingerprint, 30_000);
  assert.equal(getAiReflectionRetryStatus(state, fingerprint, 60_000).remainingRetries, 2);
  state = markAiReflectionFailure(state, fingerprint, 60_000);
  assert.equal(getAiReflectionRetryStatus(state, fingerprint, 90_000).remainingRetries, 1);
  state = markAiReflectionFailure(state, fingerprint, 90_000);

  const exhausted = getAiReflectionRetryStatus(state, fingerprint, 120_000);
  assert.equal(exhausted.kind, 'exhausted');
  assert.equal(exhausted.remainingRetries, 0);
  assert.equal(state[fingerprint]?.failedAttempts, 4);
});

test('AI 행동코칭은 성공하면 즉시 잠그고 새 분석에서는 재시도 횟수를 초기화한다', () => {
  const fingerprint = 'analysis-a';
  const failed = markAiReflectionFailure(createAiReflectionRetryState(), fingerprint, 0);
  const succeeded = markAiReflectionSuccess(failed, fingerprint);

  assert.equal(getAiReflectionRetryStatus(succeeded, fingerprint, 31_000).kind, 'succeeded');

  const nextAnalysis = getAiReflectionRetryStatus(succeeded, 'analysis-b', 31_000);
  assert.equal(nextAnalysis.kind, 'ready');
  assert.equal(nextAnalysis.remainingRetries, 3);
});

test('fingerprint별 재시도 상태는 다른 분석을 본 뒤 돌아와도 유지된다', () => {
  let state = createAiReflectionRetryState();
  state = markAiReflectionFailure(state, 'analysis-a', 0);
  state = markAiReflectionFailure(state, 'analysis-a', 30_000);
  state = markAiReflectionFailure(state, 'analysis-b', 60_000);

  const analysisA = getAiReflectionRetryStatus(state, 'analysis-a', 60_000);
  const analysisB = getAiReflectionRetryStatus(state, 'analysis-b', 90_000);
  assert.equal(analysisA.kind, 'ready');
  assert.equal(analysisA.remainingRetries, 2);
  assert.equal(analysisB.kind, 'ready');
  assert.equal(analysisB.remainingRetries, 3);
});

test('늦게 도착한 이전 분석 응답은 현재 분석 상태에 적용하지 않는다', () => {
  assert.equal(isAiReflectionRequestCurrent('analysis-a', 'analysis-a'), true);
  assert.equal(isAiReflectionRequestCurrent('analysis-a', 'analysis-b'), false);
  assert.equal(isAiReflectionRequestCurrent('analysis-a', null), false);
});

test('샘플 분석도 null 비교로 처음부터 잠기지 않도록 독립 fingerprint를 사용한다', () => {
  assert.equal(buildAiReflectionFingerprint(null, 'sample'), 'sample-analysis');
  assert.equal(buildAiReflectionFingerprint('uploaded-a', 'csv'), 'uploaded-a');
  assert.equal(buildAiReflectionFingerprint(null, 'csv'), null);
});
