export type OperationToken = number;

export type LatestOperationGuard = {
  beginLatest: () => OperationToken | null;
  beginIfIdle: () => OperationToken | null;
  isCurrent: (token: OperationToken | null) => boolean;
  finish: (token: OperationToken | null) => void;
  invalidate: () => void;
  destroy: () => void;
  revive: () => void;
  isAlive: () => boolean;
};

/**
 * 비동기 UI 작업의 최신 세대만 결과를 반영하게 하고,
 * 비밀번호 재제출처럼 중복 실행이 금지된 경로에는 동기 잠금을 제공한다.
 */
export function createLatestOperationGuard(): LatestOperationGuard {
  let generation = 0;
  let activeToken: OperationToken | null = null;
  let destroyed = false;

  return {
    beginLatest() {
      if (destroyed) return null;
      generation += 1;
      activeToken = generation;
      return generation;
    },
    beginIfIdle() {
      if (destroyed || activeToken !== null) return null;
      generation += 1;
      activeToken = generation;
      return generation;
    },
    isCurrent(token) {
      return token !== null && !destroyed && activeToken === token;
    },
    finish(token) {
      if (activeToken === token) activeToken = null;
    },
    invalidate() {
      generation += 1;
      activeToken = null;
    },
    destroy() {
      destroyed = true;
      generation += 1;
      activeToken = null;
    },
    revive() {
      destroyed = false;
      generation += 1;
      activeToken = null;
    },
    isAlive() {
      return !destroyed;
    },
  };
}
