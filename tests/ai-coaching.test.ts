import assert from 'node:assert/strict';
import test from 'node:test';

import { buildAiBehaviorCoaching, buildAiBehaviorCoachingSafePayload } from '../src/lib/ai-coaching.ts';
import { baseMetrics } from '../src/lib/mock-metrics.ts';

test('AI 행동코칭은 MBTI 자기인식과 핵심 지표를 바탕으로 회고용 행동 콘텐츠를 만든다', () => {
  const coaching = buildAiBehaviorCoaching({
    generalMbti: 'INTJ',
    metrics: baseMetrics,
    comparisonCopy: '평소 MBTI(INTJ)는 점수 계산에 사용되지 않아요.',
  });

  assert.equal(coaching.title, 'AI 행동코칭');
  assert.match(coaching.intro, /MBTI/);
  assert.match(coaching.intro, /핵심 지표/);
  assert.ok(coaching.keySignals.length >= 2);
  assert.ok(coaching.reduceActions.length >= 1);
  assert.ok(coaching.reinforceActions.length >= 1);
  assert.match(coaching.nextQuestion, /다음 달/);
});

test('AI 행동코칭은 투자 조언·가격 예측·매수매도 지시 문구를 만들지 않는다', () => {
  const coaching = buildAiBehaviorCoaching({
    generalMbti: 'ENFP',
    metrics: baseMetrics,
    comparisonCopy: '자기인식과 실제 행동을 나란히 볼 수 있습니다.',
  });
  const text = JSON.stringify(coaching);

  assert.doesNotMatch(text, /매수하|매도하|사세요|파세요|목표가|가격 예측|수익 보장|포트폴리오 비중/);
  assert.match(coaching.safetyCopy, /매수·매도 추천이 아니라/);
  assert.match(coaching.safetyCopy, /원본 거래내역과 PDF 비밀번호는 AI로 보내지 않아요/);
});




test('AI 행동코칭은 초보자가 이해할 수 있도록 심리학 표현과 쉬운 해설을 포함한다', () => {
  const coaching = buildAiBehaviorCoaching({
    generalMbti: 'ENFP',
    metrics: baseMetrics,
    comparisonCopy: '자기인식과 실제 행동을 나란히 볼 수 있습니다.',
  });
  const text = JSON.stringify(coaching);

  assert.match(text, /초보자|처음 보는 사람|쉽게 말하면|쉽게 풀어보면/);
  assert.match(text, /손실회피|확증편향|즉시 보상|감정 조절|인지/);
  assert.match(coaching.intro, /심리/);
  assert.ok(coaching.reduceActions[0].length >= 80);
  assert.ok(coaching.reinforceActions[0].length >= 60);
});


test('AI 행동코칭은 사주풀이처럼 아하 싶은 심리 해설을 주되 투자 조언은 피한다', () => {
  const coaching = buildAiBehaviorCoaching({
    generalMbti: 'ENFP',
    metrics: baseMetrics,
    comparisonCopy: '자기인식과 실제 행동을 나란히 볼 수 있습니다.',
  });
  const text = JSON.stringify(coaching);

  assert.match(text, /이번 기록에서 보이는 핵심|아하|나도 모르게|마음속|불안을 관리/);
  assert.match(text, /비난|게으르다는 뜻|판단이 늦다|희망 쪽에 무게/);
  assert.match(text, /다음 달 실험|한 줄 메모|확인 질문/);
  assert.doesNotMatch(text, /매수하세요|매도하세요|사세요|파세요|목표가|가격 예측|수익 보장/);
});

test('AI 행동코칭은 가장 낮은 핵심 지표를 기준으로 코칭 유형을 판정한다', () => {
  const coaching = buildAiBehaviorCoaching({
    generalMbti: 'INTJ',
    metrics: baseMetrics,
    comparisonCopy: '자기인식과 실제 기록을 비교합니다.',
  });

  assert.equal(coaching.coachingType, 'reentry_after_loss');
});

test('Phase 2.5 실제 AI 호출용 payload는 비식별 요약만 포함한다', () => {
  const payload = buildAiBehaviorCoachingSafePayload({
    generalMbti: 'ENFP',
    metrics: baseMetrics,
    comparisonCopy: '자기인식과 실제 기록을 비교합니다.',
  });
  const text = JSON.stringify(payload);

  assert.equal(payload.schemaVersion, 'coinmirror.aiReflection.v1');
  assert.equal(payload.coachingType, 'reentry_after_loss');
  assert.equal(payload.generalMbti, 'ENFP');
  assert.deepEqual(payload.requestedOutput, ['observedPattern', 'reduceAction', 'reinforceAction', 'nextQuestion']);
  assert.ok(payload.keySignals.length >= 2);
  assert.ok(payload.keySignals.every((signal) => /^F\d+$/.test(signal.metricId)));
  assert.ok(payload.keySignals.every((signal) => ['stable', 'observe', 'caution', 'measuring'].includes(signal.scoreBand)));
  assert.ok(payload.keySignals.every((signal) => ['80_100', '55_79', '0_54', 'measuring'].includes(signal.scoreBucket)));
  assert.ok(payload.keySignals.every((signal) => ['0', '1_9', '10_49', '50_plus'].includes(signal.sampleSizeBucket)));

  assert.doesNotMatch(text, /symbol|evidence|stats|fact|when|fileName|pdfPassword|email|orderId|amount|quantity|price|raw/i);
  assert.doesNotMatch(text, /ARB|SOL|XRP|120,633|07-15|08-09/);
});
