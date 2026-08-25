# SECURITY

## 시크릿

- API 키/시크릿은 `.env`에만. `.env`는 git에 커밋하지 않는다 (강제: `env-protection` 훅 + `.gitignore`).
- 새 시크릿을 추가하면 `.env.example`에 키 이름과 형식만 추가 (값은 더미).
- 클라이언트 번들에 노출되어도 되는 값만 `EXPO_PUBLIC_` 접두사를 붙인다. Supabase anon key는 공개되어도 되는 키이지만, RLS 없이는 위험하다 — 아래 참고.

## Supabase

- 모든 테이블은 RLS(Row Level Security)를 기본 활성화한다. RLS 없는 테이블을 만들지 말 것.
- 클라이언트는 `anon` 키만 사용한다. `service_role` 키는 클라이언트 코드/저장소 어디에도 두지 않는다 (서버/Edge Function 전용).
- 인증된 사용자 본인 데이터만 읽기/쓰기 가능하도록 정책을 작성 (`auth.uid() = user_id` 패턴).

## 네이티브 프로젝트

- `ios/`, `android/` 폴더는 `expo prebuild`로 생성되는 산출물이다. 직접 수정하지 않는다 (강제: `native-folder-protection` 훅). 네이티브 설정 변경은 `app.json`의 `expo` 설정이나 config plugin으로.

## 의존성

- 새 패키지 추가 시 유지보수 상태(최근 업데이트, 다운로드 수)를 가볍게 확인. Expo SDK 호환 패키지는 `npx expo install`로 설치해 버전 충돌을 피한다.

## 서버 보관 최소화

- 원본 CSV와 체결 단위 거래 원장은 서버에 보관하지 않는다.
- 이메일 리포트 발송이 필요한 경우에도 서버에는 점수, 투자거울 타입, 밴드, 분석 기준일, 리포트 발송 상태 같은 최소 집계만 저장한다.
- 리포트 메일과 마케팅 메일의 수신 동의·해지는 분리해 관리한다.
- 삭제 요청 시 서버의 최소 집계와 이메일 발송 이력도 함께 삭제/비식별화한다.
