import { MCPTool } from "mcp-framework";
import { z } from "zod";

interface SimulateOutgoingPayloadInput {
  webhookType?: 'outgoing' | 'team-outgoing';
  text: string;
  keyword?: string;
  teamName?: string;
  roomName?: string;
  writerName?: string;
  writerEmail?: string;
}

class SimulateOutgoingPayloadTool extends MCPTool<SimulateOutgoingPayloadInput> {
  name = "simulate_outgoing_payload";
  description = "Generate a simulated Jandi Outgoing Webhook payload JSON for testing your webhook handler server. Useful for local development and testing.";

  schema = {
    webhookType: {
      type: z.enum(['outgoing', 'team-outgoing']).optional(),
      description: "Type of outgoing webhook: 'outgoing' (standard) or 'team-outgoing' (team). Default is 'outgoing'",
    },
    text: {
      type: z.string(),
      description: "The message text that triggered the webhook",
    },
    keyword: {
      type: z.string().optional(),
      description: "The keyword that triggered the outgoing webhook. Default is 'test'",
    },
    teamName: {
      type: z.string().optional(),
      description: "Team name for the payload. Default is 'TestTeam'",
    },
    roomName: {
      type: z.string().optional(),
      description: "Chat room name for the payload. Default is 'TestRoom'",
    },
    writerName: {
      type: z.string().optional(),
      description: "Writer name for the payload. Default is 'TestUser'",
    },
    writerEmail: {
      type: z.string().optional(),
      description: "Writer email for the payload. Default is 'test@example.com'",
    },
  };

  async execute(input: SimulateOutgoingPayloadInput) {
    try {
      const webhookType = input.webhookType || 'outgoing';
      const now = new Date().toISOString();

      const keyword = input.keyword || "test";
      // Jandi sends `text` with the trigger keyword included and `data` with it stripped.
      const text = input.text;
      const data = this.stripKeyword(text, keyword);

      if (webhookType === 'team-outgoing') {
        const payload = {
          token: "YE1ronbbuoZkq7h3J5KMI4Tn",
          teamName: input.teamName || "TestTeam",
          roomName: input.roomName || "TestRoom",
          writer: {
            id: "12345",
            name: input.writerName || "TestUser",
            email: input.writerEmail || "test@example.com",
            phoneNumber: "+82-10-1234-5678"
          },
          text,
          keyword,
          createdAt: now,
          data,
          platform: "web",
          ip: "127.0.0.1"
        };

        return {
          success: true,
          data: {
            webhookType: 'team-outgoing',
            payload,
            payloadJson: JSON.stringify(payload, null, 2),
            curlCommand: this.generateCurlCommand(payload),
            message: "Team Outgoing Webhook test payload generated. Use curlCommand to test your handler."
          }
        };
      }

      const payload = {
        token: "YE1ronbbuoZkq7h3J5KMI4Tn",
        teamName: input.teamName || "TestTeam",
        roomName: input.roomName || "TestRoom",
        writerName: input.writerName || "TestUser",
        writerEmail: input.writerEmail || "test@example.com",
        text,
        keyword,
        createdAt: now,
        data,
        platform: "web",
        ip: "127.0.0.1"
      };

      return {
        success: true,
        data: {
          webhookType: 'outgoing',
          payload,
          payloadJson: JSON.stringify(payload, null, 2),
          curlCommand: this.generateCurlCommand(payload),
          message: "Outgoing Webhook test payload generated. Use curlCommand to test your handler."
        }
      };
    } catch (error) {
      return { success: false, error: `Error generating payload: ${error}` };
    }
  }

  private stripKeyword(text: string, keyword: string): string {
    const trimmed = text.trimStart();
    for (const prefix of [`/${keyword}`, keyword]) {
      // Require a word boundary so keyword "test" does not turn "testing 123"
      // into "ing 123" — Jandi triggers on the leading token, not a substring.
      const rest = trimmed.slice(prefix.length);
      if (trimmed.startsWith(prefix) && (rest === '' || /^\s/.test(rest))) {
        return rest.trimStart();
      }
    }
    return trimmed;
  }

  private generateCurlCommand(payload: Record<string, unknown>): string {
    return `curl -X POST http://localhost:3000/webhook \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payload)}'`;
  }
}

export default SimulateOutgoingPayloadTool;
