# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server and Claude Code plugin for Jandi (Korean team collaboration tool) built with mcp-framework. It supports all 4 Jandi webhook types: **Incoming Webhook** (channel messages), **Team Incoming Webhook** (personal messages), **Outgoing Webhook**, and **Team Outgoing Webhook**. The server automatically discovers and loads tools recursively from the `src/tools/` directory. As a Claude Code plugin, it ships skills and agents, and takes its tokens through `userConfig` so users never hand-edit a settings file.

## Common Commands

### Development
```bash
# Install dependencies
npm install

# Build the project (compiles TypeScript and packages with mcp-build)
npm run build

# Watch for changes and auto-compile
npm run watch

# Start the server locally
npm run start
```

### Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your Jandi webhook tokens
# See .env.example for all available configuration options
```

### Testing
```bash
# Test locally using npm link
npm link
cc-jandi

# Test with Claude Desktop by updating claude_desktop_config.json
```

## Architecture

### Directory Structure
```
.claude-plugin/plugin.json      # 플러그인 매니페스트 (userConfig 포함)
.claude-plugin/marketplace.json # 마켓플레이스 매니페스트
skills/                         # Skills (notify, alert, deploy-notify, daily-report)
agents/                         # Agents (notification-composer, webhook-debugger)
scripts/sync-version.mjs        # 릴리즈 시 plugin.json 버전 동기화
.mcp.json                       # MCP 서버 번들링 (${user_config.*} 치환)
src/
  index.ts                          # Server entry point
  types/
    common.ts                       # Shared types: JandiConnectInfo, JandiColors, JandiErrorCodes, BaseWebhookConfig, ToolResult<T>
    incoming.ts                     # IncomingWebhookConfig, IncomingMessage, IncomingResponse
    team-incoming.ts                # TeamIncomingWebhookConfig, TeamIncomingMessage, TeamIncomingResponse
    outgoing.ts                     # OutgoingWebhookPayload, TeamOutgoingWebhookPayload, OutgoingWebhookResponse
    index.ts                        # All type re-exports
  services/
    base/
      BaseWebhookService.ts         # Abstract base: validation, error handling, HTTP, rate limit retry
    IncomingWebhookService.ts        # Incoming Webhook service
    TeamIncomingWebhookService.ts    # Team Incoming Webhook service
    configService.ts                 # Multi-type token management
    index.ts                         # Service re-exports
  utils/
    resolveToken.ts                  # Incoming token resolution (deduplicates tool logic)
    resolveTeamToken.ts              # Team token resolution
    validateColor.ts                 # Hex color validation utility
    index.ts                         # Utility re-exports
  tools/
    incoming/
      SendMessageTool.ts             # send_message - Basic channel message
      SendRichMessageTool.ts         # send_rich_message - Rich channel message
      ValidateTokenTool.ts           # validate_token - Token validation
      TestWebhookTool.ts             # test_webhook - Comprehensive testing
    team-incoming/
      SendTeamMessageTool.ts         # send_team_message - Personal message by email
      SendTeamRichMessageTool.ts     # send_team_rich_message - Rich personal message
      ValidateTeamTokenTool.ts       # validate_team_token - Team token validation
    outgoing/
      SimulateOutgoingPayloadTool.ts # simulate_outgoing_payload - Test payload generation
      GenerateOutgoingHandlerTool.ts # generate_outgoing_handler - Handler server code gen
      ValidateOutgoingResponseTool.ts# validate_outgoing_response - Response format validation
    GenerateWebhookScriptTool.ts     # generate_webhook_script - Multi-type script generation
```

### Key Types

#### ToolResult<T>
Standard response interface for all tool executions:
```typescript
interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
```

### Key Services

#### BaseWebhookService (Abstract)
Common webhook logic shared by all services:
- HTTP headers, request timeout
- Message validation (5000 chars, 256KB limits)
- Jandi-specific error handling (see `JandiErrorCodes`, plus HTTP 403 for an unmatched path)
- Rate limit retry with exponential backoff (max 3 attempts)
- Generic `sendRequest()` method, which merges the success response body into the result
  so Team Incoming's `validEmails` / `invalidEmails` reach the caller

#### IncomingWebhookService
Handles Incoming Webhook (channel messages):
- URL: `https://wh.jandi.com/connect-api/webhook/{token}`, where `token` is the whole path
  Jandi issues after `/webhook/` — normally two segments, `{teamId}/{token}`
- `sendMessage()`, `validateToken()`
- `createBasicMessage()`, `createRichMessage()`, `createStatusMessage()`

#### TeamIncomingWebhookService
Handles Team Incoming Webhook (personal messages):
- URL: `https://wh.jandi.com/connect-api/team-webhook/{teamId}/{token}`
- Email validation (max 100 recipients)
- `sendMessage()`, `validateToken()`

