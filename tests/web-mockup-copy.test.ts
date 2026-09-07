import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

async function read(path: string) {
  return readFile(path, 'utf8');
}

test('Expo 웹 목업은 코인미러 한글명과 짧고 친근한 시작 문구를 사용한다', async () => {
  const [app, start, globalCss] = await Promise.all([
    read('src/app/index.tsx'),
    read('src/components/steps/step-1-start.tsx'),
    read('src/global.css'),
  ]);
  const visibleCopy = `${app}\n${start}`;

  assert.match(app, />코인미러</);
  assert.doesNotMatch(app, />coinmirror</i);
  assert.match(start, /내 거래 습관/);
  assert.match(start, /짧게 확인해요/);
  assert.match(start, /PDF\/CSV 거래내역/);
  assert.match(start, /코인미러가 하지 않는 것/);
  assert.doesNotMatch(visibleCopy, /거래내역 CSV 하나/);
  assert.doesNotMatch(visibleCopy, /모두 CSV만으로/);
  assert.match(globalCss, /--primary:\s*92 73% 67%/);
  assert.match(globalCss, /--foreground:\s*72 10% 5%/);
});


test('웹 앱 레이아웃은 헤더와 스텝 메뉴를 상단에 고정 흐름으로 두고 본문을 바로 이어 보여준다', async () => {
  const [app, start, nav, globalCss] = await Promise.all([
    read('src/app/index.tsx'),
    read('src/components/steps/step-1-start.tsx'),
    read('src/components/steps/step-nav.tsx'),
    read('src/global.css'),
  ]);

  assert.match(globalCss, /html,\s*body,\s*#root/);
  assert.match(app, /className="shrink-0 border-b border-border bg-background"/);
  assert.match(app, /className="flex-1 overflow-hidden"/);
  assert.match(nav, /className="bg-background"/);
  assert.doesNotMatch(nav, /border-b border-border bg-card\/80/);
  assert.match(start, /contentContainerClassName="gap-6 px-4 pb-10 pt-6/);
  assert.doesNotMatch(start, /gap-10 p-4 pb-12/);
});


test('첫 화면 지표 카드는 방어감을 주는 부정 라벨을 직접 노출하지 않는다', async () => {
  const start = await read('src/components/steps/step-1-start.tsx');

  assert.match(start, /displayMetricName\(m\)/);
  assert.doesNotMatch(start, /\{m\.name\}/);
});
