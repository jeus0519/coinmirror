import assert from 'node:assert/strict';
import test from 'node:test';

import { analyzeCsvInput } from '../src/lib/csv/analyze-csv.ts';
import {
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
    tradeAnalysis: sampleAnalysis(120),
    subscriptionSnapshots: [],
    snapshotComparison: null,
    savedSubscriptionGoals: [],
  });

  useFlowStore.getState().saveCurrentAnalysisSnapshot();
  useFlowStore.setState({ tradeAnalysis: sampleAnalysis(80) });
  useFlowStore.getState().saveCurrentAnalysisSnapshot();

  useFlowStore.getState().saveSuggestedSubscriptionGoal();
  assert.equal(useFlowStore.getState().savedSubscriptionGoals.length, 1);
  assert.equal(useFlowStore.getState().savedSubscriptionGoals[0].status, 'active');

  useFlowStore.setState({ tradeAnalysis: sampleAnalysis(130) });
  useFlowStore.getState().saveCurrentAnalysisSnapshot();

  assert.equal(useFlowStore.getState().savedSubscriptionGoals[0].latestSnapshotId, 'local-3');
});

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => map.set(key, value),
    removeItem: (key: string) => map.delete(key),
  };
}

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
