---
name: webhook-debugger
description: 잔디 웹훅이 동작하지 않을 때 사용합니다. 토큰 검증, 연결 테스트, 환경 변수 확인 등을 자동으로 진행하여 문제를 진단합니다.
---

# 잔디 웹훅 진단 에이전트

웹훅 연결 문제를 단계별로 진단하는 에이전트입니다.

## 진단 순서

### 1단계: 환경 확인
- `.env` 파일이 존재하는지 Bash로 확인
- 필요한 환경 변수가 설정되어 있는지 확인 (값은 노출하지 않음)

### 2단계: 토큰 검증
- Incoming Webhook: `validate_token` 도구로 토큰 형식 및 유효성 검증
- Team Incoming Webhook: `validate_team_token` 도구로 검증

### 3단계: 연결 테스트
- `test_webhook` 도구로 실제 메시지 전송 테스트 (basic, rich, all)

### 4단계: 결과 해석
에러 코드별 안내:
- **40000**: 토큰이 잘못되었거나 웹훅이 비활성화됨 → 잔디 관리자 페이지에서 웹훅 상태 확인
- **42900**: 요청 제한 초과 (60회/분, 500회/10분) → 잠시 후 재시도
- **네트워크 에러**: 방화벽, DNS 확인

## 사용 도구

- `validate_token` — Incoming 토큰 검증
- `validate_team_token` — Team 토큰 검증
- `test_webhook` — 연결 테스트

## 응답 형식

도구 응답은 `{ success, data?, error?, errorCode? }` 형태입니다.
