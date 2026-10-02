# QUALITY_SCORE

- **기준일:** 2026-10-02
- **최신 검증 배포 커밋:** `ee3d3f9 feat: add social preview metadata`

도메인/레이어별 품질 상태를 추적한다. 정기적으로 갱신하며 `/cleanup` 실행 시 함께 점검한다.

| 영역 | 상태 | 비고 |
|---|---|---|
| UI (`src/app`, `src/components`) | 🟢 Production 기본 검증 | Expo Web 6단계 흐름, 업비트 PDF/CSV 업로드, 거래 개요, 투자거울 타입, 선택형 AI 행동코칭, 예상 vs 기록, 행동 점수, 비교·구독 프리뷰를 제공한다. `https://www.coinmirror.kr` root 접근과 앱 마커를 확인했으며 실제 사용자 파일 기반 관찰은 남아 있다. |
| 상태관리 (`src/stores`) | 🟡 부분 | `use-flow-store`가 진단, 거래 분석, 비교 스냅샷, 구독 목표를 관리한다. `use-journal-store`는 초기 목업 잔재로 남아 있다. |
| 로컬 영속화 | 🟡 부분 | 구독관리용 분석 요약 스냅샷과 목표를 버전 payload로 브라우저에 저장·복원·삭제한다. 원본 PDF/CSV, PDF 비밀번호, 개별 체결 원문은 저장하지 않는다. 전체 진단·분석 세션 복원은 지원 범위가 아니다. |
| 거래내역 파싱·스코어 계산 | 🟡 실제 CSV 최종 검증 전 | 업비트 PDF/CSV 어댑터, PDF.js 텍스트 추출, CP949·숫자·날짜 검증, 30분 Order 병합, FIFO RoundTrip, 수수료 포함 손익, F1/F3/F6/F8, 예상 vs 기록을 연결했다. 실제 업비트 PDF 스모크는 완료했으며 실제 CSV 원본 최종 서식 검증은 남아 있다. |
| AI 행동코칭 | 🟢 Production provider 연결 | Preview와 Production에 서버 전용 AI key/model env가 분리되어 있다. `POST https://www.coinmirror.kr/api/ai-reflection` safe payload에서 `source=ai`, `errorCode=None`, 4개 output field를 확인했다. 원본 거래·종목·금액·수량·가격·파일명·PDF 비밀번호는 AI로 전송하지 않는다. |
| 시장·이벤트 API | 🟡 외부 이벤트 안정성 관찰 | Production에서 시장 API는 `source=live`, 이벤트 API는 안전한 `source=fallback` 경로를 유지한다. 외부 HTML 구조 변경에 취약하므로 거래소 링크 fallback을 유지하고 안정적인 공식 데이터 경로를 모니터링한다. |
| Vercel 배포·WAF·도메인 | 🟢 Production custom domain 공개 | `data-grida/coinmirror` Production deployment `dpl_BeoGo1YU4CYAzbxDr91HAMbDQR9j`가 Ready이고 `https://www.coinmirror.kr`가 이를 가리킨다. `coinmirror.kr`, `coinmirror.co.kr`, `www.coinmirror.co.kr`는 canonical로 redirect된다. POST AI route의 IP·Fixed Window·60초 10회 edge WAF rule은 live다. |
| 공유 미리보기 | 🟢 OG/Twitter 적용 | `public/og/coinmirror-og.png` 1200×630 PNG와 canonical/OG/Twitter 메타가 Production에 적용됐다. 공개 URL `https://www.coinmirror.kr/og/coinmirror-og.png`에서 HTTP 200과 이미지 규격을 확인했다. |
| 테스트 | 🟢 로컬·Preview·Production smoke 검증 | SEO/OG metadata 테스트, typecheck, lint, Expo Web export, Preview 메타 확인, Production custom domain root/redirect/OG image/API smoke를 통과했다. PDF.js `standardFontDataUrl` 경고는 알려진 비차단 경고다. |
| Git | 🟢 검증 커밋 보존 | canonical redirect는 `005b406`, OG/social preview는 `ee3d3f9`로 분리 보존했다. `.hermes/`, `.env.local`, `.vercel/`은 커밋 대상에서 제외한다. |
| 문서 최신성 | 🟢 2026-10-02 정렬 | Vercel Production custom domain, canonical redirect, Production AI, OG/Twitter 미리보기, P01~P03 공식 링크 운영 기준을 active 문서에 반영했다. |

상태 기준: 🟢 양호·검증 완료 · 🟡 진행 중/외부 검증 필요 · 🔴 미흡/부재
