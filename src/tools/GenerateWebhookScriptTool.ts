import { MCPTool } from "mcp-framework";
import { z } from "zod";

interface GenerateWebhookScriptInput {
  language: 'python' | 'nodejs' | 'curl' | 'bash';
  webhookType?: 'incoming' | 'team-incoming';
  token: string;
  message: string;
  color?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  teamId?: string;
  email?: string;
}

class GenerateWebhookScriptTool extends MCPTool<GenerateWebhookScriptInput> {
  name = "generate_webhook_script";
  description = "Generate a script to send messages via Jandi webhooks. Supports both Incoming and Team Incoming webhook types in Python, Node.js, curl, and bash.";

  schema = {
    language: {
      type: z.enum(['python', 'nodejs', 'curl', 'bash']),
      description: "Programming language for the generated script",
    },
    webhookType: {
      type: z.enum(['incoming', 'team-incoming']).optional(),
      description: "Webhook type: 'incoming' (channel message) or 'team-incoming' (personal message). Default is 'incoming'",
    },
    token: {
      type: z.string(),
      description: "Jandi webhook token — the part of the Connect webhook URL after '/connect-api/webhook/'",
    },
    message: {
      type: z.string(),
      description: "The message content to send",
    },
    color: {
      type: z.string().optional(),
      description: "Hex color code for the message (e.g., '#FF0000')",
    },
    title: {
      type: z.string().optional(),
      description: "Title for the message attachment",
    },
    description: {
      type: z.string().optional(),
      description: "Description for the message attachment",
    },
    imageUrl: {
      type: z.string().optional(),
      description: "Image URL for the message attachment",
    },
    teamId: {
      type: z.string().optional(),
      description: "Jandi team ID (required for team-incoming webhook type)",
    },
    email: {
      type: z.string().optional(),
      description: "Comma-separated recipient emails (required for team-incoming webhook type)",
    },
  };

  private getBaseUrl(input: GenerateWebhookScriptInput): string {
    const type = input.webhookType || 'incoming';
    if (type === 'team-incoming') {
      return `https://wh.jandi.com/connect-api/team-webhook/${input.teamId}/${input.token}`;
    }
    return `https://wh.jandi.com/connect-api/webhook/${input.token}`;
  }

  private buildPayload(input: GenerateWebhookScriptInput): Record<string, unknown> {
    const hasAttachment = input.color || input.title || input.description || input.imageUrl;
    const data: Record<string, unknown> = { body: input.message };

    if (input.webhookType === 'team-incoming' && input.email) {
      data.email = input.email;
    }

    if (hasAttachment) {
      if (input.color) data.connectColor = input.color;
      if (input.title || input.description || input.imageUrl) {
        const info: Record<string, string> = {};
        if (input.title) info.title = input.title;
        if (input.description) info.description = input.description;
        if (input.imageUrl) info.imageUrl = input.imageUrl;
        data.connectInfo = [info];
      }
    }

    return data;
  }

  private generatePythonScript(input: GenerateWebhookScriptInput): string {
    const url = this.getBaseUrl(input);
    const payload = this.buildPayload(input);
    const payloadStr = JSON.stringify(payload, null, 8).replace(/^/gm, '    ').trim();

    return `#!/usr/bin/env python3
import requests
import json

def send_jandi_message():
    url = "${url}"

    headers = {
        "Accept": "application/vnd.tosslab.jandi-v2+json",
        "Content-Type": "application/json"
    }

    data = ${payloadStr}

    try:
        response = requests.post(url, headers=headers, data=json.dumps(data))
        if response.status_code == 200:
            print("Message sent successfully!")
        else:
            print(f"Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Error sending message: {e}")

if __name__ == "__main__":
    send_jandi_message()
`;
  }

  private generateNodejsScript(input: GenerateWebhookScriptInput): string {
    const url = this.getBaseUrl(input);
    const payload = this.buildPayload(input);
    const payloadStr = JSON.stringify(payload, null, 4);

    return `const axios = require('axios');

async function sendJandiMessage() {
    const url = '${url}';

    const headers = {
        'Accept': 'application/vnd.tosslab.jandi-v2+json',
        'Content-Type': 'application/json'
    };

    const data = ${payloadStr};

    try {
        const response = await axios.post(url, data, { headers });
        console.log('Message sent successfully!');
    } catch (error) {
        console.error('Error sending message:', error.response?.data || error.message);
    }
}

sendJandiMessage();
`;
  }

  private generateCurlScript(input: GenerateWebhookScriptInput): string {
    const url = this.getBaseUrl(input);
    const payload = this.buildPayload(input);
    const jsonData = JSON.stringify(payload);

    return `#!/bin/bash
curl -X POST "${url}" \\
  -H "Accept: application/vnd.tosslab.jandi-v2+json" \\
  -H "Content-Type: application/json" \\
  -d '${jsonData}'
`;
  }

  private generateBashScript(input: GenerateWebhookScriptInput): string {
    const type = input.webhookType || 'incoming';
    const payload = this.buildPayload(input);
    const jsonData = JSON.stringify(payload).replace(/"/g, '\\"');

    let urlSetup: string;
    if (type === 'team-incoming') {
      urlSetup = `TEAM_ID="${input.teamId}"
TOKEN="${input.token}"
URL="https://wh.jandi.com/connect-api/team-webhook/$TEAM_ID/$TOKEN"`;
    } else {
      urlSetup = `TOKEN="${input.token}"
URL="https://wh.jandi.com/connect-api/webhook/$TOKEN"`;
    }

    return `#!/bin/bash

# Jandi ${type === 'team-incoming' ? 'Team Incoming' : 'Incoming'} Webhook Script
${urlSetup}

JSON_DATA="${jsonData}"

# Send message
curl -X POST "$URL" \\
  -H "Accept: application/vnd.tosslab.jandi-v2+json" \\
  -H "Content-Type: application/json" \\
  -d "$JSON_DATA"
`;
  }

  async execute(input: GenerateWebhookScriptInput) {
    try {
      const type = input.webhookType || 'incoming';

      if (type === 'team-incoming') {
        if (!input.teamId) {
          return { success: false, error: "teamId is required for team-incoming webhook type" };
        }
        if (!input.email) {
          return { success: false, error: "email is required for team-incoming webhook type" };
        }
      }

      let script: string;
      let fileExtension: string;
      let executionInstructions: string;

      switch (input.language) {
        case 'python':
          script = this.generatePythonScript(input);
          fileExtension = '.py';
          executionInstructions = 'python3 script.py (requires: pip install requests)';
          break;
        case 'nodejs':
          script = this.generateNodejsScript(input);
          fileExtension = '.js';
          executionInstructions = 'node script.js (requires: npm install axios)';
          break;
        case 'curl':
          script = this.generateCurlScript(input);
          fileExtension = '.sh';
          executionInstructions = 'bash script.sh (requires: curl)';
          break;
        case 'bash':
          script = this.generateBashScript(input);
          fileExtension = '.sh';
          executionInstructions = 'bash script.sh (requires: curl)';
          break;
      }

      return {
        success: true,
        data: {
          language: input.language,
          webhookType: type,
          fileExtension,
          executionInstructions,
          script,
          message: `Successfully generated ${input.language} script for Jandi ${type} webhook`,
          features: {
            hasColor: !!input.color,
            hasAttachment: !!(input.title || input.description || input.imageUrl),
            hasRecipients: !!input.email
          }
        }
      };
    } catch (error) {
      return { success: false, error: `Error generating script: ${error}` };
    }
  }
}

export default GenerateWebhookScriptTool;
