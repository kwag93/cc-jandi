# cc-jandi

[![npm version](https://badge.fury.io/js/cc-jandi.svg)](https://badge.fury.io/js/cc-jandi)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

잔디(Jandi) 웹훅을 위한 **MCP 서버 & Claude Code 플러그인**입니다.
Claude Desktop, Cursor, VS Code 등 MCP 클라이언트에서 **"잔디에 메시지 보내줘"** 한마디면 동작하고, Claude Code 플러그인으로 설치하면 `/cc-jandi:notify`, `/cc-jandi:alert` 같은 Skills과 Agents까지 사용할 수 있습니다.

## 지원하는 웹훅 타입

| 타입 | 방향 | 용도 |
|------|------|------|
| **Incoming Webhook** | 서버 → 잔디 채널 | 채널에 메시지 보내기 |
| **Team Incoming Webhook** | 서버 → 특정 사용자 | 이메일로 지정한 사람에게 개인 메시지 보내기 |
| **Outgoing Webhook** | 잔디 → 외부 서버 | 잔디에서 키워드 입력 시 외부 서버 호출 |
| **Team Outgoing Webhook** | 잔디 → 외부 서버 | 위와 동일, 작성자 상세 정보(이메일, 전화번호) 포함 |

> Outgoing / Team Outgoing Webhook 도구는 핸들러 서버 개발을 돕는 헬퍼입니다. 실제 메시지 수신은 별도 서버가 필요합니다.

---

## 빠른 시작

### 1단계: 잔디에서 웹훅 토큰 발급

1. 잔디 앱에서 메시지를 보낼 토픽으로 이동
2. 토픽 상단의 **플러그 아이콘** 클릭 → **인커밍 웹훅** 선택
3. 웹훅 이름 입력 후 **커넥트 추가**
4. 생성된 URL에서 토큰 부분 복사

```
https://wh.jandi.com/connect-api/webhook/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
                                         └──────── 이 부분이 토큰 ────────┘
```

### 2단계: MCP 클라이언트에 등록

**Claude Desktop** — `claude_desktop_config.json` 파일을 열어 아래 내용을 추가합니다.

macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "cc-jandi": {
      "command": "npx",
      "args": ["cc-jandi"],
      "env": {
        "JANDI_TOKEN": "발급받은_토큰"
      }
    }
  }
}
```

### Claude Code 플러그인으로 설치

```bash
/plugin install cc-jandi
```

### 3단계: 사용

Claude Desktop을 재시작하고 대화창에 입력하세요.

```
잔디에 "배포 완료!" 메시지 보내줘
```

별도 설치 과정 없이 `npx`가 알아서 처리합니다.

---

## Skills

Claude Code 플러그인에서 사용할 수 있는 슬래시 커맨드입니다.

| 커맨드 | 설명 |
|--------|------|
| `/cc-jandi:notify` | 빠른 채널 알림 |
| `/cc-jandi:alert` | 심각도별 알림 (info/success/warning/error) |
| `/cc-jandi:deploy-notify` | 배포 결과 알림 (git 정보 자동 포함) |
| `/cc-jandi:daily-report` | 일일 작업 리포트 |

---

## Agents

Claude Code 플러그인에서 사용할 수 있는 에이전트입니다.

| 에이전트 | 설명 |
|----------|------|
| `notification-composer` | 리치 메시지 작성 도우미 |
| `webhook-debugger` | 웹훅 연결 진단 |

---

## 사용 예시

| 하고 싶은 것 | 이렇게 말하면 됩니다 |
|-------------|---------------------|
| 기본 메시지 | "잔디에 빌드 완료 메시지 보내줘" |
| 색상 + 상세정보 | "잔디에 빨간색으로 서버 경고 보내줘. 제목은 CPU, 설명은 80% 초과" |
| 특정 채널 | "dev 채널 잔디에 테스트 결과 보내줘" (토큰 별칭 사용) |
| 개인 메시지 | "hong@company.com 에게 잔디 메시지 보내줘" (팀 웹훅 사용) |
| 토큰 확인 | "잔디 토큰 유효한지 확인해줘" |
| 스크립트 생성 | "Python으로 잔디 메시지 보내는 스크립트 만들어줘" |
| 핸들러 생성 | "Express로 잔디 아웃고잉 웹훅 핸들러 만들어줘" |

---

## 도구 목록

### 채널 메시지 (Incoming Webhook)

| 도구명 | 설명 |
|--------|------|
| `send_message` | 채널에 텍스트 메시지 전송 |
| `send_rich_message` | 색상, 제목, 설명, 이미지가 포함된 리치 메시지 전송 |
| `validate_token` | 웹훅 토큰이 유효한지 확인 |
| `test_webhook` | 웹훅 연결 상태 종합 테스트 |

### 개인 메시지 (Team Incoming Webhook)

| 도구명 | 설명 |
|--------|------|
| `send_team_message` | 이메일로 지정한 사용자에게 메시지 전송 (최대 100명) |
| `send_team_rich_message` | 특정 사용자에게 리치 메시지 전송 |
| `validate_team_token` | 팀 웹훅 토큰 유효성 확인 |

### 아웃고잉 웹훅 개발 헬퍼 (Outgoing / Team Outgoing Webhook)

| 도구명 | 설명 |
|--------|------|
| `simulate_outgoing_payload` | 테스트용 페이로드 JSON 생성 (`outgoing` / `team-outgoing` 선택) |
| `generate_outgoing_handler` | 핸들러 서버 코드 생성 (Express, FastAPI, Flask) |
| `validate_outgoing_response` | 응답 포맷이 잔디 규격에 맞는지 검증 |

### 공통

| 도구명 | 설명 |
|--------|------|
| `generate_webhook_script` | Python / Node.js / curl / bash 스크립트 생성 (incoming, team-incoming) |

---

## 토큰 설정

### 기본 — 토큰 1개

```json
{
  "mcpServers": {
    "cc-jandi": {
      "command": "npx",
      "args": ["cc-jandi"],
      "env": {
        "JANDI_TOKEN": "your_token"
      }
    }
  }
}
```

### 채널별 토큰 여러 개

별칭(alias)을 붙여서 여러 채널에 보낼 수 있습니다.
`JANDI_TOKEN_별칭` 형식으로 추가하면 도구에서 `tokenAlias`로 선택합니다.

```json
{
  "mcpServers": {
    "cc-jandi": {
      "command": "npx",
      "args": ["cc-jandi"],
      "env": {
        "JANDI_TOKEN": "기본_토큰",
        "JANDI_TOKEN_DEV": "개발채널_토큰",
        "JANDI_TOKEN_DEPLOY": "배포채널_토큰"
      }
    }
  }
}
```

### 팀 웹훅 — 개인 메시지

팀 웹훅은 `TEAM_ID`와 `TEAM_TOKEN`이 한 쌍입니다. 별칭이 같아야 매칭됩니다.

```json
{
  "env": {
    "JANDI_TEAM_ID_SALES": "팀_ID",
    "JANDI_TEAM_TOKEN_SALES": "팀_토큰"
  }
}
```

### 아웃고잉 웹훅 검증 토큰

```json
{
  "env": {
    "JANDI_OUTGOING_TOKEN_DEPLOY": "검증_토큰"
  }
}
```

<details>
<summary>전체 환경 변수 목록</summary>

| 환경 변수 | 용도 | 비고 |
|-----------|------|------|
| `JANDI_TOKEN` | 기본 Incoming 웹훅 토큰 | Incoming 사용 시 필수 |
| `JANDI_TOKEN_{별칭}` | 채널별 Incoming 토큰 | 선택 |
| `JANDI_URL_{별칭}` | 채널별 커스텀 URL | 선택, 기본: `wh.jandi.com` |
| `JANDI_TEAM_ID_{별칭}` | Team Incoming 팀 ID | 반드시 TOKEN과 쌍으로 |
| `JANDI_TEAM_TOKEN_{별칭}` | Team Incoming 토큰 | 반드시 ID와 쌍으로 |
| `JANDI_TEAM_URL_{별칭}` | Team Incoming 커스텀 URL | 선택 |
| `JANDI_OUTGOING_TOKEN_{별칭}` | Outgoing 검증 토큰 | 핸들러 개발 시 사용 |

별칭은 대소문자 구분 없음 (내부적으로 대문자 변환). 예: `JANDI_TOKEN_dev` = `JANDI_TOKEN_DEV`

</details>

---

## 다른 MCP 클라이언트에서 사용

<details>
<summary>Claude Code (CLI)</summary>

프로젝트 루트에 `.mcp.json` 파일을 만듭니다.

```json
{
  "mcpServers": {
    "cc-jandi": {
      "command": "npx",
      "args": ["cc-jandi"],
      "env": {
        "JANDI_TOKEN": "your_token"
      }
    }
  }
}
```

또는 CLI로 추가:

```bash
claude mcp add cc-jandi -- npx cc-jandi
```

</details>

<details>
<summary>Cursor</summary>

프로젝트 루트에 `.cursor/mcp.json` 파일을 만듭니다.

```json
{
  "mcpServers": {
    "cc-jandi": {
      "command": "npx",
      "args": ["cc-jandi"],
      "env": {
        "JANDI_TOKEN": "your_token"
      }
    }
  }
}
```

</details>

<details>
<summary>VS Code (Copilot)</summary>

프로젝트 루트에 `.vscode/mcp.json` 파일을 만듭니다.

```json
{
  "servers": {
    "cc-jandi": {
      "command": "npx",
      "args": ["cc-jandi"],
      "env": {
        "JANDI_TOKEN": "your_token"
      }
    }
  }
}
```

</details>

---

## CLI 사용법

`npx`로 직접 실행하거나, AI 에이전트가 자동으로 호출할 수 있습니다.

```bash
# 환경 변수와 함께 실행
JANDI_TOKEN=your_token npx cc-jandi

