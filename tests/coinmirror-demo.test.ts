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
  assert.match(
    document.querySelector('#expected-type-card')?.textContent ?? '',
    /예상 투자거울 타입/
  );
  assert.match(
    document.querySelector('#expected-type-card')?.textContent ?? '',
    /거래내역 없이 만든 예상/
  );

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

test('HTML 데모는 코인미러 한글명, 짧은 친근한 문구, PDF/CSV 선택형 업로드를 보여준다', async () => {
  const { dom, errors } = await loadDemo();
  const document = dom.window.document;
  const bodyText = document.body.textContent ?? '';
  const cssText = document.querySelector('style')?.textContent ?? '';

  assert.equal(document.title, '코인미러 — 내 거래 습관 거울');
  assert.match(document.querySelector('.logo b')?.textContent ?? '', /코인미러/);
  assert.doesNotMatch(document.querySelector('.logo b')?.textContent ?? '', /coinmirror/i);
  assert.match(bodyText, /내 거래 습관,\s*짧게 확인해요/);
  assert.match(bodyText, /PDF 거래내역 올리기/);
  assert.match(bodyText, /CSV 거래내역 올리기/);
  assert.match(bodyText, /업비트 원본 PDF를 추천해요/);
  assert.match(bodyText, /비밀번호가 있어도 괜찮아요/);
  assert.match(bodyText, /글자가 이미지가 되어 숫자를 읽지 못할 수 있어요/);
  assert.doesNotMatch(bodyText, /비밀번호 없이 올리는 방법/);
  assert.doesNotMatch(bodyText, /내 CSV 업로드/);
  assert.doesNotMatch(bodyText, /CSV 하나로/);
  assert.match(cssText, /--brand-500:\s*#9fe870/);
  assert.match(cssText, /--ink:\s*#0e0f0c/);
  assert.match(cssText, /border-radius:\s*30px/);
  assert.deepEqual(errors, []);

  dom.window.close();
});
