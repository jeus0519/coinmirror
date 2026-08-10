#!/usr/bin/env node
// PreToolUse(Edit|Write): expo prebuild 산출물(ios/, android/) 직접 수정을 차단한다.
let input = '';
process.stdin.on('data', (chunk) => (input += chunk));
process.stdin.on('end', () => {
  let data;
  try {
    data = JSON.parse(input || '{}');
  } catch {
    process.exit(0);
  }

  const filePath = (data?.tool_input?.file_path || data?.tool_input?.path || '').replace(/\\/g, '/');
  if (!filePath) process.exit(0);

  if (/(^|\/)(ios|android)\//.test(filePath)) {
    console.error(
      `[native-folder-protection] "${filePath}"는 expo prebuild가 생성하는 네이티브 폴더입니다. ` +
        `직접 수정하지 마세요 — 다음 prebuild에서 덮어써집니다. app.json의 expo 설정이나 config plugin으로 바꾸세요.`
    );
    process.exit(2);
  }

  process.exit(0);
});
