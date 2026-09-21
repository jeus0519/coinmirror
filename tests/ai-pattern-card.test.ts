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


function metricScenario(primaryId: string) {
  return baseMetrics.map((metric) => ({
    ...metric,
    measured: true,
    score: metric.id === primaryId ? 35 : metric.id === 'F7' ? 92 : 78,
    band: metric.id === primaryId ? '주의' : '안정',
    sampleSize: Math.max(metric.sampleSize, 12),
  }));
}

const noHoldingGapSeries = {
  ...derivedSeries,
  medianHoldingHours: { profit: 72, loss: 48 },
};

test('AI 패턴 카드는 오른 뒤 따라 산 기록을 FOMO로 풀고 내부 지표명을 숨긴다', () => {
  const card = buildAiPatternCard({
    generalMbti: 'ENFP',
    metrics: metricScenario('F3'),
    derivedSeries: noHoldingGapSeries,
    expectationComparisons: [],
  });
  const text = JSON.stringify(card);

  assert.equal(card.pattern.name, 'FOMO');
  assert.match(card.pattern.explanation, /기회를 놓칠까 봐/);
  assert.match(card.headline.title, /오른 뒤 따라 산 기록|따라 산/);
  assert.match(card.experiment.action, /놓친 기회|따라/);
  assert.doesNotMatch(text, /직전 거래가 대비 높은 매수|핵심 지표|AI 문장 생성이 잠시 어려워/);
  assert.doesNotMatch(text, /매수하세요|매도하세요|사세요|파세요|목표가|가격 예측|수익 보장/);
});

test('AI 패턴 카드는 손실 뒤 재진입을 만회 심리로 풀고 다음 달 실험을 하나만 제안한다', () => {
  const card = buildAiPatternCard({
    generalMbti: 'ISTJ',
    metrics: metricScenario('F5'),
    derivedSeries: noHoldingGapSeries,
    expectationComparisons: [],
  });
  const text = JSON.stringify(card);

  assert.equal(card.pattern.name, '만회 심리');
  assert.match(card.pattern.explanation, /손실 뒤|불편함/);
  assert.match(card.headline.title, /손실 뒤 바로 다시 들어간 기록|재진입/);
  assert.match(card.experiment.action, /만회하고 싶은가/);
  assert.equal((text.match(/다음 달 실험 1개/g) ?? []).length, 1);
  assert.doesNotMatch(text, /매수하세요|매도하세요|사세요|파세요|목표가|가격 예측|수익 보장/);
});

test('AI 패턴 카드는 한쪽으로 쏠린 기록을 확증편향으로 풀고 종목명과 금액을 노출하지 않는다', () => {
  const card = buildAiPatternCard({
    generalMbti: 'ENTJ',
    metrics: metricScenario('F8'),
    derivedSeries: noHoldingGapSeries,
    expectationComparisons: [],
  });
  const text = JSON.stringify(card);

  assert.equal(card.pattern.name, '확증편향');
  assert.match(card.pattern.explanation, /확신|맞다고 보는 정보/);
  assert.match(card.headline.title, /한쪽으로 쏠린 매수 기록|쏠린/);
  assert.match(card.experiment.action, /근거|반대 근거|한도/);
  assert.doesNotMatch(text, /REDACTED|ASSET\d+|BTC|ETH|XRP|SOL|ARB|1,000,000|600,000/);
  assert.doesNotMatch(text, /매수하세요|매도하세요|사세요|파세요|목표가|가격 예측|수익 보장/);
});

test('AI 패턴 카드는 MBTI가 없으면 비유를 숨기고 unknown 같은 개발자 표현을 노출하지 않는다', () => {
  const card = buildAiPatternCard({
    generalMbti: 'unknown',
    metrics: metricScenario('F5'),
    derivedSeries: noHoldingGapSeries,
    expectationComparisons: [],
  });
  const text = JSON.stringify(card);

  assert.equal(card.mbtiAnalogy, undefined);
  assert.equal(card.selfGap, undefined);
  assert.doesNotMatch(text, /unknown|no_input|MVP|핵심 지표|AI 문장 생성이 잠시 어려워/);
});
