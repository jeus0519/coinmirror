import assert from 'node:assert/strict';
import test from 'node:test';

import {
  clearPersistedSubscriptionState,
  loadPersistedSubscriptionState,
  persistSubscriptionState,
  SUBSCRIPTION_PERSISTENCE_KEY,
  SUBSCRIPTION_PERSISTENCE_VERSION,
} from '../src/lib/subscription/persistence.ts';
import { saveGoalFromCandidate } from '../src/lib/subscription/goals.ts';
import { type SubscriptionSnapshot } from '../src/lib/subscription/snapshots.ts';

function makeStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
  };
}

const snapshot: SubscriptionSnapshot = {
  id: 'snap-1',
  ownerId: 'local-device',
  createdAt: '2026-09-02T00:00:00.000Z',
  isBaseline: true,
  sourceFormat: 'pdf',
  engineVersion: 'phase1-v1',
  periodLabel: '2026.01.01 ~ 2026.01.31 KST',
  investmentTypeCode: 'W-R-L-N',
  investmentTypeTitle: '집중형 손실 보류가',
  metrics: { F1: 29, F3: 97, F6: 52, F8: 39 },
  summary: {
    orderCount: 226,
    roundTripCount: 107,
    winRate: 0.336,
    profitHoldingHours: 45.6,
    lossHoldingHours: 323.3,
    monthlyOrderCount: 226,
    openPositionCount: 3,
    symbolCount: 16,
  },
};

const goal = saveGoalFromCandidate(
  {
    metricKey: 'lossHoldingHours',
    title: '손실 보유기간 다시 점검하기',
    description: '매수·매도 지시가 아니라 회고 목표예요.',
    baselineSnapshotId: 'snap-1',
    baselineValue: 323.3,
    targetDirection: 'decrease',
  },
  { id: 'goal-1', createdAt: '2026-09-02T00:00:00.000Z' }
);

test('구독 스냅샷과 목표를 버전이 있는 로컬 payload로 저장하고 복원한다', () => {
  const storage = makeStorage();

  persistSubscriptionState(storage, { snapshots: [snapshot], goals: [goal] });

  const raw = storage.getItem(SUBSCRIPTION_PERSISTENCE_KEY);
  assert.ok(raw);
  assert.match(raw, new RegExp(SUBSCRIPTION_PERSISTENCE_VERSION));

  const restored = loadPersistedSubscriptionState(storage);
  assert.equal(restored.snapshots.length, 1);
  assert.equal(restored.goals.length, 1);
  assert.equal(restored.snapshots[0].investmentTypeCode, 'W-R-L-N');
  assert.equal(restored.goals[0].id, 'goal-1');
});

test('로컬 저장 payload에는 원본 거래내역과 PDF 비밀번호를 보존하지 않는다', () => {
  const storage = makeStorage();
  const unsafeSnapshot = {
    ...snapshot,
    parse: { executions: [{ symbol: 'KRW-BTC' }] },
    executions: [{ symbol: 'KRW-BTC' }],
    password: 'NEVER_STORE',
  } as unknown as SubscriptionSnapshot;

  persistSubscriptionState(storage, { snapshots: [unsafeSnapshot], goals: [goal] });

  const raw = storage.getItem(SUBSCRIPTION_PERSISTENCE_KEY)!;
  assert.equal(raw.includes('NEVER_STORE'), false);
  assert.equal(raw.includes('executions'), false);
  assert.equal(raw.includes('parse'), false);
});

test('손상되었거나 버전이 다른 저장 데이터는 안전하게 빈 상태로 복원한다', () => {
  const broken = makeStorage();
  broken.setItem(SUBSCRIPTION_PERSISTENCE_KEY, '{not-json');
  assert.deepEqual(loadPersistedSubscriptionState(broken), { snapshots: [], goals: [] });

  const old = makeStorage();
  old.setItem(
    SUBSCRIPTION_PERSISTENCE_KEY,
    JSON.stringify({ version: 'old-version', snapshots: [snapshot], goals: [goal] })
  );
  assert.deepEqual(loadPersistedSubscriptionState(old), { snapshots: [], goals: [] });
});

test('내 데이터 삭제는 로컬 저장소의 구독관리 payload를 제거한다', () => {
  const storage = makeStorage();
  persistSubscriptionState(storage, { snapshots: [snapshot], goals: [goal] });

  clearPersistedSubscriptionState(storage);

  assert.equal(storage.getItem(SUBSCRIPTION_PERSISTENCE_KEY), null);
  assert.deepEqual(loadPersistedSubscriptionState(storage), { snapshots: [], goals: [] });
});