# 또는 .env 파일 사용
echo "JANDI_TOKEN=your_token" > .env
npx cc-jandi
```

**AI 에이전트 연동** — MCP 클라이언트가 stdio로 통신합니다:

```bash
# Claude Code에서 MCP 서버로 등록
claude mcp add cc-jandi -- npx cc-jandi

# 환경 변수 포함 등록
claude mcp add cc-jandi -e JANDI_TOKEN=your_token -- npx cc-jandi
```

**Claude Code 플러그인으로 설치** (Skills/Agents 포함):

```bash
# 마켓플레이스에서 설치
/plugin install cc-jandi

# 로컬 개발 시
claude --plugin-dir /path/to/cc-jandi
```

---

## 응답 형식

모든 도구는 `ToolResult` 형태로 응답합니다:

```json
{
  "success": true,
  "data": {
    "message": "Message sent successfully to Jandi",
    "tokenUsed": "default"
  }
}
```

실패 시:

```json
{
  "success": false,
  "error": "Invalid webhook token format or inactive/deleted webhook",
  "errorCode": 40000
}
```

---

## 제한사항

| 항목 | 제한 |
|------|------|
| 메시지 길이 | 최대 5,000자 |
| 요청 크기 | 최대 256KB |
| 분당 요청 | 60회 |
| 10분당 요청 | 500회 |
| 팀 웹훅 수신자 | 최대 100명 |

속도 제한(42900 에러)에 걸리면 서버가 자동으로 지수 백오프 재시도(최대 3회)를 수행합니다.

---

## 로컬 개발

```bash
git clone https://github.com/kwag93/cc-jandi.git
cd cc-jandi
npm install
cp .env.example .env   # 토큰 입력
npm run build
```

개발 중 Claude Desktop에서 테스트하려면:

```json
{
  "mcpServers": {
    "cc-jandi": {
      "command": "node",
      "args": ["/절대/경로/cc-jandi/dist/index.js"]
    }
  }
}
```

| 명령어 | 설명 |
|--------|------|
| `npm run build` | TypeScript 컴파일 + mcp-build 패키징 |
| `npm run watch` | 파일 변경 시 자동 컴파일 |
| `npm run start` | 서버 직접 실행 |

---

<details>
<summary><strong>에이전트용: 자동 설정 및 개발 가이드</strong></summary>

> 이 섹션은 AI 에이전트가 이 프로젝트를 자동으로 설정하고 도구를 호출할 수 있도록 작성되었습니다.

### MCP 서버 자동 설정

**필수 조건**: Node.js >= 18.19.0, npx 사용 가능

**설치 없이 실행** (npx):
```bash
npx cc-jandi
```

**환경 변수 설정 후 실행**:
```bash
JANDI_TOKEN=your_32char_hex_token npx cc-jandi
```

서버는 stdio 전송을 사용합니다. MCP 클라이언트가 프로세스를 직접 실행하고 stdin/stdout으로 통신합니다.

### 도구 입력 스키마

각 도구의 정확한 파라미터 명세입니다. `?`는 선택 파라미터입니다.

#### `send_message`
```
message: string       — 메시지 내용
token?: string        — 직접 토큰 (32자 hex)
tokenAlias?: string   — 환경 변수 별칭 (예: "dev", "prod")
```
토큰 해석 순서: `token` → `tokenAlias` → `JANDI_TOKEN` (기본값)

#### `send_rich_message`
```
message: string       — 메시지 본문
color?: string        — 색상 hex (예: "#FF0000")
connectInfo?: array   — [{title?, description?, imageUrl?}]
token?: string
tokenAlias?: string
```

#### `validate_token`
```
token?: string
tokenAlias?: string
```

#### `test_webhook`
```
token?: string
tokenAlias?: string
```

#### `send_team_message`
```
email: string         — 수신자 이메일 (쉼표 구분, 최대 100명)
message: string       — 메시지 내용
teamId?: string       — 팀 ID (tokenAlias 미사용 시 필수)
token?: string        — 팀 토큰 (tokenAlias 미사용 시 필수)
tokenAlias?: string   — 팀 토큰 별칭 (예: "sales")
```
팀 토큰 해석: `teamId`+`token` → `tokenAlias`로 `JANDI_TEAM_ID_{alias}` + `JANDI_TEAM_TOKEN_{alias}` 조회

#### `send_team_rich_message`
```
email: string
message: string
color?: string
connectInfo?: array   — [{title?, description?, imageUrl?}]
teamId?: string
token?: string
tokenAlias?: string
```

#### `validate_team_token`
```
teamId?: string
token?: string
tokenAlias?: string
```

#### `simulate_outgoing_payload`
```
text: string                           — 트리거 메시지
webhookType?: "outgoing"|"team-outgoing" — 기본: "outgoing"
keyword?: string                       — 트리거 키워드 (기본: "test")
teamName?: string
roomName?: string
writerName?: string
writerEmail?: string
```

#### `generate_outgoing_handler`
```
framework: "express"|"fastapi"|"flask" — 서버 프레임워크
verificationToken?: string             — 요청 검증 토큰
handlerLogic?: string                  — 커스텀 로직 설명
```

#### `validate_outgoing_response`
```
body: string           — 응답 body (필수, 최대 5000자)
connectColor?: string  — hex 색상
connectInfo?: array    — [{title?, description?, imageUrl?}]
```

#### `generate_webhook_script`
```
language: "python"|"nodejs"|"curl"|"bash"   — 언어
token: string                                — 웹훅 토큰 (필수)
message: string                              — 메시지 내용
webhookType?: "incoming"|"team-incoming"     — 기본: "incoming"
color?: string
title?: string
description?: string
imageUrl?: string
teamId?: string          — team-incoming 시 필수
email?: string           — team-incoming 시 필수
```

### 기술 스택

- **런타임**: Node.js >= 18.19.0
- **언어**: TypeScript (ES modules, `.js` 확장자 import 필수)
- **프레임워크**: [mcp-framework](https://github.com/QuantGeekDev/mcp-framework) — `src/tools/` 하위를 재귀 탐색하여 도구 자동 등록
- **HTTP**: axios
- **환경변수**: dotenv

### 디렉토리 구조

```
src/
├── index.ts                              # 진입점 (ConfigService 초기화 → MCPServer 시작)
├── types/
│   ├── common.ts                         # JandiConnectInfo, JandiColors, BaseWebhookConfig, etc.
│   ├── incoming.ts                       # IncomingWebhookConfig, IncomingMessage
│   ├── team-incoming.ts                  # TeamIncomingWebhookConfig, TeamIncomingMessage
│   ├── outgoing.ts                       # OutgoingWebhookPayload, TeamOutgoingWebhookPayload
│   └── index.ts                          # 모든 타입 re-export
├── services/
│   ├── base/BaseWebhookService.ts        # 추상 베이스 (HTTP, 검증, 에러 핸들링)
│   ├── IncomingWebhookService.ts         # POST wh.jandi.com/connect-api/webhook/{token}
│   ├── TeamIncomingWebhookService.ts     # POST wh.jandi.com/connect-api/team-webhook/{teamId}/{token}
│   ├── configService.ts                  # 환경 변수 → 토큰 Map 관리
│   └── index.ts
├── utils/
│   ├── resolveToken.ts                   # Incoming 토큰 해석 (token → alias → default)
│   ├── resolveTeamToken.ts               # Team 토큰 해석 (teamId+token → alias)
│   ├── validateColor.ts                  # Hex 색상 검증 (#RRGGBB)
│   └── index.ts
└── tools/
    ├── incoming/                          # 4개: send_message, send_rich_message, validate_token, test_webhook
    ├── team-incoming/                     # 3개: send_team_message, send_team_rich_message, validate_team_token
    ├── outgoing/                          # 3개: simulate_outgoing_payload, generate_outgoing_handler, validate_outgoing_response
    └── GenerateWebhookScriptTool.ts      # 1개: generate_webhook_script
