import { type SavedSubscriptionGoal } from './goals';
import { type SubscriptionSnapshot } from './snapshots';

export const SUBSCRIPTION_PERSISTENCE_KEY = 'coinmirror.subscription.v1';
export const SUBSCRIPTION_PERSISTENCE_VERSION = 'subscription-local-v1';

export type SubscriptionPersistenceStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

export type PersistedSubscriptionState = {
  snapshots: SubscriptionSnapshot[];
  goals: SavedSubscriptionGoal[];
};

type PersistedPayload = PersistedSubscriptionState & {
  version: typeof SUBSCRIPTION_PERSISTENCE_VERSION;
};

const EMPTY_STATE: PersistedSubscriptionState = { snapshots: [], goals: [] };

function sanitizeSnapshot(snapshot: SubscriptionSnapshot): SubscriptionSnapshot {
  return {
    id: snapshot.id,
    ownerId: snapshot.ownerId,
    createdAt: snapshot.createdAt,
    isBaseline: snapshot.isBaseline,
    sourceFormat: snapshot.sourceFormat,
    engineVersion: snapshot.engineVersion,
    periodLabel: snapshot.periodLabel,
    periodStart: snapshot.periodStart,
    periodEnd: snapshot.periodEnd,
    investmentTypeCode: snapshot.investmentTypeCode,
    investmentTypeTitle: snapshot.investmentTypeTitle,
    metrics: { ...snapshot.metrics },
    executionFingerprints: [...snapshot.executionFingerprints],
    sourceFingerprint: snapshot.sourceFingerprint,
    dedupe: { ...snapshot.dedupe },
    summary: { ...snapshot.summary },
  };
}

function sanitizeGoal(goal: SavedSubscriptionGoal): SavedSubscriptionGoal {
  return {
    id: goal.id,
    createdAt: goal.createdAt,
    status: goal.status,
    latestSnapshotId: goal.latestSnapshotId,
    latestValue: goal.latestValue,
    evaluationCopy: goal.evaluationCopy,
    metricKey: goal.metricKey,
    title: goal.title,
    description: goal.description,
    baselineSnapshotId: goal.baselineSnapshotId,
    baselineValue: goal.baselineValue,
    targetDirection: goal.targetDirection,
  };
}

function isPayload(value: unknown): value is PersistedPayload {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Partial<PersistedPayload>;
  return (
    payload.version === SUBSCRIPTION_PERSISTENCE_VERSION &&
    Array.isArray(payload.snapshots) &&
    Array.isArray(payload.goals)
  );
}

export function persistSubscriptionState(
  storage: SubscriptionPersistenceStorage | null | undefined,
  state: PersistedSubscriptionState
) {
  if (!storage) return;
  const payload: PersistedPayload = {
    version: SUBSCRIPTION_PERSISTENCE_VERSION,
    snapshots: state.snapshots.map(sanitizeSnapshot),
    goals: state.goals.map(sanitizeGoal),
  };
  storage.setItem(SUBSCRIPTION_PERSISTENCE_KEY, JSON.stringify(payload));
}

export function loadPersistedSubscriptionState(
  storage: SubscriptionPersistenceStorage | null | undefined
): PersistedSubscriptionState {
  if (!storage) return EMPTY_STATE;
  try {
    const raw = storage.getItem(SUBSCRIPTION_PERSISTENCE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as unknown;
    if (!isPayload(parsed)) return EMPTY_STATE;
    return {
      snapshots: parsed.snapshots.map(sanitizeSnapshot),
      goals: parsed.goals.map(sanitizeGoal),
    };
  } catch {
    return EMPTY_STATE;
  }
}

export function clearPersistedSubscriptionState(
  storage: SubscriptionPersistenceStorage | null | undefined
) {
  if (!storage) return;
  storage.removeItem(SUBSCRIPTION_PERSISTENCE_KEY);
}

export function getBrowserSubscriptionStorage(): SubscriptionPersistenceStorage | null {
  if (typeof globalThis === 'undefined') return null;
  const maybeWindow = globalThis as typeof globalThis & {
    localStorage?: SubscriptionPersistenceStorage;
  };
  return maybeWindow.localStorage ?? null;
}
