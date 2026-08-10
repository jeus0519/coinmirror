#!/usr/bin/env node
// PostToolUse(Edit|Write): 수정된 파일을 Prettier로 자동 포맷한다. 실패해도 세션을 막지 않는다.
const { exec } = require('child_process');

let input = '';
process.stdin.on('data', (chunk) => (input += chunk));
process.stdin.on('end', () => {
  let data;
  try {
    data = JSON.parse(input || '{}');
  } catch {
    process.exit(0);
  }

  const filePath = data?.tool_input?.file_path || data?.tool_response?.filePath || '';
  if (!filePath || !/\.(ts|tsx|js|jsx|json|css)$/.test(filePath)) {
    process.exit(0);
  }

  const cwd = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const quotedPath = `"${filePath.replace(/"/g, '\\"')}"`;

  exec(`npx prettier --write ${quotedPath}`, { cwd, timeout: 20000 }, () => {
    process.exit(0);
  });
});
