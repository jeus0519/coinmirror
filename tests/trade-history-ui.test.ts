import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('거래내역 업로드 화면은 CSV 전용 문구가 아니라 PDF/CSV를 함께 안내한다', async () => {
  const source = await readFile('src/components/steps/step-3-data-import.tsx', 'utf8');

  assert.match(source, /PDF\/CSV|CSV\/PDF|PDF 거래내역/);
  assert.match(source, /application\/pdf/);
  assert.match(source, /PDF 파일이 아니에요/);
  assert.match(source, /CSV 파일이 아니에요/);
  assert.doesNotMatch(source, />내 CSV 업로드</);
});

test('거래내역 업로드 화면은 PDF와 CSV를 옵션으로 선택하게 하고 원본 업로드를 안내한다', async () => {
  const source = await readFile('src/components/steps/step-3-data-import.tsx', 'utf8');

  assert.match(source, />PDF 거래내역 올리기</);
  assert.match(source, />CSV 거래내역 올리기</);
  assert.match(source, /handleUpload\('pdf'\)/);
  assert.match(source, /handleUpload\('csv'\)/);
  assert.match(source, /업비트가 보낸 원본 PDF를 올려 주세요/);
  assert.match(source, /showPasswordTrustGuide/);
});

test('인쇄 → PDF로 저장 우회를 권장하지 않는다', async () => {
  // 인쇄 저장본은 텍스트 레이어가 사라져 파싱이 불가능하고,
  // 암호가 풀린 거래내역서가 남아 오히려 위험하다. 권장 문구가 되살아나면 실패시킨다.
  const source = await readFile('src/components/steps/step-3-data-import.tsx', 'utf8');

  assert.doesNotMatch(source, /showPasswordBypassGuide/);
  assert.doesNotMatch(source, /비밀번호 없이 올리는 방법/);
  assert.match(source, /글자가 이미지로 바뀌어서 숫자를 읽을 수\s*\n?\s*없어요/);
});

test('이미지 PDF는 조용히 0건으로 끝내지 않고 원인을 안내한다', async () => {
  const source = await readFile('src/components/steps/step-3-data-import.tsx', 'utf8');

  assert.match(source, /isPdfNoTextLayerError/);
  assert.match(source, /showImagePdfGuide/);
  assert.match(source, /숫자를 읽을 수 없는 PDF예요/);
});
