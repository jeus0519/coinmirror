import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildExpectationComparisons,
  diagnosisQuestions,
  selectDiagnosisOption,
  summarizeDiagnosis,
  type DiagnosisProfile,
} from '../src/lib/onboarding-diagnosis.ts';
import { baseMetrics, lockedMetrics, scoreLevel } from '../src/lib/mock-metrics.ts';
import { principlePresets } from '../src/lib/mock-goals.ts';
import {
  GENERAL_MBTI_OPTIONS,
  buildMbtiComparisonCopy,
  buildSampleInvestmentTypeProfile,
} from '../src/lib/investment-type.ts';

test('v5 온보딩은 해석 기준 4문항과 자기 예상 4문항으로 구성된다', () => {
  assert.equal(diagnosisQuestions.length, 8);
  assert.deepEqual(
    diagnosisQuestions.map((question) => question.id),
    ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4']
  );
  assert.equal(diagnosisQuestions.filter((question) => question.block === 'context').length, 4);
  assert.equal(diagnosisQuestions.filter((question) => question.block === 'expectation').length, 4);
});

test('A2는 최대 두 개까지 선택하며 세 번째 선택은 가장 오래된 선택을 교체한다', () => {
  let profile: DiagnosisProfile = {};
  profile = selectDiagnosisOption(profile, 'A2', 'chase');
  profile = selectDiagnosisOption(profile, 'A2', 'hold_loss');
  profile = selectDiagnosisOption(profile, 'A2', 'overtrade');
  assert.deepEqual(profile.A2, ['hold_loss', 'overtrade']);
  profile = selectDiagnosisOption(profile, 'A2', 'hold_loss');
  assert.deepEqual(profile.A2, ['overtrade']);
});

test('모든 문항은 미응답 상태로 저장할 수 있다', () => {
  const profile: DiagnosisProfile = {};
  assert.deepEqual(buildExpectationComparisons(profile), []);
});

test('응답한 자기 예상 문항만 실제 샘플값과 비교한다', () => {
  const profile: DiagnosisProfile = { B1: '31_100', B2: 'night' };
  const comparisons = buildExpectationComparisons(profile);
  assert.deepEqual(
    comparisons.map((item) => item.questionId),
    ['B1', 'B2']
  );
  assert.match(comparisons[0].actual, /월평균/);
  assert.match(comparisons[1].actual, /낮|오후|저녁|밤|새벽/);
});

test('F 점수는 모두 높을수록 양호한 동일 밴드를 사용한다', () => {
  assert.equal(scoreLevel(80), 'stable');
  assert.equal(scoreLevel(79), 'observe');
  assert.equal(scoreLevel(55), 'observe');
  assert.equal(scoreLevel(54), 'caution');
  assert.equal(scoreLevel(null), 'measuring');
  assert.deepEqual(
    baseMetrics.map((metric) => metric.id),
    ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10']
  );
  assert.deepEqual(
    lockedMetrics.map((metric) => metric.id),
    ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7']
  );
  assert.equal(baseMetrics.filter((metric) => metric.measured).length, 9);
  assert.equal(baseMetrics.filter((metric) => metric.kind === 'composite').length, 1);
});

test('스타일을 건너뛰고 예상만 답해도 미응답 성향이라고 표현하지 않는다', () => {
  const summary = summarizeDiagnosis({ B1: '31_100' });
  assert.doesNotMatch(summary.headline, /미응답/);
});

test('P7 원칙은 숫자 입력 없이 프리셋으로 선택한다', () => {
  assert.ok(principlePresets.length >= 4);
  assert.ok(principlePresets.every((preset) => preset.id && preset.label && preset.check));
  assert.ok(principlePresets.every((preset) => !('defaultTarget' in preset)));
});

test('v5.1 투자 성향 타입은 F점수 기반 요약 레이어로 산출된다', () => {
  const profile = buildSampleInvestmentTypeProfile(baseMetrics, 'INTP');
  assert.equal(profile.code, 'W-H-X-?');
  assert.equal(profile.title, '분산형 안정 관찰가');
  assert.equal(profile.generalMbti, 'INTP');
  assert.deepEqual(
    profile.axes.map((axis) => axis.axis),
    ['entry', 'tempo', 'loss', 'allocation']
  );
  assert.equal(profile.axes.find((axis) => axis.axis === 'allocation')?.confidence, 'insufficient');
  assert.match(profile.comparisonCopy ?? '', /점수 계산에 사용되지 않/);
  assert.ok(profile.strengths.length >= 2);
  assert.ok(profile.watchouts.length >= 2);
  assert.ok(profile.biasSuggestions.some((item) => item.metricId === 'F5'));
  assert.deepEqual(profile.similarMbtiCodes, ['ISTJ', 'INTJ']);
  assert.match(profile.similarMbtiCopy, /재미용 비유/);
});

test('일반 MBTI는 선택 입력이며 투자 타입 계산에는 쓰지 않는다', () => {
  assert.equal(GENERAL_MBTI_OPTIONS.filter((option) => option.length === 4).length, 16);
  const withoutMbti = buildSampleInvestmentTypeProfile(baseMetrics);
  const withMbti = buildSampleInvestmentTypeProfile(baseMetrics, 'ENTJ');
  assert.equal(withoutMbti.code, withMbti.code);
  assert.match(buildMbtiComparisonCopy(undefined, withMbti.title), /입력하지 않아도/);
});
