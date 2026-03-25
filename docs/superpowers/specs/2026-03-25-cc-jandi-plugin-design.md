# cc-jandi 플러그인 전환 설계

> jandi-mcp → cc-jandi: Claude Code 플러그인 전환 + MCP 서버 개선

## 개요

기존 `jandi-mcp` MCP 서버(v0.2.0, 잔디 웹훅 4종 지원)를 Claude Code 플러그인 `cc-jandi`로 전환한다. 기존 MCP 서버는 `.mcp.json`으로 번들링하여 유지하고, Skills/Agents/Hooks를 추가하여 사용자 경험을 개선한다. 동시에 MCP 서버 코드 품질 개선(A~C)을 수행한다.

## 접근법

**In-place 전환** — 현재 레포에서 플러그인 구조를 추가한다.

- 기존 npm 패키지(`npx cc-jandi`) 유지
- 플러그인 마켓플레이스로도 배포 가능
- 하나의 레포에서 두 가지 배포 채널

## 디렉토리 구조

```text
cc-jandi/
├── .claude-plugin/
│   └── plugin.json              # name: "cc-jandi", version: "1.0.0"
├── skills/
│   ├── notify/SKILL.md          # /cc-jandi:notify
│   ├── alert/SKILL.md           # /cc-jandi:alert
│   ├── deploy-notify/SKILL.md   # /cc-jandi:deploy-notify
│   └── daily-report/SKILL.md    # /cc-jandi:daily-report
├── agents/
│   ├── notification-composer.md # 리치 메시지 작성 에이전트
│   └── webhook-debugger.md      # 웹훅 진단 에이전트
├── hooks/
│   └── hooks.json               # 이벤트 기반 자동 알림 (선택적)
├── .mcp.json                    # 기존 MCP 서버 번들링
├── src/                         # 기존 MCP 서버 코드 (개선 포함)
├── package.json                 # name: "cc-jandi"
├── CLAUDE.md
└── README.md
```

## Skills 설계

### /cc-jandi:notify — 빠른 채널 알림

- **설명**: 잔디 채널에 빠른 알림 메시지를 전송
- **사용법**: `/cc-jandi:notify 서버 점검 완료`
- **동작**: `$ARGUMENTS`를 메시지로 사용하여 `send_message` 도구 호출
- **내부 도구**: `send_message`

### /cc-jandi:alert — 심각도별 알림

- **설명**: 심각도(info/success/warning/error)에 따라 색상 코딩된 알림 전송
- **사용법**: `/cc-jandi:alert error DB 연결 실패`
- **동작**: `$ARGUMENTS`에서 첫 단어를 심각도로 파싱, 나머지를 메시지로 사용
- **색상 매핑**: info=#4A90D9, success=#2ECC71, warning=#F39C12, error=#E74C3C
- **내부 도구**: `send_rich_message`

### /cc-jandi:deploy-notify — 배포 알림

- **설명**: git 상태를 자동 수집하여 배포 결과 알림 전송
- **사용법**: `/cc-jandi:deploy-notify production 배포 완료`
- **수집 정보**: 브랜치명, 최근 커밋 해시/메시지, 변경 파일 수
- **내부 도구**: `send_rich_message` (connectInfo로 git 정보 첨부)

### /cc-jandi:daily-report — 일일 리포트

- **설명**: 오늘의 git 활동을 요약하여 잔디 채널에 리포트 전송
- **사용법**: `/cc-jandi:daily-report`
- **수집 정보**: 오늘 커밋 수, 변경 파일 목록, 주요 변경 요약
- **내부 도구**: `send_rich_message` (connectInfo로 활동 요약 첨부)

## Agents 설계

### notification-composer — 리치 메시지 작성 에이전트

- **역할**: 사용자가 잔디 알림을 구성할 때 자동 호출
- **기능**:
  - 색상 선택 가이드 (잔디 지원 색상 팔레트 제시)
  - `connectInfo` 첨부 구성 (title/description/imageUrl)
  - 미리보기 형태로 확인 후 전송
- **사용 도구**: `send_message`, `send_rich_message`, `send_team_message`, `send_team_rich_message`
- **라우팅 로직**: 사용자에게 채널 메시지(incoming)인지 개인 메시지(team-incoming)인지 확인 후, 적절한 도구를 선택. tokenAlias도 에이전트가 사용자에게 질문하여 결정한다.

### webhook-debugger — 웹훅 진단 에이전트

- **역할**: 웹훅 연결 문제 발생 시 자동 진단
- **기능**:
  - `validate_token`, `test_webhook` 도구로 연결 테스트
  - 환경 변수 설정 확인 (토큰 존재 여부, 형식 검증)
  - 에러 코드(40000, 42900) 해석 및 해결 방법 안내
  - `.env` 파일 존재 여부 확인
- **사용 도구**: `validate_token`, `test_webhook`, `validate_team_token`, Bash

## Hooks 설계

### hooks.json

```json
{
  "hooks": {}
}
```

