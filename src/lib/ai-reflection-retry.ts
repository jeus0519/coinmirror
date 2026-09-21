export const AI_REFLECTION_MAX_RETRIES = 3;
export const AI_REFLECTION_RETRY_COOLDOWN_MS = 30_000;

const MAX_FAILED_ATTEMPTS = AI_REFLECTION_MAX_RETRIES + 1;

export type AiReflectionRetryEntry = {
  failedAttempts: number;
  cooldownUntil: number | null;
  succeeded: boolean;
};

export type AiReflectionRetryState = Record<string, AiReflectionRetryEntry>;

export type AiReflectionRetryStatus = {
  kind: 'ready' | 'cooldown' | 'succeeded' | 'exhausted' | 'missing_fingerprint';
  canRequest: boolean;
  cooldownSeconds: number;
  remainingRetries: number;
};

export function createAiReflectionRetryState(): AiReflectionRetryState {
  return {};
}

function createAiReflectionRetryEntry(): AiReflectionRetryEntry {
  return {
    failedAttempts: 0,
    cooldownUntil: null,
    succeeded: false,
  };
}

function stateForFingerprint(
  state: AiReflectionRetryState,
  fingerprint: string
): AiReflectionRetryEntry {
  return state[fingerprint] ?? createAiReflectionRetryEntry();
}

function remainingRetries(failedAttempts: number) {
  if (failedAttempts === 0) return AI_REFLECTION_MAX_RETRIES;
  return Math.max(0, AI_REFLECTION_MAX_RETRIES - (failedAttempts - 1));
}

export function getAiReflectionRetryStatus(
  state: AiReflectionRetryState,
  fingerprint: string | null,
  now: number
): AiReflectionRetryStatus {
  if (!fingerprint) {
    return {
      kind: 'missing_fingerprint',
      canRequest: false,
      cooldownSeconds: 0,
      remainingRetries: 0,
    };
  }

  const current = stateForFingerprint(state, fingerprint);
  const retries = remainingRetries(current.failedAttempts);

  if (current.succeeded) {
    return {
      kind: 'succeeded',
      canRequest: false,
      cooldownSeconds: 0,
      remainingRetries: 0,
    };
  }

  if (current.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    return {
      kind: 'exhausted',
      canRequest: false,
      cooldownSeconds: 0,
      remainingRetries: 0,
    };
  }

  if (current.cooldownUntil !== null && current.cooldownUntil > now) {
    return {
      kind: 'cooldown',
      canRequest: false,
      cooldownSeconds: Math.ceil((current.cooldownUntil - now) / 1_000),
      remainingRetries: retries,
    };
  }

  return {
    kind: 'ready',
    canRequest: true,
    cooldownSeconds: 0,
    remainingRetries: retries,
  };
}

export function markAiReflectionFailure(
  state: AiReflectionRetryState,
  fingerprint: string,
  now: number
): AiReflectionRetryState {
  const current = stateForFingerprint(state, fingerprint);
  const failedAttempts = Math.min(MAX_FAILED_ATTEMPTS, current.failedAttempts + 1);
  const hasRetry = remainingRetries(failedAttempts) > 0;

  return {
    ...state,
    [fingerprint]: {
      failedAttempts,
      cooldownUntil: hasRetry ? now + AI_REFLECTION_RETRY_COOLDOWN_MS : null,
      succeeded: false,
    },
  };
}

export function markAiReflectionSuccess(
  state: AiReflectionRetryState,
  fingerprint: string
): AiReflectionRetryState {
  const current = stateForFingerprint(state, fingerprint);
  return {
    ...state,
    [fingerprint]: {
      ...current,
      cooldownUntil: null,
      succeeded: true,
    },
  };
}

export function isAiReflectionRequestCurrent(
  requestFingerprint: string,
  currentFingerprint: string | null
): boolean {
  return requestFingerprint === currentFingerprint;
}

export function buildAiReflectionFingerprint(
  analysisFingerprint: string | null,
  source: string
): string | null {
  if (analysisFingerprint) return analysisFingerprint;
  if (source === 'sample') return 'sample-analysis';
  return null;
}
