import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';

import { analyzeCsvInput } from '../src/lib/csv/analyze-csv.ts';
import {
  getBrowserSubscriptionStorage,
  loadPersistedSubscriptionState,
  SUBSCRIPTION_PERSISTENCE_KEY,
} from '../src/lib/subscription/persistence.ts';
import { useFlowStore } from '../src/stores/use-flow-store.ts';

test('시작 화면의 자료부터 올리기는 진단 전에도 거래내역 단계로 이동한다', () => {
  useFlowStore.setState({
    currentStep: 1,
    hasDiagnosis: false,
    hasAnalyzed: false,
    dataSource: null,
    diagnosisAnswers: {},
    tradeAnalysis: null,
  });

  useFlowStore.getState().setStep(3);

  assert.equal(useFlowStore.getState().currentStep, 3);
});

beforeEach(() => {
  useFlowStore.setState({
    currentStep: 1,
    hasDiagnosis: false,
    hasAnalyzed: false,
    dataSource: null,
    subscriptionTier: 'free',
    subscriptionSnapshots: [],
    snapshotComparison: null,
    demoSnapshotComparison: null,
    suggestedSubscriptionGoal: null,
    savedSubscriptionGoals: [],
    diagnosisAnswers: {},
    tradeAnalysis: null,
  });
});

function sampleAnalysis(price: number) {
  return analyzeCsvInput(
    [
      '마켓,구분,체결시간,체결가,수량,수수료',
      'KRW-BTC,매수,2026-01-01 09:00:00,100,1,0',
      `KRW-BTC,매도,2026-01-02 09:00:00,${price},1,0`,
    ].join('\n'),
    {}
  );
}


function concentrationAnalysis() {
  return analyzeCsvInput(
    [
      '마켓,구분,체결시간,체결가,수량,수수료',
      'KRW-BTC,매수,2026-01-01 09:00:00,100,1,0',
      'KRW-BTC,매수,2026-01-01 10:00:00,100,1,0',
      'KRW-BTC,매수,2026-01-01 11:00:00,100,1,0',
      'KRW-BTC,매수,2026-01-01 12:00:00,100,1,0',
      'KRW-BTC,매수,2026-01-01 13:00:00,100,1,0',
      'KRW-BTC,매수,2026-01-01 14:00:00,100,1,0',
      'KRW-BTC,매수,2026-01-01 15:00:00,100,1,0',
      'KRW-BTC,매수,2026-01-01 16:00:00,100,1,0',
      'KRW-ETH,매수,2026-01-01 17:00:00,100,1,0',
      'KRW-XRP,매수,2026-01-01 18:00:00,100,1,0',
    ].join('\n'),
    { A4: '50' }
  );
}


function overlappingAnalysis() {
  return analyzeCsvInput(
    [
      '마켓,구분,체결시간,체결가,수량,수수료',
      'KRW-BTC,매수,2026-01-01 09:00:00,100,1,0',
      'KRW-BTC,매도,2026-01-02 09:00:00,120,1,0',
      'KRW-ETH,매수,2026-02-01 09:00:00,100,1,0',
      'KRW-ETH,매도,2026-02-02 09:00:00,80,1,0',
    ].join('\n'),
    {}
  );
}


test('브라우저 저장소 접근이 차단되어도 앱 부팅 저장소 조회는 null로 방어한다', () => {
  const originalLocalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      throw new Error('SecurityError');
    },
  });

  assert.equal(getBrowserSubscriptionStorage(), null);

  if (originalLocalStorage) {
    Object.defineProperty(globalThis, 'localStorage', originalLocalStorage);
  } else {
    delete (globalThis as { localStorage?: unknown }).localStorage;
  }
});