초기에는 빈 hooks로 시작. 사용자가 필요에 따라 활성화할 수 있도록 Skills에서 hooks 설정 가이드를 제공한다.

## MCP 서버 번들링 (.mcp.json)

```json
{
  "mcpServers": {
    "cc-jandi": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/dist/index.js"]
    }
  }
}
```

빌드된 MCP 서버를 플러그인 내에서 직접 실행. 환경 변수는 사용자의 시스템에서 상속.

> **참고**: `${CLAUDE_PLUGIN_ROOT}`는 Claude Code 플러그인 런타임이 주입하는 환경 변수이다 ([플러그인 참조](https://code.claude.com/docs/ko/plugins-reference) 문서에 명시됨). 구현 시 `--plugin-dir` 로컬 테스트에서 이 변수가 올바르게 주입되는지 검증한다.

## MCP 서버 개선 (A~C)

### A. Rate limit 재시도

- **위치**: `src/services/base/BaseWebhookService.ts`의 `sendRequest()`
- **에러 모델**: `sendRequest()`는 예외를 던지지 않고 `{ success: false, rateLimited: true }` 형태의 반환값을 사용. 따라서 반환값의 `rateLimited` 플래그를 검사하여 재시도 여부를 결정한다.
- **동작**: 반환값에서 `rateLimited === true`이면 지수 백오프로 최대 3회 재시도
- **백오프**: 1s → 2s → 4s
- **실패 시**: 최종 반환값을 그대로 반환

### B. 색상 검증 중복 제거

- **신규 파일**: `src/utils/validateColor.ts`
- **함수**: `validateHexColor(color: string): { valid: boolean; normalized?: string; error?: string }`
- **적용 대상**:
  - `SendRichMessageTool` — 입력 색상 검증 (메시지 전송 시)
  - `SendTeamRichMessageTool` — 입력 색상 검증 (팀 메시지 전송 시)
  - `ValidateOutgoingResponseTool` — 응답 포맷 검증 (목적은 다르지만 동일한 hex 검증 로직)
- 3곳 모두 `#RRGGBB` 형식 확인이라는 동일 로직이므로 공용 유틸로 추출. `ValidateOutgoingResponseTool`은 검증 도구 역할이지만 hex 파싱 로직 자체는 동일하다.

### C. 에러 응답 통일

- **위치**: `src/types/common.ts`
- **관계 정리**: 기존 `BaseJandiResponse`는 서비스 레이어(HTTP 응답)용으로 유지. 새로운 `ToolResult`는 도구 레이어(MCP 클라이언트 응답)용으로 추가. 두 타입은 역할이 다르다.
  - `BaseJandiResponse` — 서비스 → 도구 (잔디 API 응답)
  - `ToolResult` — 도구 → MCP 클라이언트 (최종 응답)
- **형태**:

```typescript
interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: number;
}
```

- 모든 도구의 `execute()` 반환값을 이 형태로 통일
- 기존 도구별 커스텀 필드(`tokenFormat`, `messageDetails` 등)는 `data` 안에 포함
- `webhook-debugger` 에이전트가 참조하는 도구들의 `data` 구조가 변경되므로, 에이전트 프롬프트에서 응답 형식을 명시적으로 안내한다

## 리네이밍 범위

| 대상 | 변경 전 | 변경 후 |
|------|---------|---------|
| npm 패키지명 | `jandi-mcp` | `cc-jandi` |
| GitHub 레포 | `jandi-mcp` | `cc-jandi` |
| bin 명령어 | `jandi-mcp` | `cc-jandi` |
| 플러그인 이름 | — | `cc-jandi` |
| 디렉토리명 | `jandi-mcp` | `cc-jandi` |

## 배포 채널

1. **npm**: `npx cc-jandi` — 기존 MCP 서버 사용자
2. **Claude Code 플러그인**: `/plugin install cc-jandi` — Skills/Agents/Hooks 포함
3. **Claude Desktop**: `claude_desktop_config.json`에서 직접 MCP 서버로 사용

### npm vs 플러그인 배포 범위

- **npm 패키지** (`package.json`의 `files`): `dist/`, `README.md`, `LICENSE`만 포함. MCP 서버 바이너리 배포 용도.
- **플러그인 마켓플레이스**: 레포 전체를 참조하므로 `skills/`, `agents/`, `hooks/`, `.claude-plugin/` 등 플러그인 파일 포함.
- 이 분리는 **의도적**이다. npm 사용자는 MCP 서버만 필요하고, 플러그인 사용자는 마켓플레이스를 통해 전체 구조를 받는다.

## 구현 우선순위

1. MCP 서버 개선 (A~C) — 코드 품질 기반
2. 리네이밍 (jandi-mcp → cc-jandi)
3. 플러그인 구조 추가 (plugin.json, .mcp.json)
4. Skills 구현 (notify, alert, deploy-notify, daily-report)
5. Agents 구현 (notification-composer, webhook-debugger)
6. Hooks 기본 구조
7. README/CLAUDE.md 업데이트
