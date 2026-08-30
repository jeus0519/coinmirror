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
