import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildExpectedInvestmentTypeProfile,
  buildSampleInvestmentTypeProfile,
} from '../src/lib/investment-type.ts';
import { baseMetrics } from '../src/lib/mock-metrics.ts';
import { buildInvestmentTypeShareCard, serializeShareCardText } from '../src/lib/share-card.ts';

test('공유 카드는 예상 타입과 기록된 타입을 점수·금액·수익률·종목명 없이 직렬화한다', () => {
  const expected = buildInvestmentTypeShareCard(
    buildExpectedInvestmentTypeProfile({ A1: 'day', A2: ['chase'], B1: '31_100' }),
    'expected'
  );
  const recorded = buildInvestmentTypeShareCard(
    buildSampleInvestmentTypeProfile(baseMetrics),
    'recorded'
  );

  for (const card of [expected, recorded]) {
    const text = serializeShareCardText(card);
    assert.match(text, /투자거울|타입|기록 기준|예상 타입/);
    assert.match(text, /coinmirror\.app/);
    assert.match(text, /성격검사나 투자조언이 아니라/);
    assert.doesNotMatch(text, /\d+점/);
    assert.doesNotMatch(text, /원|KRW|BTC|ETH|SOL|XRP/);
    assert.doesNotMatch(text, /수익률|손익|매수하세요|매도하세요/);
  }
});