test('구독 기준선 저장은 분석 요약 스냅샷만 저장하고 다음 분석과 비교한다', () => {
  useFlowStore.setState({
    currentStep: 4,
    hasDiagnosis: false,
    hasAnalyzed: true,
    dataSource: 'csv',
    diagnosisAnswers: {},
    tradeAnalysis: sampleAnalysis(120),
    subscriptionSnapshots: [],
    snapshotComparison: null,
  });

  useFlowStore.getState().saveCurrentAnalysisSnapshot();
  assert.equal(useFlowStore.getState().subscriptionSnapshots.length, 1);
  assert.equal(useFlowStore.getState().subscriptionSnapshots[0].isBaseline, true);

  useFlowStore.setState({ tradeAnalysis: sampleAnalysis(80) });
  useFlowStore.getState().saveCurrentAnalysisSnapshot();

  const state = useFlowStore.getState();
  assert.equal(state.subscriptionSnapshots.length, 2);
  assert.equal(state.snapshotComparison?.status, 'compared');
  assert.equal(state.snapshotComparison?.previousId, state.subscriptionSnapshots[0].id);
});

test('구독 목표 후보를 저장하고 다음 분석 비교로 달성 여부를 갱신한다', () => {
  useFlowStore.setState({
    currentStep: 4,
    hasDiagnosis: false,
    hasAnalyzed: true,
    dataSource: 'csv',
    diagnosisAnswers: {},
    tradeAnalysis: periodAnalysis('01', 120),
    subscriptionSnapshots: [],
    snapshotComparison: null,
    suggestedSubscriptionGoal: null,
    savedSubscriptionGoals: [],
  });

  useFlowStore.getState().saveCurrentAnalysisSnapshot();
  useFlowStore.setState({ tradeAnalysis: periodAnalysis('02', 80) });
  useFlowStore.getState().saveCurrentAnalysisSnapshot();

  useFlowStore.getState().saveSuggestedSubscriptionGoal();
  assert.equal(useFlowStore.getState().savedSubscriptionGoals.length, 1);
  assert.equal(useFlowStore.getState().savedSubscriptionGoals[0].status, 'active');

  useFlowStore.setState({ tradeAnalysis: periodAnalysis('03', 130) });
  useFlowStore.getState().saveCurrentAnalysisSnapshot();

  assert.equal(useFlowStore.getState().savedSubscriptionGoals[0].latestSnapshotId, 'local-3');
});


function periodAnalysis(month: string, price: number) {
  return analyzeCsvInput(
    [
      '마켓,구분,체결시간,체결가,수량,수수료',
      `KRW-BTC,매수,2026-${month}-01 09:00:00,100,1,0`,
      `KRW-BTC,매도,2026-${month}-02 09:00:00,${price},1,0`,
    ].join('\n'),
    {}
  );
}

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => map.set(key, value),
    removeItem: (key: string) => map.delete(key),
  };
}


test('저장된 스냅샷을 복원하면 재방문자가 분석 이력 화면에 바로 진입할 수 있다', () => {
  const storage = memoryStorage();
  useFlowStore.setState({
    currentStep: 1,
    hasDiagnosis: false,
    hasAnalyzed: true,
    dataSource: 'csv',
    diagnosisAnswers: {},
    tradeAnalysis: sampleAnalysis(120),
    subscriptionSnapshots: [],
    snapshotComparison: null,
    suggestedSubscriptionGoal: null,
    savedSubscriptionGoals: [],
  });
  useFlowStore.getState().saveCurrentAnalysisSnapshot(storage);

  useFlowStore.setState({
    currentStep: 1,
    hasAnalyzed: false,
    dataSource: null,
    tradeAnalysis: null,
    subscriptionSnapshots: [],
  });
  useFlowStore.getState().restoreSubscriptionState(storage);

  assert.equal(useFlowStore.getState().currentStep, 4);
  assert.equal(useFlowStore.getState().hasAnalyzed, true);
  assert.equal(useFlowStore.getState().subscriptionSnapshots.length, 1);
});