#### ConfigService
Manages webhook tokens across all types:
- **Incoming**: `JANDI_TOKEN`, `JANDI_TOKEN_{alias}`, `JANDI_URL_{alias}`
- **Team Incoming**: `JANDI_TEAM_ID_{alias}` + `JANDI_TEAM_TOKEN_{alias}`, `JANDI_TEAM_URL_{alias}`
- **Outgoing**: `JANDI_OUTGOING_TOKEN_{alias}`

### Key Utilities

#### validateHexColor(color: string): ColorValidationResult
Lives in `utils/validateColor.ts`. Validates 6-digit hex strings (e.g. `#FF0000`) and returns
`{ valid, normalized?, error? }` — not a boolean. Used by rich message tools to check
`connectColor` before sending.

### Available Tools (11)

#### Incoming Webhook Tools
| Tool | Name | Description |
|------|------|-------------|
| SendMessageTool | `send_message` | Send basic text to channel |
| SendRichMessageTool | `send_rich_message` | Send rich message with color/attachments |
| ValidateTokenTool | `validate_token` | Validate webhook token |
| TestWebhookTool | `test_webhook` | Comprehensive webhook testing |

#### Team Incoming Webhook Tools
| Tool | Name | Description |
|------|------|-------------|
| SendTeamMessageTool | `send_team_message` | Send text to specific users by email |
| SendTeamRichMessageTool | `send_team_rich_message` | Send rich message to specific users |
| ValidateTeamTokenTool | `validate_team_token` | Validate team webhook token |

#### Outgoing Webhook Tools (Development Helpers)
| Tool | Name | Description |
|------|------|-------------|
| SimulateOutgoingPayloadTool | `simulate_outgoing_payload` | Generate test payload JSON |
| GenerateOutgoingHandlerTool | `generate_outgoing_handler` | Generate handler server code |
| ValidateOutgoingResponseTool | `validate_outgoing_response` | Validate response format |

#### Common Tools
| Tool | Name | Description |
|------|------|-------------|
| GenerateWebhookScriptTool | `generate_webhook_script` | Generate scripts in Python/Node.js/curl/bash |

### Token Resolution Pattern
All tools use shared token resolution utilities (`utils/resolveToken.ts`, `utils/resolveTeamToken.ts`) to eliminate duplicated token lookup logic. The resolution order:
1. Direct `token` parameter
2. `tokenAlias` lookup from ConfigService
3. Default token fallback (incoming only)

### Tool Development Pattern
All tools follow the same pattern:
1. Extend `MCPTool<InputType>` class
2. Define input interface with TypeScript
3. Set `name` and `description` properties
4. Define `schema` using Zod for input validation
5. Use `resolveIncomingToken()` or `resolveTeamToken()` for token management
6. Use the appropriate webhook service for message sending
7. Implement `execute(input)` method returning `ToolResult`

Example tool structure:
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
  description = "Tool description";

  schema = {
    message: { type: z.string(), description: "Message text" },
    tokenAlias: { type: z.string().optional(), description: "Token alias" },
  };

  async execute(input: MyToolInput): Promise<ToolResult> {
    const resolved = resolveIncomingToken(input);
    if (!resolved.success) return { success: false, error: resolved.error };

    const message = IncomingWebhookService.createBasicMessage(input.message);
    return IncomingWebhookService.sendMessage(resolved.config, message);
  }
}

export default MyTool;
```

## Configuration

Plugin installs collect tokens through `userConfig` in `.claude-plugin/plugin.json`. Claude Code
stores `sensitive` values in the system keychain and substitutes them into `.mcp.json` as
`${user_config.KEY}`, which lands in the same `JANDI_*` env vars the server already reads — so
`ConfigService` needs no plugin-specific branch. An optional key the user leaves blank can arrive
as the unexpanded literal, which `readEnv()` in `configService.ts` filters out.

Running the server directly (`npx cc-jandi`) uses env vars only:

```env
# Incoming Webhook (channel messages)
# The token is the whole path after /connect-api/webhook/, normally two segments.
JANDI_TOKEN=12345678/abcdef0123456789abcdef0123456789
JANDI_TOKEN_DEV=your_dev_token_here
JANDI_URL_DEV=https://custom-url  # optional

# Team Incoming Webhook (personal messages)
JANDI_TEAM_ID_SALES=your_team_id
JANDI_TEAM_TOKEN_SALES=your_team_token
JANDI_TEAM_URL_SALES=https://custom  # optional

