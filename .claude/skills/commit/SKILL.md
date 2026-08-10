---
name: commit
description: 변경사항을 확인하고 lint/typecheck를 통과시킨 뒤 의미 있는 커밋 메시지로 커밋한다. 사용자가 "/commit" 또는 "커밋해줘"라고 할 때 사용.
---

# /commit

## 절차

1. `git status`, `git diff`로 변경사항 전체를 확인한다. 의도치 않은 파일(임시 파일, `.env`, 큰 바이너리)이 섞여 있는지 확인.
2. `npm run lint`를 실행한다. 실패하면 원인을 고치고 다시 실행 — `--no-verify`나 lint 무시로 우회하지 않는다.
3. `npx tsc --noEmit`으로 타입 에러가 없는지 확인한다.
4. 변경 파일을 의미 단위로 `git add`한다 (`git add -A`는 지양 — 의도치 않은 파일 포함 방지).
5. 커밋 메시지는 **무엇을 바꿨는지가 아니라 왜 바꿨는지**를 한 줄로. 예: `매매 직후 감정 태그 입력을 기본값으로 사전 채움 (기록 마찰 줄이기)`.
6. 커밋 메시지 끝에 다음을 추가한다:
   ```
   Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
   ```
7. 커밋 후 `git status`로 깨끗한지 확인.

## 하지 않는 것

- 사용자가 명시적으로 요청하지 않으면 push하지 않는다.
- 사용자가 요청하지 않으면 커밋하지 않는다 (이 스킬은 "/commit" 호출 시에만 동작).
