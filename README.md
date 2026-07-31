# cc-jandi

[![npm version](https://badge.fury.io/js/cc-jandi.svg)](https://badge.fury.io/js/cc-jandi)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

잔디(JANDI) 웹훅을 위한 **Claude Code 플러그인 & MCP 서버**입니다.

Claude Code에 플러그인으로 설치하면 `/cc-jandi:notify` 같은 슬래시 커맨드와 진단 에이전트까지 함께 쓸 수 있고, Claude Desktop·Cursor·VS Code 등 MCP 클라이언트에서는 **"잔디에 메시지 보내줘"** 한마디로 동작합니다.

## 지원하는 웹훅 타입

| 타입 | 방향 | 용도 |
|------|------|------|
| **Incoming Webhook** | 서버 → 잔디 채널 | 채널에 메시지 보내기 |
| **Team Incoming Webhook** | 서버 → 특정 사용자 | 이메일로 지정한 사람에게 개인 메시지 보내기 |
| **Outgoing Webhook** | 잔디 → 외부 서버 | 잔디에서 키워드 입력 시 외부 서버 호출 |
| **Team Outgoing Webhook** | 잔디 → 외부 서버 | 위와 동일, 작성자 상세 정보 포함 |

> Outgoing / Team Outgoing 도구는 핸들러 서버 개발을 돕는 헬퍼입니다. 실제 메시지 수신은 별도 서버가 필요합니다.

---

## 1단계: 잔디에서 웹훅 토큰 발급

1. 잔디 앱에서 메시지를 보낼 토픽으로 이동
2. 토픽 상단의 **플러그 아이콘**(잔디 커넥트) 클릭 → **연동 항목 추가하기**
3. **Webhook 수신 (Incoming Webhook)** 선택 후 이름을 정하고 추가
4. 생성된 Webhook URL을 복사

**토큰은 `/connect-api/webhook/` 뒤의 전체 경로입니다. 두 세그먼트를 모두 포함해야 합니다.**

```text
https://wh.jandi.com/connect-api/webhook/12345678/abcdef0123456789abcdef0123456789
                                         └──────────── 여기부터 끝까지가 토큰 ────────────┘
```

뒷부분만 넣으면 잔디 게이트웨이가 **403 Forbidden**으로 거절합니다.

---

## 2단계: 설치

### Claude Code 플러그인 (권장)

Skills와 Agents가 함께 설치되고, 토큰은 입력창에서 받아 시스템 키체인에 안전하게 보관합니다.

```bash
/plugin marketplace add kwag93/cc-jandi
/plugin install cc-jandi@kwag93-jandi
```

설치 시 토큰을 물어봅니다. Incoming 토큰만 넣으면 채널 메시지를 바로 쓸 수 있고, 팀 ID와 팀 토큰은 개인 메시지가 필요할 때만 채우면 됩니다.

나중에 값을 바꾸려면 `/plugin`에서 **cc-jandi**를 찾아 다시 입력하세요.

### Claude Desktop

`claude_desktop_config.json`에 추가합니다.

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "cc-jandi": {
      "command": "npx",
      "args": ["cc-jandi"],
      "env": {
        "JANDI_TOKEN": "12345678/abcdef0123456789abcdef0123456789"
      }
    }
  }
}
```

재시작한 뒤 대화창에 입력하면 됩니다.

```text
잔디에 "배포 완료!" 메시지 보내줘
```

---

## Skills

플러그인으로 설치하면 쓸 수 있는 슬래시 커맨드입니다. Claude가 문맥에 맞춰 알아서 부르기도 합니다.

| 커맨드 | 설명 |
|--------|------|
| `/cc-jandi:notify [메시지]` | 채널에 텍스트 알림 |
| `/cc-jandi:alert [심각도] [메시지]` | 심각도별 색상 알림 (info/success/warning/error) |
| `/cc-jandi:deploy-notify [환경]` | git 브랜치·커밋을 붙인 배포 알림 |
| `/cc-jandi:daily-report [메모]` | 오늘의 git 활동 요약 리포트 |

## Agents

| 에이전트 | 설명 |
|----------|------|
| `cc-jandi:notification-composer` | 리치 메시지 구성과 수신 대상 선택을 돕습니다 |
| `cc-jandi:webhook-debugger` | 웹훅이 안 될 때 토큰·경로·연결을 차례로 진단합니다 |

---

## 사용 예시

| 하고 싶은 것 | 이렇게 말하면 됩니다 |
|-------------|---------------------|
| 기본 메시지 | "잔디에 빌드 완료 메시지 보내줘" |
| 색상 + 상세정보 | "잔디에 빨간색으로 서버 경고 보내줘. 제목은 CPU, 설명은 80% 초과" |
| 특정 채널 | "dev 채널 잔디에 테스트 결과 보내줘" (토큰 별칭 사용) |
| 개인 메시지 | "hong@company.com 에게 잔디 메시지 보내줘" (팀 웹훅 필요) |
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
| `validate_token` | 웹훅 토큰 유효성 확인 (검증용 메시지가 실제로 발송됩니다) |
| `test_webhook` | 웹훅 연결 종합 테스트 (테스트 메시지가 실제로 발송됩니다) |

### 개인 메시지 (Team Incoming Webhook)

| 도구명 | 설명 |
|--------|------|
| `send_team_message` | 이메일로 지정한 사용자에게 메시지 전송 (최대 100명) |
| `send_team_rich_message` | 특정 사용자에게 리치 메시지 전송 |
| `validate_team_token` | 팀 웹훅 토큰 유효성 확인 (메시지를 보내지 않습니다) |

### 아웃고잉 웹훅 개발 헬퍼

| 도구명 | 설명 |
|--------|------|
| `simulate_outgoing_payload` | 테스트용 페이로드 JSON 생성 (`outgoing` / `team-outgoing`) |
| `generate_outgoing_handler` | 핸들러 서버 코드 생성 (Express, FastAPI, Flask) |
| `validate_outgoing_response` | 응답 포맷이 잔디 규격에 맞는지 검증 |

### 공통

| 도구명 | 설명 |
|--------|------|
| `generate_webhook_script` | Python / Node.js / curl / bash 스크립트 생성 |

---

## 메시지 작성 팁

본문에서 잔디 링크 문법을 쓸 수 있습니다.

```text
[[릴리즈 노트]](https://example.com/releases/v1.2.0) 배포가 완료되었습니다.
```

리치 메시지는 본문 아래에 색상 바와 말풍선 구획이 붙습니다.

```json
{
  "body": "[[PizzaHouse]](http://url_to_text) You have a new Pizza order.",
  "connectColor": "#FAC11B",
  "connectInfo": [
    { "title": "Topping", "description": "Pepperoni" },
    { "title": "Location", "description": "Empire State Building", "imageUrl": "https://..." }
  ]
}
```

---

## 토큰 설정

### 플러그인으로 설치한 경우

`/plugin` 화면에서 입력합니다. 민감 값은 macOS 키체인(또는 `~/.claude/.credentials.json`)에 저장되고 설정 파일에 평문으로 남지 않습니다.

| 항목 | 용도 |
|------|------|
| Incoming Webhook 토큰 | 채널 메시지 (필수는 아니지만 없으면 채널 전송 불가) |
| Team Webhook 팀 ID | 개인 메시지용, 선택 |
| Team Webhook 토큰 | 개인 메시지용, 선택 |

### 환경 변수로 설정하는 경우

채널별로 별칭을 붙이면 도구에서 `tokenAlias`로 골라 쓸 수 있습니다.

```json
{
  "env": {
    "JANDI_TOKEN": "기본_토큰",
    "JANDI_TOKEN_DEV": "개발채널_토큰",
    "JANDI_TOKEN_DEPLOY": "배포채널_토큰"
  }
}
```

팀 웹훅은 `TEAM_ID`와 `TEAM_TOKEN`이 한 쌍이고 별칭이 같아야 매칭됩니다.

```json
{
  "env": {
    "JANDI_TEAM_ID_SALES": "팀_ID",
    "JANDI_TEAM_TOKEN_SALES": "팀_토큰"
  }
}
```

<details>
<summary>전체 환경 변수 목록</summary>

| 환경 변수 | 용도 | 비고 |
|-----------|------|------|
| `JANDI_TOKEN` | 기본 Incoming 웹훅 토큰 | 채널 메시지에 필요 |
| `JANDI_TOKEN_{별칭}` | 채널별 Incoming 토큰 | 선택 |
| `JANDI_URL_{별칭}` | 채널별 커스텀 URL | 선택, 기본: `wh.jandi.com` |
| `JANDI_TEAM_ID_{별칭}` | Team Incoming 팀 ID | 반드시 TOKEN과 쌍으로 |
| `JANDI_TEAM_TOKEN_{별칭}` | Team Incoming 토큰 | 반드시 ID와 쌍으로 |
| `JANDI_TEAM_URL_{별칭}` | Team Incoming 커스텀 URL | 선택 |
| `JANDI_OUTGOING_TOKEN_{별칭}` | Outgoing 검증 토큰 | 핸들러 개발 시 사용 |

별칭은 대소문자를 구분하지 않습니다. 예: `JANDI_TOKEN_dev` = `JANDI_TOKEN_DEV`

</details>

> **Team Incoming Webhook은 유료 팀 전용입니다.** 팀 ID와 웹훅 토큰을 토스랩이 직접 발급하므로, `support@tosslab.com` 또는 잔디 앱의 [1:1 문의하기]로 신청해야 합니다.

---

## 다른 MCP 클라이언트에서 사용

<details>
<summary>Claude Code (MCP 서버로만 등록)</summary>

```bash
claude mcp add cc-jandi -e JANDI_TOKEN=your_token -- npx cc-jandi
```

플러그인으로 설치하면 Skills와 Agents까지 함께 오므로 그쪽을 권합니다.

</details>

<details>
<summary>Cursor</summary>

프로젝트 루트에 `.cursor/mcp.json`을 만듭니다.

```json
{
  "mcpServers": {
    "cc-jandi": {
      "command": "npx",
      "args": ["cc-jandi"],
      "env": { "JANDI_TOKEN": "your_token" }
    }
  }
}
```

</details>

<details>
<summary>VS Code (Copilot)</summary>

프로젝트 루트에 `.vscode/mcp.json`을 만듭니다.

```json
{
  "servers": {
    "cc-jandi": {
      "command": "npx",
      "args": ["cc-jandi"],
      "env": { "JANDI_TOKEN": "your_token" }
    }
  }
}
```

</details>

---

## 응답 형식

모든 도구는 `ToolResult` 형태로 응답합니다.

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
  "error": "Invalid webhook token, or the webhook has been disabled or deleted",
  "errorCode": 40051
}
```

### 에러 코드

잔디 공식 문서는 HTTP 상태만 안내하고 코드 번호는 밝히지 않습니다. 아래는 라이브 엔드포인트로 확인한 값입니다 (2026-07 기준).

| 신호 | 의미 | 조치 |
|------|------|------|
| `40051` | 토큰이 틀렸거나 웹훅이 비활성화·삭제됨 | 잔디 커넥트에서 웹훅 상태와 주소 확인 |
| `40000` | 요청 파라미터 검증 실패 | 응답의 `field` 값을 보고 해당 항목 교정 |
| HTTP 403 | 웹훅 경로를 찾지 못함 | 토큰에 앞 세그먼트가 빠졌는지 확인 |
| `42900` | 요청 제한 초과 | 자동으로 지수 백오프 재시도(최대 3회) 후 실패 시 잠시 대기 |

---

## 제한사항

| 항목 | 제한 |
|------|------|
| 메시지 길이 | 최대 5,000자 |
| 요청 크기 | 최대 256KB |
| 분당 요청 | 60회 |
| 10분당 요청 | 500회 |
| 팀 웹훅 수신자 | 최대 100명 (초과 시 전건 미발송) |

---

## 로컬 개발

```bash
git clone https://github.com/kwag93/cc-jandi.git
cd cc-jandi
npm install
cp .env.example .env   # 토큰 입력
npm run build
```

| 명령어 | 설명 |
|--------|------|
| `npm run build` | TypeScript 컴파일 + mcp-build 패키징 |
| `npm run watch` | 파일 변경 시 자동 컴파일 |
| `npm run start` | 서버 직접 실행 |

플러그인을 로컬에서 시험하려면:

```bash
claude --plugin-dir /path/to/cc-jandi
claude plugin validate /path/to/cc-jandi --strict
```

---

<details>
<summary><strong>에이전트용: 도구 스키마와 개발 가이드</strong></summary>

> 이 섹션은 AI 에이전트가 이 프로젝트를 설정하고 도구를 호출할 수 있도록 작성되었습니다.

### 실행

**필수 조건**: Node.js >= 18.19.0

```bash
JANDI_TOKEN=12345678/abcdef0123456789abcdef0123456789 npx cc-jandi
```

stdio 전송을 사용합니다. MCP 클라이언트가 프로세스를 실행하고 stdin/stdout으로 통신합니다.

### 도구 입력 스키마

`?`는 선택 파라미터입니다.

#### `send_message`
```text
message: string       — 메시지 내용
token?: string        — 웹훅 URL의 '/connect-api/webhook/' 뒤 전체 경로
tokenAlias?: string   — 환경 변수 별칭 (예: "dev", "prod")
```
토큰 해석 순서: `token` → `tokenAlias` → `JANDI_TOKEN`

#### `send_rich_message`
```text
message: string
color?: string        — hex 색상 (예: "#FF0000")
connectInfo?: array   — [{title?, description?, imageUrl?}]
token?: string
tokenAlias?: string
```

#### `validate_token` / `test_webhook`
```text
token?: string
tokenAlias?: string
testType?: "basic"|"rich"|"all"   — test_webhook 전용, 기본 "basic"
```
두 도구 모두 검증을 위해 **실제 메시지를 채널에 발송합니다.**

#### `send_team_message`
```text
email: string         — 수신자 이메일 (쉼표 구분, 최대 100명)
message: string
teamId?: string       — tokenAlias 미사용 시 필수
token?: string        — tokenAlias 미사용 시 필수
tokenAlias?: string   — JANDI_TEAM_ID_{alias} + JANDI_TEAM_TOKEN_{alias} 조회
```

#### `send_team_rich_message`
```text
email: string
message: string
color?: string
connectInfo?: array
teamId?: string
token?: string
tokenAlias?: string
```

#### `validate_team_token`
```text
teamId?: string
token?: string
tokenAlias?: string
```
수신자를 비운 요청으로 토큰만 확인하므로 메시지가 발송되지 않습니다.

#### `simulate_outgoing_payload`
```text
text: string                             — 트리거 메시지 (키워드 포함 전체)
webhookType?: "outgoing"|"team-outgoing" — 기본 "outgoing"
keyword?: string                         — 기본 "test"
teamName?: string
roomName?: string
writerName?: string
writerEmail?: string
```
생성된 페이로드의 `data`에는 키워드를 제외한 본문이 들어갑니다.

#### `generate_outgoing_handler`
```text
framework: "express"|"fastapi"|"flask"
verificationToken?: string
handlerLogic?: string
```

#### `validate_outgoing_response`
```text
body: string           — 필수, 최대 5000자
connectColor?: string
connectInfo?: array
```

#### `generate_webhook_script`
```text
language: "python"|"nodejs"|"curl"|"bash"
token: string
message: string
webhookType?: "incoming"|"team-incoming"   — 기본 "incoming"
color?: string
title?: string
description?: string
imageUrl?: string
teamId?: string          — team-incoming 시 필수
email?: string           — team-incoming 시 필수
```

### 잔디 API 포맷

**Incoming 요청**:
```json
{
  "body": "메시지 본문",
  "connectColor": "#FAC11B",
  "connectInfo": [{ "title": "제목", "description": "설명", "imageUrl": "URL" }]
}
```

**Team Incoming 요청** — `email` 필드가 추가됩니다. 잔디는 명시된 필드 외의 필드가 있으면 무시하거나 에러를 반환합니다.
```json
{
  "email": "user@example.com",
  "body": "메시지 본문"
}
```
응답: `{ "validEmails": [...], "invalidEmails": [...] }`

**Outgoing 페이로드** (잔디 → 핸들러):
```json
{
  "token": "YE1ronbbuoZkq7h3J5KMI4Tn",
  "teamName": "Toss Lab, Inc.",
  "roomName": "Bulletin Board",
  "writerName": "Kevin",
  "writerEmail": "kevin@tosslab.com",
  "text": "/weather How is the weather in New York tomorrow?",
  "data": "How is the weather in New York tomorrow?",
  "keyword": "weather",
  "createdAt": "2017-05-15T11:34:11.266Z",
  "platform": "web",
  "ip": "12.345.67.89"
}
```
Team Outgoing은 `writerName`/`writerEmail` 대신 `writer: {id, name, email, phoneNumber}`를 씁니다. `text`는 키워드를 포함한 전체 메시지, `data`는 키워드를 뺀 나머지 **문자열**입니다.

**필수 HTTP 헤더**:
```text
Accept: application/vnd.tosslab.jandi-v2+json
Content-Type: application/json
```

### 기술 스택

- **런타임**: Node.js >= 18.19.0
- **언어**: TypeScript (ES modules, `.js` 확장자 import 필수)
- **프레임워크**: [mcp-framework](https://github.com/QuantGeekDev/mcp-framework) — `src/tools/` 하위를 재귀 탐색해 도구 자동 등록
- **HTTP**: axios
- **환경변수**: dotenv

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

**규칙**
- `MCPTool<T>` 상속 + `default export` 필수
- import 경로에 `.js` 확장자 필수 (ES modules)
- Incoming 도구는 `resolveIncomingToken()`, Team 도구는 `resolveTeamToken()` 사용
- Outgoing 도구는 토큰 해석이 필요 없습니다 (개발 헬퍼)

</details>

---

## 문의 및 지원

- [GitHub Issues](https://github.com/kwag93/cc-jandi/issues) — 버그 리포트 및 기능 요청
- [잔디 커넥트 문서](https://support.jandi.com/ko/articles/jandi-connect-d63050dd) — 잔디 웹훅 설정 가이드

## 기여하기

1. Fork
2. 브랜치 생성 (`git checkout -b feature/my-feature`)
3. 커밋 (`git commit -m 'feat: 기능 설명'`) — [Angular 컨벤션](https://www.conventionalcommits.org/)을 따릅니다
4. Push (`git push origin feature/my-feature`)
5. Pull Request 생성

## 라이선스

MIT — [LICENSE](LICENSE) 파일 참조
