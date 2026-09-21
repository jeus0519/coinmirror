import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { buildInfoEventTabViewModel } from '../src/lib/info-event-tab.ts';

const STEP_4 = 'src/components/steps/step-4-info.tsx';
const MODEL = 'src/lib/info-event-tab.ts';

test('정보 이벤트 탭 view model은 시장 분위기와 업비트 KRW 거래대금 비중을 회고용으로 구성한다', () => {
  const vm = buildInfoEventTabViewModel();

  assert.equal(vm.title, '시장 배경과 거래소 이벤트');
  assert.match(vm.description, /매수·매도 추천이 아니라/);
  assert.equal(vm.marketTemperature.title, '오늘 시장 분위기');
  assert.equal(vm.marketTemperature.metrics.length, 2);
  assert.match(vm.marketTemperature.metrics[0].label, /공포·탐욕/);
  assert.match(vm.marketTemperature.metrics[1].label, /BTC 24시간 가격 변화/);
  assert.match(vm.marketTemperature.metrics[1].description, /거래량이 아니라 가격 기준/);
  assert.match(vm.upbitKrwInterest.title, /업비트 KRW 시장 관심 분포/);
  assert.equal(vm.upbitKrwInterest.assets.length, 3);
  assert.deepEqual(
    vm.upbitKrwInterest.assets.map((asset) => asset.symbol),
    ['BTC', 'ETH', 'XRP']
  );
  for (const asset of vm.upbitKrwInterest.assets) {
    assert.match(asset.volumeShareLabel, /확인 중/);
  }
  assert.ok(vm.marketTemperature.metrics.every((metric) => metric.value === '확인 중'));
  assert.doesNotMatch(JSON.stringify(vm.upbitKrwInterest), /10\.2%|9\.3%|3\.3%/);
  assert.match(vm.safetyCopy, /거래 습관을 돌아보기 위한 시장 배경/);
});

test('정보 이벤트 탭은 별도 인사이트 없이 일반 회고 질문 섹션을 노출하지 않는다', async () => {
  const vm = buildInfoEventTabViewModel();
  const source = await readFile(STEP_4, 'utf8');

  assert.deepEqual(vm.reflectionPrompts, []);
  assert.doesNotMatch(source, /내 회고와 연결하기/);
  assert.doesNotMatch(source, /FOMO 체크/);
  assert.doesNotMatch(source, /테더 체크/);
});

test('정보 이벤트 탭 view model은 업비트와 빗썸 이벤트를 각각 최신 3개로 제공한다', () => {
  const vm = buildInfoEventTabViewModel();

  assert.equal(vm.exchangeEvents.upbit.length, 3);
  assert.equal(vm.exchangeEvents.bithumb.length, 3);
  for (const item of [...vm.exchangeEvents.upbit, ...vm.exchangeEvents.bithumb]) {
    assert.ok(item.title.length > 8);
    assert.match(item.url, /^https:\/\//);
    assert.match(item.summary, /거래소에서 직접 확인/);
  }
});

test('정보 이벤트 탭 copy는 추천·참여 유도 표현과 원문 표현을 쓰지 않는다', async () => {
  const source = (await readFile(STEP_4, 'utf8')) + '\n' + (await readFile(MODEL, 'utf8'));

  assert.match(source, /시장 배경/);
  assert.match(source, /거래소 이벤트 참고/);
  assert.match(source, /코인미러는 이벤트 참여나 특정 거래를 권유하지 않아요/);
  assert.match(source, /거래소에서 직접 확인/);
  assert.doesNotMatch(source, /원문/);
  assert.doesNotMatch(source, /상단 3개/);
  assert.match(source, /최신 3개/);
  for (const banned of ['참여 추천', '놓치면 손해', '지금 참여하세요', '수익 기회', '추천 코인', '매수 기회']) {
    assert.doesNotMatch(source, new RegExp(banned));
  }
});
