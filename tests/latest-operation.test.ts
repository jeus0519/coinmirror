import assert from 'node:assert/strict';
import test from 'node:test';

import { createLatestOperationGuard } from '../src/lib/latest-operation.ts';

test('이전 파일 작업은 새 작업 시작 또는 현재 작업 취소 뒤 결과를 적용할 수 없다', () => {
  const guard = createLatestOperationGuard();
  const first = guard.beginLatest();

  assert.equal(guard.isCurrent(first), true);

  const second = guard.beginLatest();
  assert.equal(guard.isCurrent(first), false);
  assert.equal(guard.isCurrent(second), true);

  guard.invalidate();
  assert.equal(guard.isCurrent(second), false);
});

test('화면 종료로 파기된 가드는 늦게 돌아온 파일 선택 콜백을 재무장하지 않는다', () => {
  const guard = createLatestOperationGuard();

  guard.destroy();

  assert.equal(guard.beginLatest(), null);
  assert.equal(guard.beginIfIdle(), null);
  assert.equal(guard.isAlive(), false);
});

test('Strict Mode 재마운트를 위해 revive하면 새 작업을 다시 시작할 수 있다', () => {
  const guard = createLatestOperationGuard();
  guard.destroy();

  guard.revive();
  const operation = guard.beginLatest();

  assert.ok(operation);
  assert.equal(guard.isAlive(), true);
  assert.equal(guard.isCurrent(operation), true);
});

test('오래된 작업의 finish는 현재 작업의 잠금을 해제하지 않는다', () => {
  const guard = createLatestOperationGuard();
  const stale = guard.beginLatest();
  const current = guard.beginLatest();

  assert.ok(stale);
  assert.ok(current);
  guard.finish(stale);

  assert.equal(guard.isCurrent(current), true);
  assert.equal(guard.beginIfIdle(), null);
});

test('PDF 비밀번호 처리는 실행 중 Enter 재제출을 동기적으로 거부한다', () => {
  const guard = createLatestOperationGuard();
  const first = guard.beginIfIdle();
  const duplicate = guard.beginIfIdle();

  assert.ok(first);
  assert.equal(duplicate, null);

  guard.finish(first);
  assert.ok(guard.beginIfIdle());
});
