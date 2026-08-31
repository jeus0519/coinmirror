import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const PAGE = 'src/app/subscription.tsx';

test('구독 혜택 페이지는 1~3번 핵심 혜택을 명확히 설명한다', async () => {
  const source = await readFile(PAGE, 'utf8');

  assert.match(source, /기준선 저장/);
  assert.match(source, /월간 투자습관 리포트/);
  assert.match(source, /목표 저장/);
  assert.match(source, /다음 업로드 때 변화량 자동 비교/);
  assert.match(source, /투자 조언이 아니라/);
});

test('구독 혜택 페이지는 무료 결과로 돌아가는 선택지를 제공한다', async () => {
  const source = await readFile(PAGE, 'utf8');

  assert.match(source, /무료 결과 계속 보기/);
  assert.match(source, /router\.back\(\)/);
});

test('구독 혜택 페이지는 구독 신청 버튼으로 결제 준비 스텝에 연결한다', async () => {
  const source = await readFile(PAGE, 'utf8');

  assert.match(source, /구독 신청하기/);
  assert.match(source, /router\.push\('\/subscription-checkout'\)/);
});

test('구독 결제 준비 페이지는 플랜 확인과 결제 연동 예정 상태를 보여준다', async () => {
  const source = await readFile('src/app/subscription-checkout.tsx', 'utf8');

  assert.match(source, /구독 결제 준비/);
  assert.match(source, /구독관리 월간 플랜/);
  assert.match(source, /월 4,900원/);
  assert.match(source, /결제 모듈 연결 예정/);
  assert.match(source, /토스페이먼츠|PortOne|Stripe/);
  assert.match(source, /router\.back\(\)/);
});
