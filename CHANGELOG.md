# Changelog

이 프로젝트의 주요 변경사항을 기록합니다. 버전은 [Semantic Versioning](https://semver.org/lang/ko/)을 따르며, 1.0.1 이후 항목은 커밋 이력에서 [semantic-release](https://semantic-release.gitbook.io/)가 자동 생성합니다.

## [1.1.2](https://github.com/kwag93/cc-jandi/compare/v1.1.1...v1.1.2) (2026-08-03)


### Bug Fixes

* MCP 클라이언트에 서버 이름이 unnamed-mcp-server로 표시되던 문제 ([0cddf4e](https://github.com/kwag93/cc-jandi/commit/0cddf4e37b998c3fc94f2666d730799f071251cd))

## [1.1.1](https://github.com/kwag93/cc-jandi/compare/v1.1.0...v1.1.1) (2026-08-03)

# [1.1.0](https://github.com/kwag93/cc-jandi/compare/v1.0.1...v1.1.0) (2026-08-03)


### Bug Fixes

* 독립 리뷰 지적 반영 — 토큰 해석과 응답 전파 정합화 ([0aaad37](https://github.com/kwag93/cc-jandi/commit/0aaad37c62c923559c033e581577a9a385600210))
* 잔디 웹훅 통신을 공식 스펙과 실측 결과에 맞게 교정 ([831ca37](https://github.com/kwag93/cc-jandi/commit/831ca373b868e41af2527cab0286fdb67c43f233))


### Features

* skills와 agents를 현행 frontmatter 규약에 맞게 정비 ([8de6975](https://github.com/kwag93/cc-jandi/commit/8de6975b1506167d561a830709be9c03f9f07b7d))
* 플러그인 매니페스트를 현행 Claude Code 규약으로 개편 ([ddcbacc](https://github.com/kwag93/cc-jandi/commit/ddcbacc9842c315e42b066d1879ecdc6be859832))

## [1.0.0] - 2026-03-25

### Changed
- 프로젝트명 변경: jandi-mcp → cc-jandi
- Claude Code 플러그인 구조 추가
- 모든 도구 반환값을 ToolResult 형태로 통일
- 색상 검증 로직을 공용 유틸로 추출

### Added
- Skills: notify, alert, deploy-notify, daily-report
- Agents: notification-composer, webhook-debugger
- Rate limit 에러 시 지수 백오프 재시도 (최대 3회)
- ToolResult<T> 표준 응답 인터페이스
- validateHexColor() 공용 유틸리티
- Claude Code 플러그인 매니페스트 (.claude-plugin/plugin.json)
- MCP 서버 번들링 (.mcp.json)

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
