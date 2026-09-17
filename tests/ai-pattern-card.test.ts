import assert from 'node:assert/strict';
import test from 'node:test';

import { buildAiPatternCard } from '../src/lib/ai-pattern-card.ts';
import { buildExpectationComparisons } from '../src/lib/onboarding-diagnosis.ts';
import { baseMetrics } from '../src/lib/mock-metrics.ts';

const derivedSeries = {
  orderCount: 20,
  roundTripCount: 6,
  totalOrderAmount: 1_000_000,
  realizedPnl: -100_000,
  openPositionCount: 2,
  hourlyAmount: [0, 0, 0, 0, 0, 0, 10, 20, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  weekdayOrderCount: [1, 2, 3, 4, 5, 3, 2],
  perSymbolBuyShare: [{ symbol: 'REDACTED', buyAmount: 600_000, share: 0.6 }],
  winRate: 0.4,
  medianHoldingHours: { profit: 48, loss: 216 },
  monthlyOrderCount: 28,
};

test('AI 패턴 카드는 점수 나열 대신 숫자 훅과 하나의 깊은 패턴을 만든다', () => {
  const card = buildAiPatternCard({
    generalMbti: 'INFJ',
    metrics: baseMetrics,
    derivedSeries,
    expectationComparisons: buildExpectationComparisons(
      { B3: 'loss_first', generalMbti: 'INFJ' },
      {
        B3: {
          label: '청산 속도',
          actual: '이익 2.0일 · 손실 9.0일',
          observation: '이익·손실 청산의 중앙 보유시간을 비교했어요.',
        },
      },
    ),
  });

  assert.equal(card.title, '이번 기록에서 가장 선명했던 패턴');
  assert.match(card.headline.title, /이익은 2\.0일/);
  assert.match(card.headline.title, /손실은 9\.0일/);
  assert.equal(card.headline.profitLabel, '이익 보유 2.0일');
  assert.equal(card.headline.lossLabel, '손실 보유 9.0일');
  assert.match(card.selfGap?.summary ?? '', /4\.5배 더 오래/);
  assert.equal(card.pattern.name, '처분효과');
  assert.match(card.pattern.explanation, /희망 쪽에 무게/);
  assert.match(card.strength.evidence, /잘하고 있는 것/);
  assert.match(card.experiment.action, /지금 새로 시작해도 같은 선택을 할까/);
  assert.match(card.experiment.nextUploadPromise, /다음 업로드 때/);
});

test('AI 패턴 카드는 설문 답이 없으면 자기인식 갭을 숨기고 MBTI는 재미용 비유로만 쓴다', () => {
  const card = buildAiPatternCard({
    generalMbti: 'INTJ',
    metrics: baseMetrics,
    derivedSeries,
    expectationComparisons: [],
  });
  const text = JSON.stringify(card);

  assert.equal(card.selfGap, undefined);
  assert.match(card.mbtiAnalogy?.text ?? '', /재미로 보는 비유/);
  assert.match(card.mbtiAnalogy?.disclaimer ?? '', /재미용 비유/);
  assert.doesNotMatch(text, /INFJ와 함께 보면|핵심 지표에서 눈에 띈 점|AI 문장 생성이 잠시 어려워/);
  assert.doesNotMatch(text, /매수하세요|매도하세요|사세요|파세요|목표가|가격 예측|수익 보장/);
});
