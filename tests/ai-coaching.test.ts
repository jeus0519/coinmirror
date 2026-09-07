import assert from 'node:assert/strict';
import test from 'node:test';

import { buildAiBehaviorCoaching } from '../src/lib/ai-coaching.ts';
import { baseMetrics } from '../src/lib/mock-metrics.ts';

test('AI 행동코칭은 MBTI 자기인식과 키 지표를 바탕으로 회고용 행동 콘텐츠를 만든다', () => {
  const coaching = buildAiBehaviorCoaching({
    generalMbti: 'INTJ',
    metrics: baseMetrics,
    comparisonCopy: '평소 MBTI(INTJ)는 점수 계산에 사용되지 않아요.',
  });

  assert.equal(coaching.title, 'AI 행동코칭');
  assert.match(coaching.intro, /MBTI/);
  assert.match(coaching.intro, /키 지표/);
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