test('설문 기준을 변경하면 보존된 parse 결과로 현재 거래 분석을 새 기준에 맞게 재계산한다', () => {
  useFlowStore.setState({
    currentStep: 4,
    hasDiagnosis: true,
    hasAnalyzed: true,
    dataSource: 'csv',
    diagnosisAnswers: { A4: '50' },
    tradeAnalysis: concentrationAnalysis(),
    subscriptionSnapshots: [],
    snapshotComparison: null,
  });
  const before = useFlowStore.getState().tradeAnalysis?.metrics.find((metric) => metric.id === 'F8')?.score;

  useFlowStore.getState().saveDiagnosis({ A4: '10' });

  const state = useFlowStore.getState();
  const after = state.tradeAnalysis?.metrics.find((metric) => metric.id === 'F8')?.score;
  assert.notEqual(after, before);
  assert.equal(state.currentStep, 4);
  assert.equal(state.hasAnalyzed, true);
});

test('구독 스냅샷과 목표는 명시적 로컬 저장소에 저장·복원·삭제된다', () => {
  const storage = memoryStorage();
  useFlowStore.setState({
    currentStep: 4,
    hasDiagnosis: false,
    hasAnalyzed: true,
    dataSource: 'csv',
    diagnosisAnswers: {},
    tradeAnalysis: sampleAnalysis(120),
    subscriptionSnapshots: [],
    snapshotComparison: null,
    suggestedSubscriptionGoal: null,
    savedSubscriptionGoals: [],
  });

  useFlowStore.getState().saveCurrentAnalysisSnapshot(storage);
  assert.ok(storage.getItem(SUBSCRIPTION_PERSISTENCE_KEY));

  useFlowStore.setState({ subscriptionSnapshots: [], savedSubscriptionGoals: [] });
  useFlowStore.getState().restoreSubscriptionState(storage);
  assert.equal(useFlowStore.getState().subscriptionSnapshots.length, 1);

  useFlowStore.getState().clearSubscriptionSnapshots(storage);
  assert.deepEqual(loadPersistedSubscriptionState(storage), { snapshots: [], goals: [] });
});

test('다음 업로드에 이전 체결이 섞이면 store는 중복 체결을 제외한 스냅샷을 저장한다', () => {
  useFlowStore.setState({
    currentStep: 4,
    hasDiagnosis: false,
    hasAnalyzed: true,
    dataSource: 'csv',
    diagnosisAnswers: {},
    tradeAnalysis: sampleAnalysis(120),
    subscriptionSnapshots: [],
    snapshotComparison: null,
    suggestedSubscriptionGoal: null,
    savedSubscriptionGoals: [],
  });

  useFlowStore.getState().saveCurrentAnalysisSnapshot(null);
  useFlowStore.setState({ tradeAnalysis: overlappingAnalysis() });
  useFlowStore.getState().saveCurrentAnalysisSnapshot(null);

  const second = useFlowStore.getState().subscriptionSnapshots[1];
  assert.equal(second.dedupe.totalExecutionCount, 4);
  assert.equal(second.dedupe.duplicateExecutionCount, 2);
  assert.equal(second.dedupe.uniqueExecutionCount, 2);
  assert.match(
    useFlowStore.getState().snapshotComparison?.dedupe.copy ?? '',
    /중복 체결 2건을 제외/
  );
});

test('중복 업로드 데모는 1회차 기준선과 2회차 중복+교차청산 비교 상태를 한 번에 만든다', () => {
  useFlowStore.setState({
    currentStep: 3,
    hasDiagnosis: false,
    hasAnalyzed: false,
    dataSource: null,
    diagnosisAnswers: {},
    tradeAnalysis: null,
    subscriptionSnapshots: [],
    snapshotComparison: null,
    suggestedSubscriptionGoal: null,
    savedSubscriptionGoals: [],
  });

  useFlowStore.getState().runDuplicateUploadDemo(null);

  const state = useFlowStore.getState();
  assert.equal(state.currentStep, 4);
  assert.equal(state.hasAnalyzed, true);
  assert.equal(state.dataSource, 'sample');
  assert.equal(state.subscriptionSnapshots.length, 0);
  assert.equal(state.demoSnapshotComparison?.dedupe.duplicateExecutionCount, 1);
  assert.equal(state.demoSnapshotComparison?.dedupe.contextExecutionCount, 1);
  assert.match(state.demoSnapshotComparison?.dedupe.copy ?? '', /원가 연결용/);
});


