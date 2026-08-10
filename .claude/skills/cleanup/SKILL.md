---
name: cleanup
description: 코드/문서 엔트로피를 점검하고 정리한다 (오래된 문서, 죽은 코드, 낡은 QUALITY_SCORE). 사용자가 "/cleanup" 또는 "정리해줘"라고 할 때, 또는 정기적으로 사용.
---

# /cleanup

OpenAI 하네스 엔지니어링 원칙의 "가비지 컬렉션"에 해당 — 작은 정리를 자주 하는 것이 목표. 한 번에 다 고치려 하지 않는다.

## 점검 항목

1. **죽은 코드**: 어디서도 import되지 않는 컴포넌트/스토어/유틸이 있는지 확인.
2. **문서 신선도**: `docs/` 안의 문서가 실제 코드 상태와 맞는지. 특히 `docs/QUALITY_SCORE.md`, `docs/exec-plans/tech-debt-tracker.md`.
3. **exec-plans 정리**: `docs/exec-plans/active/` 중 완료된 계획이 있으면 `completed/`로 이동.
4. **의존성**: `npm outdated`로 크게 뒤처진 패키지 확인 (즉시 업그레이드하지 않아도 됨 — 목록만 보고한다).
5. **컨벤션 드리프트**: 최근 추가된 코드가 `docs/FRONTEND.md`/`ARCHITECTURE.md` 규칙과 어긋나는 패턴을 반복하고 있는지 (같은 실수가 3번 이상 보이면 문서에 규칙으로 명시하거나 lint 규칙 승격을 제안).

## 절차

1. 위 항목을 순서대로 훑고 발견한 것을 목록으로 제시한다.
2. 사소하고 명백한 것(빈 `.gitkeep` 정리, 죽은 import 제거 등)은 바로 고친다.
3. 판단이 필요한 것(패키지 업그레이드, 큰 리팩터)은 제안만 하고 사용자 확인 후 진행한다.
4. 정리 후 `docs/QUALITY_SCORE.md`를 갱신한다.