```

### 도구 추가 방법

`src/tools/` 하위에 파일을 만들면 자동 등록됩니다.

```typescript
import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { IncomingWebhookService } from "../../services/IncomingWebhookService.js";
import { resolveIncomingToken } from "../../utils/resolveToken.js";
import type { ToolResult } from "../../types/common.js";

interface MyToolInput {
  message: string;
  tokenAlias?: string;
}

class MyTool extends MCPTool<MyToolInput> {
  name = "my_tool";
  description = "도구 설명";

  schema = {
    message: { type: z.string(), description: "메시지 내용" },
    tokenAlias: { type: z.string().optional(), description: "토큰 별칭" },
  };

  async execute(input: MyToolInput): Promise<ToolResult> {
    const resolved = resolveIncomingToken(input);
    if (!resolved.success) return { success: false, error: resolved.error };

    const message = IncomingWebhookService.createBasicMessage(input.message);
    const result = await IncomingWebhookService.sendMessage(resolved.config, message);

    if (result.success) {
      return { success: true, data: { message: "완료", tokenUsed: resolved.config.alias || 'direct' } };
    }
    return { success: false, error: result.error };
  }
}

export default MyTool;
```

**규칙:**
- `MCPTool<T>` 상속 + `default export` 필수
- import 경로에 `.js` 확장자 필수 (ES modules)
- Incoming 도구: `resolveIncomingToken()` 사용
- Team 도구: `resolveTeamToken()` 사용
- Outgoing 도구: 토큰 해석 불필요 (개발 헬퍼)

### 잔디 API 포맷

**요청** (Incoming / Team Incoming):
```json
{
  "body": "메시지 본문",
  "connectColor": "#FAC11B",
  "connectInfo": [{"title": "제목", "description": "설명", "imageUrl": "URL"}]
}
```
Team Incoming은 `"to": "user@example.com"` 필드 추가.

**필수 HTTP 헤더**:
```
Accept: application/vnd.tosslab.jandi-v2+json
Content-Type: application/json
```

**에러 코드**: `40000` = 토큰 무효/비활성, `42900` = 속도 제한 초과

### 빌드

`npm run build` = `tsc` → `mcp-build`. 결과물: `dist/index.js` (진입점)

</details>

---

## 문의 및 지원

- [GitHub Issues](https://github.com/kwag93/cc-jandi/issues) — 버그 리포트 및 기능 요청
- [잔디 커넥트 문서](https://support.jandi.com/ko/categories/%EC%BB%A4%EB%84%A5%ED%8A%B8-fdf97953) — 잔디 웹훅 설정 가이드

## 기여하기

1. Fork
2. 브랜치 생성 (`git checkout -b feature/my-feature`)
3. 커밋 (`git commit -m 'feat: 기능 설명'`)
4. Push (`git push origin feature/my-feature`)
5. Pull Request 생성

## 라이선스

MIT — [LICENSE](LICENSE) 파일 참조
