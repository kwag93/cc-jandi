# cc-jandi 플러그인 전환 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** jandi-mcp MCP 서버를 cc-jandi Claude Code 플러그인으로 전환하고, MCP 서버 코드 품질을 개선한다.

**Architecture:** 기존 MCP 서버(src/)는 그대로 유지하면서 플러그인 구조(.claude-plugin/, skills/, agents/, hooks/, .mcp.json)를 루트에 추가한다. npm 배포(MCP 서버)와 플러그인 마켓플레이스 배포를 동시에 지원한다.

**Tech Stack:** TypeScript, mcp-framework, Claude Code Plugin System (plugin.json, SKILL.md, agents/*.md)

**Spec:** `docs/superpowers/specs/2026-03-25-cc-jandi-plugin-design.md`

---

## File Map

### 신규 생성

| 파일 | 역할 |
|------|------|
| `.claude-plugin/plugin.json` | 플러그인 매니페스트 |
| `.mcp.json` | MCP 서버 번들링 설정 |
| `skills/notify/SKILL.md` | 빠른 채널 알림 skill |
| `skills/alert/SKILL.md` | 심각도별 알림 skill |
| `skills/deploy-notify/SKILL.md` | 배포 알림 skill |
| `skills/daily-report/SKILL.md` | 일일 리포트 skill |
| `agents/notification-composer.md` | 리치 메시지 작성 에이전트 |
| `agents/webhook-debugger.md` | 웹훅 진단 에이전트 |
| `hooks/hooks.json` | Hooks 기본 구조 |
| `src/utils/validateColor.ts` | 공용 색상 검증 유틸 |

### 수정

| 파일 | 변경 내용 |
|------|----------|
| `package.json` | name, bin, homepage, repository, description 리네이밍 |
| `src/services/base/BaseWebhookService.ts` | rate limit 재시도 로직 추가 |
| `src/types/common.ts` | `ToolResult<T>` 인터페이스 추가 |
| `src/utils/index.ts` | validateColor re-export 추가 |
| `src/tools/incoming/SendRichMessageTool.ts` | 공용 색상 검증 사용, ToolResult 반환 |
| `src/tools/incoming/SendMessageTool.ts` | ToolResult 반환 |
| `src/tools/incoming/ValidateTokenTool.ts` | ToolResult 반환 |
| `src/tools/incoming/TestWebhookTool.ts` | ToolResult 반환 |
| `src/tools/team-incoming/SendTeamRichMessageTool.ts` | 공용 색상 검증 사용, ToolResult 반환 |
| `src/tools/team-incoming/SendTeamMessageTool.ts` | ToolResult 반환 |
| `src/tools/team-incoming/ValidateTeamTokenTool.ts` | ToolResult 반환 |
| `src/tools/outgoing/ValidateOutgoingResponseTool.ts` | 공용 색상 검증 사용, ToolResult 반환 |
| `src/tools/outgoing/SimulateOutgoingPayloadTool.ts` | ToolResult 반환 |
| `src/tools/outgoing/GenerateOutgoingHandlerTool.ts` | ToolResult 반환 |
| `src/tools/GenerateWebhookScriptTool.ts` | ToolResult 반환 |
| `README.md` | 프로젝트명, 설치 방법, 플러그인 안내 업데이트 |
| `CLAUDE.md` | 플러그인 구조 반영, 프로젝트명 업데이트 |
| `CHANGELOG.md` | v1.0.0 엔트리 추가 |

---

## Task 1: 색상 검증 유틸 추출 (개선 B)

**Files:**
- Create: `src/utils/validateColor.ts`
- Modify: `src/utils/index.ts`

- [ ] **Step 1: `src/utils/validateColor.ts` 생성**

```typescript
export interface ColorValidationResult {
  valid: boolean;
  normalized?: string;
  error?: string;
}

export function validateHexColor(color: string): ColorValidationResult {
  if (!color.match(/^#[0-9A-Fa-f]{6}$/)) {
    return {
      valid: false,
      error: "Invalid color format. Color should be a hex color code (e.g., '#FF0000')"
    };
  }
  return { valid: true, normalized: color.toUpperCase() };
}
```

- [ ] **Step 2: `src/utils/index.ts`에 re-export 추가**

기존 export에 `validateColor.ts` 추가:

```typescript
export { validateHexColor, type ColorValidationResult } from './validateColor.js';
```

- [ ] **Step 3: `SendRichMessageTool.ts` 인라인 검증을 공용 유틸로 교체**

`src/tools/incoming/SendRichMessageTool.ts:57` — 기존:

```typescript
if (input.color && !input.color.match(/^#[0-9A-F]{6}$/i)) {
  return {
    success: false,
    error: "Invalid color format. Color should be a hex color code (e.g., '#FF0000')"
  };
}
```

변경:

```typescript
import { validateHexColor } from "../../utils/validateColor.js";
// ...
if (input.color) {
  const colorResult = validateHexColor(input.color);
  if (!colorResult.valid) {
    return { success: false, error: colorResult.error };
  }
}
```

- [ ] **Step 4: `SendTeamRichMessageTool.ts` 동일 교체**

`src/tools/team-incoming/SendTeamRichMessageTool.ts:67` — 동일 패턴 적용.

- [ ] **Step 5: `ValidateOutgoingResponseTool.ts` 동일 교체**

`src/tools/outgoing/ValidateOutgoingResponseTool.ts:52` — 기존:

```typescript
if (!input.connectColor.match(/^#[0-9A-F]{6}$/i)) {
  issues.push("connectColor must be a valid hex color code (e.g., '#FF0000')");
}
```

변경 — 외부 `if (input.connectColor)` 가드는 이미 존재하므로 내부만 교체. 에러 메시지에 필드명 `connectColor`를 유지한다:

```typescript
import { validateHexColor } from "../../utils/validateColor.js";
// ... (기존 if (input.connectColor) { 블록 내부)
const colorResult = validateHexColor(input.connectColor);
if (!colorResult.valid) {
  issues.push(`connectColor: ${colorResult.error!}`);
}
```

- [ ] **Step 6: 빌드 확인**

Run: `npm run build`
Expected: 성공, 에러 없음

- [ ] **Step 7: 커밋**

```bash
git add src/utils/validateColor.ts src/utils/index.ts src/tools/incoming/SendRichMessageTool.ts src/tools/team-incoming/SendTeamRichMessageTool.ts src/tools/outgoing/ValidateOutgoingResponseTool.ts
git commit -m "refactor: 색상 검증 로직을 공용 유틸로 추출"
```

---

## Task 2: Rate limit 재시도 (개선 A)

**Files:**
- Modify: `src/services/base/BaseWebhookService.ts`

- [ ] **Step 1: `sendRequest()`에 재시도 로직 추가**

`src/services/base/BaseWebhookService.ts:61-94` — `sendRequest()` 메서드를 수정. 기존 `sendRequest`를 `sendRequestOnce`로 추출하고, `sendRequest`에서 재시도 루프를 감싼다.

```typescript
private static readonly MAX_RETRIES = 3;
private static readonly RETRY_DELAYS = [1000, 2000, 4000]; // ms

private static sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

protected static async sendRequest<TMessage extends BaseJandiMessage, TResponse extends BaseJandiResponse>(
  url: string,
  message: TMessage
): Promise<TResponse> {
  const validation = this.validateMessageLimits(message);
  if (!validation.valid) {
    return { success: false, error: validation.error! } as TResponse;
  }

  let lastResult: TResponse | undefined;

  for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await this.sleep(this.RETRY_DELAYS[attempt - 1]);
    }

    try {
      await axios.post(url, message, {
        headers: this.HEADERS,
        timeout: this.REQUEST_TIMEOUT
      });

      return { success: true, message: 'Message sent successfully' } as TResponse;
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorInfo = this.handleJandiError(axiosError);

      lastResult = {
        success: false,
        error: errorInfo.error,
        errorCode: errorInfo.errorCode,
        rateLimited: errorInfo.rateLimited
      } as TResponse;

      if (!errorInfo.rateLimited) {
        return lastResult;
      }
    }
  }

  return lastResult!;
}
```

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`
Expected: 성공

- [ ] **Step 3: 커밋**

```bash
git add src/services/base/BaseWebhookService.ts
git commit -m "feat: rate limit 에러 시 지수 백오프 재시도 추가"
```

---

## Task 3: ToolResult 타입 추가 및 에러 응답 통일 (개선 C)

**Files:**
- Modify: `src/types/common.ts`
- Modify: 모든 도구 파일 11개 (execute 반환값 변경)

- [ ] **Step 1: `src/types/common.ts`에 `ToolResult` 추가**

파일 하단에 추가:

```typescript
export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: number;
}
```

- [ ] **Step 2: `src/types/index.ts`에 `ToolResult` re-export 추가 (필수)**

`src/types/index.ts`는 named export를 사용하므로 `ToolResult`를 명시적으로 추가해야 한다:

```typescript
export {
  JandiConnectInfo,
  BaseJandiMessage,
  BaseJandiResponse,
  BaseWebhookConfig,
  WebhookType,
  JandiColors,
  MessageType,
  ScriptTemplate,
  ToolResult,  // 추가
} from './common.js';
```

- [ ] **Step 3: `SendMessageTool` 반환값 ToolResult 패턴 적용**

> **Breaking Change 주의**: 기존 MCP 클라이언트는 `result.message`, `result.tokenUsed` 등을 최상위에서 참조했다. 이제 `result.data.message`, `result.data.tokenUsed`로 변경된다. v1.0.0 메이저 버전 범프로 이를 명시한다.

`src/tools/incoming/SendMessageTool.ts` — execute 반환값 변경:

```typescript
// 성공 시
return {
  success: true,
  data: {
    message: "Message sent successfully to Jandi",
    tokenUsed: resolved.config.alias || 'direct'
  }
};

// 실패 시
return { success: false, error: resolved.error };
```

- [ ] **Step 4: 나머지 10개 도구에 동일 패턴 적용**

모든 도구의 `execute()` 반환값을 `{ success, data?, error?, errorCode? }` 형태로 통일:
- `SendRichMessageTool` — `tokenUsed`, `messageDetails`를 `data`에 포함
- `ValidateTokenTool` — `tokenFormat`, 검증 결과를 `data`에 포함
- `TestWebhookTool` — `results`, `summary`를 `data`에 포함
- `SendTeamMessageTool` — `recipients`, `tokenUsed`를 `data`에 포함
- `SendTeamRichMessageTool` — `recipients`, `messageDetails`를 `data`에 포함
- `ValidateTeamTokenTool` — 검증 결과를 `data`에 포함
- `SimulateOutgoingPayloadTool` — `payload`, `curlCommand`를 `data`에 포함
- `GenerateOutgoingHandlerTool` — `script`, `fileName`을 `data`에 포함
- `ValidateOutgoingResponseTool` — `valid`, `issues`, `stats`를 `data`에 포함
- `GenerateWebhookScriptTool` — `script`, `language`를 `data`에 포함

- [ ] **Step 5: 빌드 확인**

Run: `npm run build`
Expected: 성공

- [ ] **Step 6: 커밋**

```bash
git add src/types/common.ts src/tools/
git commit -m "refactor: 모든 도구의 반환값을 ToolResult 형태로 통일"
```

---

## Task 4: 리네이밍 (jandi-mcp → cc-jandi)

**Files:**
- Modify: `package.json`

- [ ] **Step 1: `package.json` 수정**

변경 항목:
- `name`: `"jandi-mcp"` → `"cc-jandi"`
- `description`: 플러그인 언급 추가
- `homepage`: `jandi-mcp` → `cc-jandi`
- `repository.url`: `jandi-mcp` → `cc-jandi`
- `bugs.url`: `jandi-mcp` → `cc-jandi`
- `bin`: `"jandi-mcp"` → `"cc-jandi"`
- `keywords`: `"plugin"`, `"claude-code"` 추가
- `version`: `"0.2.0"` → `"1.0.0"`

변경하는 필드만 표시 (기존 `type`, `files`, `scripts`, `dependencies`, `devDependencies`, `engines` 등은 유지):

```json
{
  "name": "cc-jandi",
  "version": "1.0.0",
  "description": "잔디(Jandi) 팀 협업 도구용 MCP 서버 & Claude Code 플러그인 - 웹훅 메시지 전송, 알림 자동화, 스크립트 생성",
  "homepage": "https://github.com/kwag93/cc-jandi#readme",
  "repository": {
    "type": "git",
    "url": "https://github.com/kwag93/cc-jandi.git"
  },
  "bugs": {
    "url": "https://github.com/kwag93/cc-jandi/issues"
  },
  "keywords": [
    "jandi", "mcp", "webhook", "korean", "collaboration",
    "team", "messaging", "automation", "claude", "plugin", "claude-code"
  ],
  "bin": {
    "cc-jandi": "./dist/index.js"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ]
}
```

> **주의**: `files` 필드를 반드시 유지할 것. npm 배포에는 MCP 서버(dist/)만 포함하고, 플러그인 파일(skills/, agents/ 등)은 마켓플레이스를 통해 배포한다.

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`
Expected: 성공

- [ ] **Step 3: 커밋**

```bash
git add package.json
git commit -m "chore: jandi-mcp → cc-jandi 리네이밍"
```

---

## Task 5: 플러그인 구조 추가

**Files:**
- Create: `.claude-plugin/plugin.json`
- Create: `.mcp.json`
- Create: `hooks/hooks.json`

- [ ] **Step 1: `.claude-plugin/plugin.json` 생성**

```json
{
  "name": "cc-jandi",
  "description": "잔디(Jandi) 웹훅 메시지 전송, 알림 자동화를 위한 Claude Code 플러그인",
  "version": "1.0.0",
  "author": {
    "name": "kwag93"
  },
  "homepage": "https://github.com/kwag93/cc-jandi",
  "repository": "https://github.com/kwag93/cc-jandi",
  "license": "MIT",
  "keywords": ["jandi", "webhook", "notification", "korean", "collaboration"]
}
```

- [ ] **Step 2: `.mcp.json` 생성**

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

- [ ] **Step 3: `hooks/hooks.json` 생성**

```json
{
  "hooks": {}
}
```

- [ ] **Step 4: `--plugin-dir`로 로컬 테스트**

Run: `claude --plugin-dir .`
확인:
- 플러그인이 로드되는지
- `${CLAUDE_PLUGIN_ROOT}`가 올바르게 주입되는지
- MCP 서버 도구들이 등록되는지

> **`${CLAUDE_PLUGIN_ROOT}` 미주입 시 대비**: 만약 변수가 주입되지 않아 MCP 서버가 시작 실패하면, `.mcp.json`을 `npx cc-jandi` 방식으로 변경한다:
> ```json
> { "mcpServers": { "cc-jandi": { "command": "npx", "args": ["cc-jandi"] } } }
> ```

- [ ] **Step 5: 커밋**

```bash
git add .claude-plugin/plugin.json .mcp.json hooks/hooks.json
git commit -m "feat: Claude Code 플러그인 구조 추가"
```

---

## Task 6: Skills 구현

**Files:**
- Create: `skills/notify/SKILL.md`
- Create: `skills/alert/SKILL.md`
- Create: `skills/deploy-notify/SKILL.md`
- Create: `skills/daily-report/SKILL.md`

- [ ] **Step 1: `skills/notify/SKILL.md` 생성**

```markdown
---
description: 잔디 채널에 빠른 알림 메시지를 전송합니다. 잔디에 메시지를 보내거나 알림을 전송할 때 사용합니다.
---

# 잔디 알림 전송

"$ARGUMENTS"를 메시지로 사용하여 잔디 채널에 전송합니다.

## 동작

1. `send_message` 도구를 호출하여 "$ARGUMENTS" 내용을 잔디 채널에 전송
2. tokenAlias가 필요하면 사용자에게 확인 후 지정

## 예시

- `/cc-jandi:notify 서버 점검 완료` → "서버 점검 완료" 메시지 전송
- `/cc-jandi:notify 배포 성공!` → "배포 성공!" 메시지 전송
```

- [ ] **Step 2: `skills/alert/SKILL.md` 생성**

```markdown
---
description: 심각도(info/success/warning/error)에 따라 색상 코딩된 알림을 잔디 채널에 전송합니다. 에러, 경고 등 심각도가 있는 알림에 사용합니다.
---

# 잔디 심각도별 알림

"$ARGUMENTS"에서 첫 단어를 심각도로, 나머지를 메시지로 파싱하여 색상 코딩된 리치 메시지를 전송합니다.

## 심각도별 색상

| 심각도 | 색상 | Hex |
|--------|------|-----|
| info | 파랑 | #4A90D9 |
| success | 초록 | #2ECC71 |
| warning | 주황 | #F39C12 |
| error | 빨강 | #E74C3C |

## 동작

1. "$ARGUMENTS"의 첫 단어(info/success/warning/error)를 심각도로 파싱
2. 나머지 텍스트를 메시지 본문으로 사용
3. `send_rich_message` 도구를 호출하여 색상 코딩된 메시지 전송
4. 심각도가 지정되지 않으면 기본값 info 사용

## 예시

- `/cc-jandi:alert error DB 연결 실패` → 빨간색 "DB 연결 실패"
- `/cc-jandi:alert success 배포 완료` → 초록색 "배포 완료"
- `/cc-jandi:alert warning 디스크 80% 사용` → 주황색 "디스크 80% 사용"
```

- [ ] **Step 3: `skills/deploy-notify/SKILL.md` 생성**

```markdown
---
description: 현재 git 상태(브랜치, 최근 커밋, 변경 파일)를 자동 수집하여 배포 결과 알림을 잔디 채널에 전송합니다. 배포 후 알림에 사용합니다.
---

# 잔디 배포 알림

git 정보를 자동 수집하여 배포 결과를 잔디 채널에 리치 메시지로 전송합니다.

## 동작

1. Bash로 git 정보 수집:
   - `git rev-parse --abbrev-ref HEAD` → 브랜치명
   - `git log -1 --format="%h %s"` → 최근 커밋
   - `git diff --stat HEAD~1` → 변경 파일
2. "$ARGUMENTS"를 추가 메시지(환경명 등)로 사용
3. `send_rich_message` 도구를 호출:
   - body: "$ARGUMENTS" 또는 "배포 완료"
   - color: #2ECC71 (success 초록)
   - connectInfo에 git 정보 첨부:
     - title: "Git 정보"
     - description: 브랜치, 커밋 해시, 변경 파일 수

## 예시

- `/cc-jandi:deploy-notify production 배포 완료`
- `/cc-jandi:deploy-notify staging 핫픽스 적용`
```

- [ ] **Step 4: `skills/daily-report/SKILL.md` 생성**

```markdown
---
description: 오늘의 git 활동(커밋 수, 변경 파일)을 요약하여 잔디 채널에 일일 리포트를 전송합니다. 일일 업무 보고에 사용합니다.
---

# 잔디 일일 리포트

오늘의 git 활동을 요약하여 잔디 채널에 리포트를 전송합니다.

## 동작

1. Bash로 오늘의 git 활동 수집:
   - `git log --since="00:00" --oneline` → 오늘 커밋 목록
   - `git log --since="00:00" --format="" --name-only | sort -u` → 변경 파일 목록
2. `send_rich_message` 도구를 호출:
   - body: "📋 일일 리포트 - {날짜}"
   - color: #4A90D9 (info 파랑)
   - connectInfo:
     - title: "오늘의 커밋 ({N}건)"
     - description: 커밋 목록 요약

## 예시

- `/cc-jandi:daily-report` → 오늘의 활동 요약 전송
```

- [ ] **Step 5: `--plugin-dir`로 Skills 테스트**

Run: `claude --plugin-dir .`
확인: `/cc-jandi:notify test` 입력 시 skill이 인식되는지

- [ ] **Step 6: 커밋**

```bash
git add skills/
git commit -m "feat: Skills 4종 구현 (notify, alert, deploy-notify, daily-report)"
```

---

## Task 7: Agents 구현

**Files:**
- Create: `agents/notification-composer.md`
- Create: `agents/webhook-debugger.md`

- [ ] **Step 1: `agents/notification-composer.md` 생성**

```markdown
---
name: notification-composer
description: 잔디에 알림을 보내고 싶을 때 사용합니다. 리치 메시지 구성(색상, 첨부, 이미지)을 도와주고, 채널 메시지와 개인 메시지를 구분하여 적절한 도구를 선택합니다.
---

# 잔디 알림 작성 에이전트

사용자가 잔디에 메시지를 보내고 싶을 때 도와주는 에이전트입니다.

## 역할

1. **메시지 유형 확인**: 채널 메시지(Incoming Webhook)인지, 개인 메시지(Team Incoming Webhook)인지 사용자에게 확인
2. **토큰 선택**: 사용할 tokenAlias를 사용자에게 확인 (기본값 사용 가능)
3. **메시지 구성 도움**:
   - 기본 텍스트 메시지 → `send_message` 또는 `send_team_message`
   - 리치 메시지가 필요하면 → `send_rich_message` 또는 `send_team_rich_message`
4. **리치 메시지 옵션 안내**:
   - 색상: `#FF0000`(빨강), `#2ECC71`(초록), `#F39C12`(주황), `#4A90D9`(파랑), `#FAC11B`(기본)
   - connectInfo: title, description, imageUrl 구성
5. **전송 전 확인**: 구성된 메시지 내용을 사용자에게 보여주고 확인 후 전송

## 사용 도구

- `send_message` — 채널에 기본 메시지
- `send_rich_message` — 채널에 리치 메시지
- `send_team_message` — 개인에게 기본 메시지
- `send_team_rich_message` — 개인에게 리치 메시지

## 응답 형식

도구 응답은 `{ success, data?, error? }` 형태입니다:
- 성공 시: `data`에 `tokenUsed`, `messageDetails` 등 포함
- 실패 시: `error`에 에러 메시지 포함
```

- [ ] **Step 2: `agents/webhook-debugger.md` 생성**

```markdown
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
```

- [ ] **Step 3: 커밋**

```bash
git add agents/
git commit -m "feat: Agents 2종 구현 (notification-composer, webhook-debugger)"
```

---

## Task 8: README 및 CLAUDE.md 업데이트

**Files:**
- Modify: `README.md`
- Modify: `CLAUDE.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: `README.md` 업데이트**

주요 변경:
- 프로젝트명: jandi-mcp → cc-jandi
- 설치 방법: npm(`npx cc-jandi`) + 플러그인(`/plugin install cc-jandi`) 두 가지
- Skills 목록 및 사용법 추가
- Agents 소개 추가
- Claude Desktop 설정 예시에서 bin 이름 변경

- [ ] **Step 2: `CLAUDE.md` 업데이트**

주요 변경:
- Project Overview에 플러그인 내용 추가
- 디렉토리 구조에 skills/, agents/, hooks/, .claude-plugin/ 추가
- 리네이밍 반영 (jandi-mcp → cc-jandi 전체)
- ToolResult 타입 설명 추가
- validateColor 유틸 설명 추가

- [ ] **Step 3: `CHANGELOG.md` 업데이트**

```markdown
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
```

- [ ] **Step 4: 빌드 최종 확인**

Run: `npm run build`
Expected: 성공

- [ ] **Step 5: 커밋**

```bash
git add README.md CLAUDE.md CHANGELOG.md
git commit -m "docs: cc-jandi v1.0.0 문서 업데이트"
```

---

## Task 9: GitHub 레포 리네이밍

- [ ] **Step 1: GitHub 레포명 변경**

```bash
gh repo rename cc-jandi
```

- [ ] **Step 2: 로컬 remote URL 업데이트**

```bash
git remote set-url origin https://github.com/kwag93/cc-jandi.git
```

- [ ] **Step 3: 브랜치 push 및 MR 생성**

```bash
git push -u origin feat/cc-jandi-plugin-conversion
```

MR 생성은 사용자에게 확인 후 진행.
