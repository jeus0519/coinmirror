# QUALITY_SCORE

- **기준일:** 2026-09-21
- **최신 검증 커밋:** `a61e116c724e6e425b582abb8ba060719e31fa8d`

도메인/레이어별 품질 상태를 추적한다. 정기적으로 갱신하며 `/cleanup` 실행 시 함께 점검한다.

| 영역 | 상태 | 비고 |
|---|---|---|
| UI (`src/app`, `src/components`) | 🟡 Preview 검증 전 | Expo Web 6단계 흐름, 업비트 PDF/CSV 업로드, 거래 개요, 투자거울 타입, 선택형 AI 행동코칭, 예상 vs 기록, 행동 점수, 비교·구독 프리뷰를 제공한다. 화면 순서는 `거래 개요 → 투자거울 타입 → AI 행동코칭`으로 정렬했다. 외부 Preview와 실제 사용자 관찰은 남아 있다. |
| 상태관리 (`src/stores`) | 🟡 부분 | `use-flow-store`가 진단, 거래 분석, 비교 스냅샷, 구독 목표를 관리한다. `use-journal-store`는 초기 목업 잔재로 남아 있다. |
| 로컬 영속화 | 🟡 부분 | 구독관리용 분석 요약 스냅샷과 목표를 버전 payload로 브라우저에 저장·복원·삭제한다. 원본 PDF/CSV, PDF 비밀번호, 개별 체결 원문은 저장하지 않는다. 전체 진단·분석 세션 복원은 지원 범위가 아니다. |
| 거래내역 파싱·스코어 계산 | 🟡 실제 CSV 최종 검증 전 | 업비트 PDF/CSV 어댑터, PDF.js 텍스트 추출, CP949·숫자·날짜 검증, 30분 Order 병합, FIFO RoundTrip, 수수료 포함 손익, F1/F3/F6/F8, 예상 vs 기록을 연결했다. 실제 업비트 PDF 스모크는 완료했으며 실제 CSV 원본 최종 서식 검증은 남아 있다. |
| AI 행동코칭 | 🟡 Preview 검증 전 | 비식별 safe payload, 서버 allowlist, 2,048-byte 제한, 3.5초 timeout, 응답 schema·금지 표현 검증, 성공 후 fingerprint 잠금, 실패 후 30초 쿨다운과 최대 3회 재시도를 구현했다. 실제 provider 지연·fallback 비율·비용은 Preview에서 확인해야 한다. |
| 시장·이벤트 API | 🟡 Preview 검증 전 | same-origin `/api/market-context`와 `/api/exchange-events`, 15분·3시간 서버 캐시, 안전한 fallback을 구현했다. 이벤트 외부 HTML 구조 변경 가능성이 있어 live/fallback 모니터링이 필요하다. |
| Vercel 배포·WAF | 🟡 외부 승인 대기 | Expo server output, Vercel adapter와 런북은 준비됐다. 프로젝트 생성, Preview 환경변수, AI 비용 상한, WAF rule publish, runtime log 비식별화 검증은 아직 실행하지 않았다. |
| 테스트 | 🟢 로컬 자동 검증 | `npm test` 235 passed / 0 failed, lint·typecheck·diff-check·Expo Web export를 통과했다. PDF.js `standardFontDataUrl` 경고는 알려진 비차단 경고다. |
| Git | 🟢 양호 | 최신 검증 커밋 `a61e116`이 `origin/main`과 동기화되어 있다. force push 없이 변경 단위별 검증 커밋을 유지한다. |
| 문서 최신성 | 🟢 2026-09-21 정렬 | Vercel을 배포 SSoT로 지정하고 EAS 런북을 대체 문서로 표시했다. 화면 순서, API 3개, AI 재시도 정책, 235개 테스트, 남은 Preview·실사용 게이트를 active 문서에 반영했다. |

상태 기준: 🟢 양호·검증 완료 · 🟡 진행 중/외부 검증 필요 · 🔴 미흡/부재
