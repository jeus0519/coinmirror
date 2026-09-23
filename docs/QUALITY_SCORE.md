# QUALITY_SCORE

- **기준일:** 2026-09-23
- **최신 검증 배포 커밋:** `d6c7c1fa3ac9b1d77fe91093c0f229a0c9b29438`

도메인/레이어별 품질 상태를 추적한다. 정기적으로 갱신하며 `/cleanup` 실행 시 함께 점검한다.

| 영역 | 상태 | 비고 |
|---|---|---|
| UI (`src/app`, `src/components`) | 🟡 Preview 기본 검증 | Expo Web 6단계 흐름, 업비트 PDF/CSV 업로드, 거래 개요, 투자거울 타입, 선택형 AI 행동코칭, 예상 vs 기록, 행동 점수, 비교·구독 프리뷰를 제공한다. Preview root 렌더와 핵심 문구는 확인했으며 실제 사용자 파일 기반 관찰은 남아 있다. |
| 상태관리 (`src/stores`) | 🟡 부분 | `use-flow-store`가 진단, 거래 분석, 비교 스냅샷, 구독 목표를 관리한다. `use-journal-store`는 초기 목업 잔재로 남아 있다. |
| 로컬 영속화 | 🟡 부분 | 구독관리용 분석 요약 스냅샷과 목표를 버전 payload로 브라우저에 저장·복원·삭제한다. 원본 PDF/CSV, PDF 비밀번호, 개별 체결 원문은 저장하지 않는다. 전체 진단·분석 세션 복원은 지원 범위가 아니다. |
| 거래내역 파싱·스코어 계산 | 🟡 실제 CSV 최종 검증 전 | 업비트 PDF/CSV 어댑터, PDF.js 텍스트 추출, CP949·숫자·날짜 검증, 30분 Order 병합, FIFO RoundTrip, 수수료 포함 손익, F1/F3/F6/F8, 예상 vs 기록을 연결했다. 실제 업비트 PDF 스모크는 완료했으며 실제 CSV 원본 최종 서식 검증은 남아 있다. |
| AI 행동코칭 | 🟡 실제 provider 검증 전 | Preview에서 비식별 safe payload의 HTTP 200 fallback, 잘못된 요청의 400, 초과 body의 413과 `no-store`를 확인했다. 실제 provider 성공·비용·성공 잠금·재시도 UI 실측은 서버 secret 등록 후 진행한다. |
| 시장·이벤트 API | 🟡 외부 이벤트 안정성 관찰 | Preview에서 시장 API `source=live`와 BTC·ETH·XRP+상위 3개를 확인했다. 이벤트 API는 `source=fallback`이므로 거래소 링크 fallback을 유지하고 외부 HTML 구조를 모니터링한다. |
| Vercel 배포·WAF | 🟡 Preview 완료·보호 설정 대기 | `data-grida/coinmirror` Preview가 `READY`이고 Node.js 24.x, static route 7개, API route 3개를 확인했다. 원격 환경변수와 custom WAF rule은 0개이며 GitHub 자동 배포도 미연결이다. |
| 테스트 | 🟢 로컬·Preview 자동 검증 | `npm test` 237 passed / 0 failed, lint·typecheck·독립 Vercel function typecheck·diff-check·Expo Web export를 통과했다. PDF.js `standardFontDataUrl` 경고는 알려진 비차단 경고다. |
| Git | 🟢 검증 커밋 보존 | Vercel 배포 계약 변경을 `d6c7c1f`로 보존했다. `.hermes/`, `.env.local`, `.vercel/`은 커밋 대상에서 제외한다. |
| 문서 최신성 | 🟢 2026-09-23 정렬 | Vercel Preview 실측, API 200/400/413, Node.js 24.x, 237개 테스트, 환경변수·WAF·GitHub 연결의 남은 게이트를 active 문서에 반영했다. |

상태 기준: 🟢 양호·검증 완료 · 🟡 진행 중/외부 검증 필요 · 🔴 미흡/부재
