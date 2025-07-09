# Changelog

이 프로젝트의 모든 주요 변경사항이 이 파일에 기록됩니다.

이 형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.0.0/)를 기반으로 하며, 
[Semantic Versioning](https://semver.org/lang/ko/)을 준수합니다.

## [Unreleased]

### Added
- 초기 릴리즈 준비

## [0.1.0] - 2025-01-09

### Added
- 잔디 MCP 서버 초기 구현
- 기본 메시지 전송 도구 (`send_message`)
- 리치 메시지 전송 도구 (`send_rich_message`)
- 토큰 검증 도구 (`validate_token`)
- 웹훅 테스트 도구 (`test_webhook`)
- 스크립트 생성 도구 (`generate_webhook_script`)
- 다중 토큰 관리 시스템
- 환경 변수 기반 설정
- 포괄적인 에러 처리 (잔디 에러 코드 지원)
- 속도 제한 대응 (60 req/min, 500 req/10min)
- 메시지 크기 제한 검증 (5000자, 256KB)
- Python, Node.js, curl, bash 스크립트 생성 지원
- 한국어 문서화
- MIT 라이선스 적용

### Technical
- TypeScript로 구현
- mcp-framework 기반
- axios를 이용한 HTTP 통신
- dotenv를 이용한 환경 변수 관리
- Semantic Versioning 적용