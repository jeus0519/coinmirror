#!/usr/bin/env node
// PreToolUse(Read|Edit|Write): .env류 시크릿 파일 접근을 차단한다.
let input = '';
process.stdin.on('data', (chunk) => (input += chunk));
process.stdin.on('end', () => {
  let data;
  try {
    data = JSON.parse(input || '{}');
  } catch {
    process.exit(0);
  }

  const filePath = data?.tool_input?.file_path || data?.tool_input?.path || '';
  if (!filePath) process.exit(0);

  const base = filePath.replace(/\\/g, '/').split('/').pop() || '';
  const isEnvFile = /^\.env(\..+)?$/.test(base);
  const isAllowed = /^\.env\.(example|sample)$/.test(base);

  if (isEnvFile && !isAllowed) {
    console.error(
      `[env-protection] "${base}"는 시크릿이 담긴 파일이라 Claude가 읽거나 수정하지 않습니다. ` +
        `값 확인/수정은 사용자가 직접 하세요. 새 키를 추가하려면 .env.example에 이름(더미 값)만 추가하세요.`
    );
    process.exit(2);
  }

  process.exit(0);
});
