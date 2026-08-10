#!/usr/bin/env node
// Stop: 세션에서 무엇이 바뀌었는지 git 기준으로 요약해 사용자에게 보여준다.
const { execSync } = require('child_process');

const cwd = process.env.CLAUDE_PROJECT_DIR || process.cwd();

function run(cmd) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

let summary;
if (!run('git rev-parse --is-inside-work-tree')) {
  summary = 'git 저장소가 아니라 요약을 생략합니다.';
} else {
  const unstaged = run('git diff --stat');
  const staged = run('git diff --cached --stat');
  const untracked = run('git ls-files --others --exclude-standard')
    .split('\n')
    .filter(Boolean);

  const parts = [];
  if (staged) parts.push(`스테이징됨:\n${staged}`);
  if (unstaged) parts.push(`미스테이징 변경:\n${unstaged}`);
  if (untracked.length) {
    const shown = untracked.slice(0, 10).join('\n');
    parts.push(`새 파일 ${untracked.length}개:\n${shown}${untracked.length > 10 ? '\n...' : ''}`);
  }

  summary = parts.length ? parts.join('\n\n') : '이번 세션에서 git 변경사항이 없습니다.';
}

console.log(JSON.stringify({ systemMessage: `세션 요약\n\n${summary}` }));
process.exit(0);