# Outgoing Webhook (verification tokens)
JANDI_OUTGOING_TOKEN_DEPLOY=verification_token
```

## Error Handling

`BaseWebhookService` maps Jandi's responses. Jandi's public docs list the HTTP statuses but not
the code numbers, so these were verified against the live endpoint (2026-07):

- **40051**: Invalid token, or the webhook is disabled or deleted
- **40000**: A request parameter failed validation. The body carries `data.errors.path` naming the
  field; never log `data.errors.value`, which can hold the token
- **HTTP 403**: The gateway could not match the path — in practice the token is missing its team id
  segment. Returned as plain HTML, not JSON
- **42900**: Rate limit exceeded (60 req/min, 500 req/10min) — automatic retry with exponential
  backoff (max 3 attempts)
- **Message validation**: 5000 characters max, 256KB data size max

Do not treat `40000` as "bad token": Jandi returns it for a malformed payload too.

## Jandi Webhook Formats

### Incoming / Team Incoming (Request)
```json
{
  "body": "Main message content",
  "connectColor": "#FAC11B",
  "connectInfo": [{
    "title": "Section Title",
    "description": "Section details",
    "imageUrl": "https://example.com/image.png"
  }]
}
```
`body` supports Jandi's link markdown: `[[label]](https://url)`.

Team Incoming targets recipients with **`email`** (comma-separated, max 100; exceeding that drops
every message). It is **not** `to`. Jandi ignores or rejects fields outside the documented set, so
send only `email` / `body` / `connectColor` / `connectInfo`. Its response is
`{ validEmails: [...], invalidEmails: [...] }`.

Team Incoming is a **paid-team feature** and Tosslab issues the team id and token directly
(support@tosslab.com), so most installs will not have one configured.

### Outgoing Webhook (Payload from Jandi)
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
`text` holds the full message including the trigger keyword; `data` is the same message with the
keyword stripped, and it is a **string**, not an object. Team Outgoing replaces
`writerName`/`writerEmail` with `writer: {id, name, email, phoneNumber}`.

### Outgoing Webhook (Response to Jandi)
Same format as Incoming message: `{ body, connectColor?, connectInfo? }`

## Installation Paths

### As a Claude Code plugin
```bash
/plugin marketplace add kwag93/cc-jandi
/plugin install cc-jandi@kwag93-jandi
```
Brings the skills and agents along and prompts for tokens via `userConfig`.

Validate a local checkout before publishing:
```bash
claude plugin validate . --strict
```
Note that with `marketplace.json` present the command validates the marketplace manifest. To check
`plugin.json` and the skill/agent frontmatter instead, run it against a copy that omits
`marketplace.json`.

### As an MCP server
```json
{
  "mcpServers": {
    "cc-jandi": {
      "command": "npx",
      "args": ["cc-jandi"],
      "env": { "JANDI_TOKEN": "12345678/abcdef0123456789abcdef0123456789" }
    }
  }
}
```
For local development point `command` at `node` and `args` at the absolute `dist/index.js` path.

## Build System

The project uses TypeScript with ES modules. The build process:
1. `tsc` compiles TypeScript to JavaScript in `dist/`
2. `mcp-build` packages the server for distribution
3. The `bin` field in package.json points to `dist/index.js`

Node.js version requirement: >=18.19.0

### Release

Pushing to `main` triggers `.github/workflows/release.yml`, which runs semantic-release:

1. `@semantic-release/commit-analyzer` reads Angular-convention commits to pick the next version
2. `@semantic-release/npm` bumps `package.json` and publishes to npm
3. `@semantic-release/exec` runs `scripts/sync-version.mjs` to write the same version into
   `.claude-plugin/plugin.json` — Claude Code serves the cached plugin until that string changes,
   so skipping this step silently strands plugin users on the old version
4. `@semantic-release/git` commits `CHANGELOG.md`, `package.json`, `package-lock.json`, and
   `.claude-plugin/plugin.json`, then tags the release as `v${version}`

## Common Development Tasks

### Adding a New Incoming Tool
1. Create a new file in `src/tools/incoming/`
2. Extend `MCPTool<InputType>`
3. Use `resolveIncomingToken()` for token management
4. Use `IncomingWebhookService` for message sending
5. Build and test: `npm run build`

### Adding a New Team Incoming Tool
1. Create a new file in `src/tools/team-incoming/`
2. Use `resolveTeamToken()` for token management
3. Use `TeamIncomingWebhookService` for message sending

### Adding a New Outgoing Tool
1. Create a new file in `src/tools/outgoing/`
2. Import types from `../../types/outgoing.js`

### Testing Token Configuration
1. Set up `.env` file with tokens
2. Use `validate_token` for incoming webhooks — **this posts a real message to the channel**,
   since Jandi has no read-only validation endpoint
3. Use `validate_team_token` for team webhooks — this one omits the recipient, so nothing is
   delivered
4. Use `test_webhook` for comprehensive testing — also posts real messages

### Generating Scripts
Use `generate_webhook_script` tool with `webhookType` parameter to create scripts for incoming or team-incoming webhooks in Python, Node.js, curl, or bash.
