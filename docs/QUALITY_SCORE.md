# QUALITY_SCORE

도메인/레이어별 품질 상태를 추적한다. 정기적으로 갱신 — `/cleanup` 스킬 실행 시 함께 점검.

| 영역 | 상태 | 비고 |
|---|---|---|
| UI (src/app, src/components) | 🟡 목업 | 4단계 스테퍼(`docs/coinmirror_demo.html` 기준) 전 화면 목업 완료, 전부 mock 데이터. 상세: `docs/exec-plans/active/001-coinmirror-mvp-stepper-mockup.md` |
| 상태관리 (src/stores) | 🟡 부분 | `use-flow-store`(스테퍼 상태)는 실사용 중. `use-journal-store`는 1차 목업 잔재로 미사용 — 정리 대상 |
| 로컬 영속화 | 🟡 부분 | 3단계 워크시트만 `AsyncStorage`로 실제 저장. Trade/JournalEntry는 아직 `expo-sqlite` 미도입 |
| Supabase 연동 (src/lib/supabase.ts) | 🔴 미착수 | 클라이언트만 존재, 스키마/RLS 미정, 어디서도 호출 안 함 |
| CSV 파싱·스코어 계산 | 🔴 미착수 | M1~M6 전부 mock 값. 실제 백엔드 로직 이식 여부 확인 필요 |
| 테스트 | 🔴 없음 | MVP 단계 — 핵심 로직 생기면 추가 |
| git 커밋 | 🔴 없음 | 이 저장소는 아직 한 번도 커밋된 적 없음(워킹트리만 존재) |
| 문서 최신성 | 🟡 주의 | `docs/product-specs/001-trade-journal.md`가 1차(4탭) 구조 기준이라 현재 구조와 어긋남 — 갱신 필요 |

상태 기준: 🟢 양호 · 🟡 진행 중/주의 · 🔴 미흡/부재
