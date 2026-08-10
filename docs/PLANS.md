# PLANS

실행 계획(Exec Plan)은 1급 산출물이다. 작은 변경은 계획 없이 바로 작업해도 되지만, 여러 파일/여러 세션에 걸치는 작업은 계획을 먼저 `docs/exec-plans/active/`에 작성한다.

## 계획 파일 규칙

- 파일명: `NNN-짧은-설명.md` (예: `001-trade-journal-mvp.md`)
- 완료되면 `active/`에서 `completed/`로 이동 (내용은 그대로, 이력 보존)
- 각 계획은 최소한 다음을 포함: 목표, 범위/비범위, 단계, 진행 상황 로그

## 진행 중 / 완료

- 진행 중: [docs/exec-plans/active/](exec-plans/active)
- 완료: [docs/exec-plans/completed/](exec-plans/completed)
- 알려진 기술 부채: [docs/exec-plans/tech-debt-tracker.md](exec-plans/tech-debt-tracker.md)
