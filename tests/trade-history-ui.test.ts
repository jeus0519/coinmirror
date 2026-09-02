import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const STEP_PATH = 'src/components/steps/step-3-data-import.tsx';

/** 주석에는 금지 식별자(Alert 등)가 설명 목적으로 등장한다. 실제 코드만 검사한다. */
function stripComments(source: string) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

async function readStepSource() {
  return readFile(STEP_PATH, 'utf8');
}

async function readStepCode() {
  return stripComments(await readStepSource());
}

test('거래내역 업로드 화면은 CSV 전용 문구가 아니라 PDF/CSV를 함께 안내한다', async () => {
  const source = await readStepSource();

  assert.match(source, /PDF\/CSV|CSV\/PDF|PDF 거래내역/);
  assert.match(source, /application\/pdf/);
  assert.match(source, /PDF 파일이 아니에요/);
  assert.match(source, /CSV 파일이 아니에요/);
  assert.doesNotMatch(source, />내 CSV 업로드</);
});

test('거래내역 업로드 화면은 PDF와 CSV를 옵션으로 선택하게 하고 원본 업로드를 안내한다', async () => {
  const source = await readStepSource();

  assert.match(source, /label="PDF 거래내역 올리기"/);
  assert.match(source, /label="CSV 거래내역 올리기"/);
  assert.match(source, /format="pdf"/);
  assert.match(source, /format="csv"/);
  assert.match(source, /업비트가 보낸 원본 PDF를 올려 주세요/);
  assert.match(source, /showPasswordTrustGuide/);
});

test('인쇄 → PDF로 저장 우회를 권장하지 않는다', async () => {
  // 인쇄 저장본은 텍스트 레이어가 사라져 파싱이 불가능하고,
  // 암호가 풀린 거래내역서가 남아 오히려 위험하다. 권장 문구가 되살아나면 실패시킨다.
  const source = await readStepSource();

  assert.doesNotMatch(source, /showPasswordBypassGuide/);
  assert.doesNotMatch(source, /비밀번호 없이 올리는 방법/);
  assert.match(source, /글자가 이미지로 바뀌어서 숫자를 읽을 수\s*\n?\s*없어요/);
});

test('이미지 PDF는 조용히 0건으로 끝내지 않고 원인과 다음 행동을 안내한다', async () => {
  const source = await readStepSource();

  assert.match(source, /isPdfNoTextLayerError/);
  assert.match(source, /showImagePdfGuide/);
  assert.match(source, /숫자를 읽을 수 없는 PDF예요/);
  // 안내만 던지고 막다른 길로 두지 않는다 — 예시 데이터로 이어갈 수 있어야 한다.
  assert.match(source, /offerSample: true/);
  assert.match(source, /예시 데이터로 먼저 둘러보기/);
});

test('결과 안내는 웹에서 no-op인 Alert이 아니라 화면 안 상태로 표시한다', async () => {
  // react-native-web의 Alert.alert는 빈 함수다(`static alert() {}`).
  // 이 화면이 Alert에 기대는 순간 Chrome에서는 눌러도 아무 반응이 없는 것처럼 보인다.
  const code = await readStepCode();

  assert.doesNotMatch(code, /\bAlert\b/);
  assert.match(code, /setNotice/);
  assert.match(code, /notice\.title/);
  assert.match(code, /notice\.body/);
});

test('웹 파일 선택은 실제 DOM input에 클릭이 직접 떨어지게 한다', async () => {
  const code = await readStepCode();

  // 분리된 input을 async 핸들러에서 프로그램적으로 여는 방식은
  // Chrome이 사용자 제스처를 잃어 파일 창이 안 뜨거나 change가 안 오는 원인이었다.
  assert.doesNotMatch(code, /document\.createElement\(/);
  assert.doesNotMatch(code, /\.click\(\)/);
  assert.match(code, /type="file"/);
  assert.match(code, /accept=\{ACCEPT\[format\]\}/);
  assert.match(code, /onChange=/);
  assert.match(code, /file\.arrayBuffer|arrayBuffer\(\)/);
  // 네이티브에서만 expo-document-picker를 쓴다.
  assert.match(code, /Platform\.OS !== 'web'/);
  assert.match(code, /Platform\.OS === 'web' \? undefined : pickWithNativeDialog/);
});

test('업로드 진행 상태와 선택한 파일이 화면에 드러난다', async () => {
  const source = await readStepSource();

  assert.match(source, />선택한 파일</);
  assert.match(source, /selectedFileLabel/);
  assert.match(source, /setProgress/);
  assert.match(source, /ActivityIndicator/);
  assert.match(source, /파일을 읽는 중이에요/);
  assert.match(source, /PDF에서 거래 내역을 찾는 중이에요/);
});

test('암호화 PDF는 브라우저 prompt가 아니라 화면 안에서 비밀번호를 받는다', async () => {
  const source = await readStepSource();

  assert.doesNotMatch(source, /globalThis/);
  assert.doesNotMatch(source, /\.prompt\(/);
  assert.match(source, /isPdfPasswordRequiredError/);
  assert.match(source, /pendingPdfBytes/);
  assert.match(source, /secureTextEntry/);
  assert.match(source, /비밀번호 입력 후 분석/);
});

test('파싱에 성공하면 그 데이터로 분석을 이어갈 수 있다', async () => {
  const source = await readStepSource();

  assert.match(source, /이 데이터로 분석 계속/);
  assert.match(source, /confirmTradeAnalysis/);
  assert.match(source, /handleContinueTradeAnalysis/);
});

test('비밀번호 값은 화면 문구나 로그로 새어 나가지 않는다', async () => {
  const code = await readStepCode();

  assert.doesNotMatch(code, /console\.[a-z]+\([^)]*[Pp]assword/);
  assert.doesNotMatch(code, /setNotice\([^)]*pdfPassword/);
  assert.doesNotMatch(code, /setProgress\([^)]*pdfPassword/);
});

test('PDF 비밀번호는 입력값 그대로 쓰고 원본 바이트를 복사해 재시도한다', async () => {
  const code = await readStepCode();

  assert.doesNotMatch(code, /pdfPassword\.trim\(\)/);
  assert.match(code, /const password = pdfPassword/);
  assert.match(code, /pendingPdfBytes\.slice\(0\)/);
  assert.match(code, /setPendingPdfBytes\(bytes\.slice\(0\)\)/);
});

test('웹 버튼은 Pressable onPress만 의존하지 않고 DOM click도 연결한다', async () => {
  const source = await readFile('src/components/ui/button.tsx', 'utf8');

  assert.match(source, /Platform\.OS === 'web'/);
  assert.match(source, /onClick/);
  assert.match(source, /props\.onPress/);
});

test('현재 앱 루트에서 query로 업로드 단계에 직접 진입할 수 있다', async () => {
  const source = await readFile('src/app/index.tsx', 'utf8');

  assert.match(source, /useLocalSearchParams/);
  assert.match(source, /params\.step === 'upload'/);
  assert.match(source, /setStep\(3\)/);
});

test('업로드 화면은 중복 업로드와 교차 기간 청산을 체험하는 데모 진입점을 제공한다', async () => {
  const source = await readStepSource();

  assert.match(source, /demo=duplicate-upload/);
  assert.match(source, /중복 업로드 처리 체험하기/);
  assert.match(source, /기간 밖 매수분/);
  assert.match(source, /원가 연결용/);
  assert.match(source, /demo=duplicate-upload/);

  const appSource = await readFile('src/app/index.tsx', 'utf8');
  assert.match(appSource, /params\.demo === 'duplicate-upload'/);
  assert.match(appSource, /runDuplicateUploadDemo/);
});
