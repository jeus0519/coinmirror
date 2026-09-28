import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { calculateStepNavScrollOffset } from '../src/lib/step-nav-layout.ts';

test('모바일에서 활성 단계가 오른쪽으로 잘리면 가운데 보이도록 스크롤 위치를 계산한다', () => {
  const offset = calculateStepNavScrollOffset({
    viewportWidth: 390,
    contentWidth: 646,
    currentScrollX: 0,
    itemX: 307.1875,
    itemWidth: 112.9375,
    edgePadding: 16,
  });

  assert.equal(offset, 168.65625);
});

test('단계 내비게이션은 활성 항목의 실제 레이아웃을 측정해 ScrollView에 적용한다', async () => {
  const source = await readFile('src/components/steps/step-nav.tsx', 'utf8');

  assert.match(source, /calculateStepNavScrollOffset/);
  assert.match(source, /onContentSizeChange/);
  assert.match(source, /onLayout/);
  assert.match(source, /scrollTo\(\{\s*x:\s*targetX/);
  assert.doesNotMatch(source, /contentContainerClassName="[^"]*\bw-full\b/);
});
