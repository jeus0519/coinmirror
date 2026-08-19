import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { JSDOM, VirtualConsole } from 'jsdom';

async function loadDemo() {
  const html = await readFile(resolve('docs/coinmirror_demo.html'), 'utf8');
  const errors: Error[] = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', (error) => {
    if (!String(error.message).includes('window.scrollTo')) errors.push(error);
  });
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    url: 'https://coinmirror.local/',
    pretendToBeVisual: true,
    virtualConsole,
    beforeParse(window) {
      window.scrollTo = () => undefined;
      window.URL.createObjectURL = () => 'blob:coinmirror-test';
      window.URL.revokeObjectURL = () => undefined;
    },
  });
  await new Promise((resolveLoad) => setTimeout(resolveLoad, 30));
  return { dom, errors };
}

test('HTML 데모는 8문항에서 분석과 P7 원칙까지 클릭으로 진행된다', async () => {
  const { dom, errors } = await loadDemo();
  const document = dom.window.document;

  assert.equal(document.querySelectorAll('#diagnosis-form .card').length, 8);
  (document.querySelector('#btn-start-diagnosis') as HTMLElement).click();
  assert.ok(document.querySelector('#panel-2')?.classList.contains('active'));

  const a2Buttons = [...document.querySelectorAll('[data-q="A2"]')] as HTMLElement[];
  a2Buttons[0].click();
  a2Buttons[1].click();
  a2Buttons[2].click();
  assert.equal(document.querySelectorAll('[data-q="A2"].btn-primary').length, 2);
  (document.querySelector('[data-mbti="INTP"]') as HTMLElement).click();
  assert.equal(document.querySelectorAll('[data-mbti].btn-primary').length, 1);

  (document.querySelector('[data-q="B1"]') as HTMLElement).click();
  (document.querySelector('#btn-save-diagnosis') as HTMLElement).click();
  assert.ok(document.querySelector('#panel-3')?.classList.contains('active'));

  (document.querySelector('#btn-sample') as HTMLElement).click();
  await new Promise((resolveClick) => setTimeout(resolveClick, 20));
  assert.ok(document.querySelector('#panel-4')?.classList.contains('active'));
  assert.equal(document.querySelectorAll('#metric-grid .metric').length, 10);
  assert.equal(document.querySelectorAll('#expectation-grid .card').length, 1);
  assert.match(document.querySelector('#investment-type-card')?.textContent ?? '', /투자거울 타입/);
  assert.match(document.querySelector('#investment-type-card')?.textContent ?? '', /INTP/);
  assert.match(
    document.querySelector('#investment-type-card')?.textContent ?? '',
    /점수 계산에 사용되지/
  );
  assert.match(document.querySelector('#investment-type-card')?.textContent ?? '', /장점/);
  assert.match(document.querySelector('#investment-type-card')?.textContent ?? '', /주의할 점/);
  assert.match(
    document.querySelector('#investment-type-card')?.textContent ?? '',
    /개선하면 좋은 편향/
  );
  assert.match(
    document.querySelector('#investment-type-card')?.textContent ?? '',
    /유사 MBTI 비유/
  );
  assert.match(document.querySelector('#investment-type-card')?.textContent ?? '', /ISTJ|INTJ/);
  assert.match(
    document.querySelector('#metric-grid')?.textContent ?? '',
    /F10\. 투자 체력 종합점수/
  );

  (document.querySelector('.step-btn[data-step="5"]') as HTMLElement).click();
  assert.equal(document.querySelectorAll('#principle-grid [data-principle]').length, 5);
  (document.querySelector('[data-principle="no-dawn-trade"]') as HTMLElement).click();
  (document.querySelector('#btn-principle-save') as HTMLElement).click();
  assert.equal(dom.window.localStorage.getItem('coinmirror.principle'), 'no-dawn-trade');
  assert.deepEqual(errors, []);

  dom.window.close();
});
