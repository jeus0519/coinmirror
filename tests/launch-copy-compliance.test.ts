import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const repoRoot = process.cwd();

const customerFacingFiles = [
  'src/app/index.tsx',
  'src/app/subscription.tsx',
  'src/app/subscription-checkout.tsx',
  'src/components/steps/step-1-start.tsx',
  'src/components/steps/step-2-diagnosis.tsx',
  'src/components/steps/step-2-analysis.tsx',
  'src/components/steps/step-3-data-import.tsx',
  'src/components/steps/step-3-goals.tsx',
  'src/components/steps/step-4-info.tsx',
];

const forbiddenCopyPatterns = [
  /수익률을\s*높/,
  /수익을\s*보장/,
  /원금(?:을)?\s*보장/,
  /매수(?:하|해)세요/,
  /매도(?:하|해)세요/,
  /추천\s*종목/,
  /가격\s*예측/,
  /상위\s*투자자/,
  /투자\s*실력\s*점수/,
  /포트폴리오\s*비중(?:을)?\s*(?:제안|추천)/,
];

function readProjectFile(relativePath: string) {
  return readFileSync(join(repoRoot, relativePath), 'utf8');
}

test('고객 노출 화면에는 투자 조언이나 수익 보장으로 오해될 수 있는 문구가 없다', () => {
  const violations = customerFacingFiles.flatMap((relativePath) => {
    const source = readProjectFile(relativePath);

    return forbiddenCopyPatterns
      .filter((pattern) => pattern.test(source))
      .map((pattern) => `${relativePath}: ${pattern}`);
  });

  assert.deepEqual(violations, []);
});

test('무료 공개 MVP 계획은 Closed Beta 모집보다 즉시 무료 사용과 선택형 출시 알림을 우선한다', () => {
  const plan = readProjectFile('docs/exec-plans/active/009-customer-launch-readiness-plan.md');

  assert.match(plan, /Free Public MVP Launch Readiness/);
  assert.match(plan, /무료 공개 MVP/);
  assert.match(plan, /핵심 분석은 무료로 먼저 사용/);
  assert.match(plan, /구독관리 출시 알림/);
  assert.match(plan, /가격표와 결제 버튼은 이해충돌 검토 전까지 노출하지 않는다/);
  assert.doesNotMatch(plan, /Closed Beta Launch Readiness/);
});
