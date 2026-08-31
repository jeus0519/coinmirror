import assert from 'node:assert/strict';
import test from 'node:test';

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