test('중복 업로드 데모는 실제 저장 스냅샷을 덮어쓰거나 localStorage에 쓰지 않는다', () => {
  const storage = memoryStorage();
  useFlowStore.setState({
    currentStep: 4,
    hasDiagnosis: false,
    hasAnalyzed: true,
    dataSource: 'csv',
    diagnosisAnswers: {},
    tradeAnalysis: sampleAnalysis(120),
    subscriptionSnapshots: [],
    snapshotComparison: null,
    suggestedSubscriptionGoal: null,
    savedSubscriptionGoals: [],
  });
  useFlowStore.getState().saveCurrentAnalysisSnapshot(storage);
  const persistedBefore = storage.getItem(SUBSCRIPTION_PERSISTENCE_KEY);
  const realSnapshotsBefore = useFlowStore.getState().subscriptionSnapshots;

  useFlowStore.getState().runDuplicateUploadDemo(storage);

  const state = useFlowStore.getState();
  assert.equal(storage.getItem(SUBSCRIPTION_PERSISTENCE_KEY), persistedBefore);
  assert.deepEqual(state.subscriptionSnapshots, realSnapshotsBefore);
  assert.equal(state.demoSnapshotComparison?.previousId, 'demo-baseline');
  assert.equal(state.demoSnapshotComparison?.currentId, 'demo-second-upload');
});


test('중복 업로드 데모 상태에서는 현재 결과 저장을 막아 실제 기준선을 보존한다', () => {
  const storage = memoryStorage();
  useFlowStore.setState({
    currentStep: 4,
    hasDiagnosis: false,
    hasAnalyzed: true,
    dataSource: 'csv',
    diagnosisAnswers: {},
    tradeAnalysis: sampleAnalysis(120),
    subscriptionSnapshots: [],
    snapshotComparison: null,
    suggestedSubscriptionGoal: null,
    savedSubscriptionGoals: [],
  });
  useFlowStore.getState().saveCurrentAnalysisSnapshot(storage);
  const realSnapshotsBefore = useFlowStore.getState().subscriptionSnapshots;

  useFlowStore.getState().runDuplicateUploadDemo(storage);
  useFlowStore.getState().saveCurrentAnalysisSnapshot(storage);

  const state = useFlowStore.getState();
  assert.deepEqual(state.subscriptionSnapshots, realSnapshotsBefore);
  assert.equal(state.demoSnapshotComparison?.previousId, 'demo-baseline');
});

test('저장소 쓰기 실패는 스냅샷 저장 UI 흐름을 예외로 깨뜨리지 않고 성공 상태도 표시하지 않는다', () => {
  const brokenStorage = {
    getItem: () => null,
    setItem: () => {
      throw new Error('quota exceeded');
    },
    removeItem: () => undefined,
  };
  useFlowStore.setState({
    currentStep: 4,
    hasDiagnosis: false,
    hasAnalyzed: true,
    dataSource: 'csv',
    diagnosisAnswers: {},
    tradeAnalysis: sampleAnalysis(120),
    subscriptionSnapshots: [],
    snapshotComparison: null,
    suggestedSubscriptionGoal: null,
    savedSubscriptionGoals: [],
  });

  assert.doesNotThrow(() => useFlowStore.getState().saveCurrentAnalysisSnapshot(brokenStorage));
  assert.equal(useFlowStore.getState().subscriptionSnapshots.length, 0);
  assert.equal(useFlowStore.getState().snapshotComparison, null);
});


test('앱 부팅 복원은 쿼리 변경으로 반복 실행되어 데모 비교를 지우지 않는다', async () => {
  const source = await import('node:fs/promises').then((fs) => fs.readFile('src/app/index.tsx', 'utf8'));
  assert.match(source, /hasBootstrappedRef/);
  assert.match(source, /if \(params\.demo === 'duplicate-upload'\)[\s\S]*runDuplicateUploadDemo\(\)[\s\S]*router\.replace\('\/'\)[\s\S]*return/);
  assert.match(source, /restoreSubscriptionState\(\)/);
});
