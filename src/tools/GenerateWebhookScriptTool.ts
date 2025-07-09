import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { ScriptTemplate } from "../types/jandi";

interface GenerateWebhookScriptInput {
  language: 'python' | 'nodejs' | 'curl' | 'bash';
  token: string;
  message: string;
  color?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
}

class GenerateWebhookScriptTool extends MCPTool<GenerateWebhookScriptInput> {
  name = "generate_webhook_script";
  description = "Generate a script to send messages to Jandi webhook in various programming languages";

  schema = {
    language: {
      type: z.enum(['python', 'nodejs', 'curl', 'bash']),
      description: "Programming language for the generated script",
    },
    token: {
      type: z.string(),
      description: "Jandi webhook token (32-character hexadecimal string)",
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
  };

  private generatePythonScript(input: GenerateWebhookScriptInput): string {
    const hasAttachment = input.color || input.title || input.description || input.imageUrl;
    
    let script = `#!/usr/bin/env python3
import requests
import json

def send_jandi_message():
    url = "https://wh.jandi.com/connect-api/webhook/${input.token}"
    
    headers = {
        "Accept": "application/vnd.tosslab.jandi-v2+json",
        "Content-Type": "application/json"
    }
    
    data = {
        "body": "${input.message.replace(/"/g, '\\"')}"
    }
    
`;

    if (hasAttachment) {
      script += `    # Add rich message features\n`;
      if (input.color) {
        script += `    data["connectColor"] = "${input.color}"\n`;
      }
      
      if (input.title || input.description || input.imageUrl) {
        script += `    data["connectInfo"] = [{\n`;
        if (input.title) script += `        "title": "${input.title.replace(/"/g, '\\"')}",\n`;
        if (input.description) script += `        "description": "${input.description.replace(/"/g, '\\"')}",\n`;
        if (input.imageUrl) script += `        "imageUrl": "${input.imageUrl}",\n`;
        script += `    }]\n`;
      }
    }

    script += `
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

    return script;
  }

  private generateNodejsScript(input: GenerateWebhookScriptInput): string {
    const hasAttachment = input.color || input.title || input.description || input.imageUrl;
    
    let script = `const axios = require('axios');

async function sendJandiMessage() {
    const url = 'https://wh.jandi.com/connect-api/webhook/${input.token}';
    
    const headers = {
        'Accept': 'application/vnd.tosslab.jandi-v2+json',
        'Content-Type': 'application/json'
    };
    
    const data = {
        body: '${input.message.replace(/'/g, "\\'")}'
    };
    
`;

    if (hasAttachment) {
      script += `    // Add rich message features\n`;
      if (input.color) {
        script += `    data.connectColor = '${input.color}';\n`;
      }
      
      if (input.title || input.description || input.imageUrl) {
        script += `    data.connectInfo = [{\n`;
        if (input.title) script += `        title: '${input.title.replace(/'/g, "\\'")}',\n`;
        if (input.description) script += `        description: '${input.description.replace(/'/g, "\\'")}',\n`;
        if (input.imageUrl) script += `        imageUrl: '${input.imageUrl}',\n`;
        script += `    }];\n`;
      }
    }

    script += `
    try {
        const response = await axios.post(url, data, { headers });
        console.log('Message sent successfully!');
    } catch (error) {
        console.error('Error sending message:', error.response?.data || error.message);
    }
}

sendJandiMessage();
`;

    return script;
  }

  private generateCurlScript(input: GenerateWebhookScriptInput): string {
    const hasAttachment = input.color || input.title || input.description || input.imageUrl;
    
    let jsonData = `{"body":"${input.message.replace(/"/g, '\\"')}"}`;
    
    if (hasAttachment) {
      const data: any = { body: input.message };
      if (input.color) data.connectColor = input.color;
      if (input.title || input.description || input.imageUrl) {
        data.connectInfo = [{}];
        if (input.title) data.connectInfo[0].title = input.title;
        if (input.description) data.connectInfo[0].description = input.description;
        if (input.imageUrl) data.connectInfo[0].imageUrl = input.imageUrl;
      }
      jsonData = JSON.stringify(data);
    }

    return `#!/bin/bash
curl -X POST "https://wh.jandi.com/connect-api/webhook/${input.token}" \\
  -H "Accept: application/vnd.tosslab.jandi-v2+json" \\
  -H "Content-Type: application/json" \\
  -d '${jsonData}'
`;
  }

  private generateBashScript(input: GenerateWebhookScriptInput): string {
    const hasAttachment = input.color || input.title || input.description || input.imageUrl;
    
    let script = `#!/bin/bash

# Jandi Webhook Script
TOKEN="${input.token}"
URL="https://wh.jandi.com/connect-api/webhook/\$TOKEN"
MESSAGE="${input.message.replace(/"/g, '\\"')}"

# Basic message data
JSON_DATA="{\\"body\\": \\"\$MESSAGE\\""
`;

    if (hasAttachment) {
      script += `
# Add rich message features
`;
      if (input.color) {
        script += `JSON_DATA="\$JSON_DATA, \\"connectColor\\": \\"${input.color}\\""
`;
      }
      
      if (input.title || input.description || input.imageUrl) {
        script += `JSON_DATA="\$JSON_DATA, \\"connectInfo\\": [{"
`;
        if (input.title) script += `JSON_DATA="\$JSON_DATA \\"title\\": \\"${input.title.replace(/"/g, '\\"')}\\","
`;
        if (input.description) script += `JSON_DATA="\$JSON_DATA \\"description\\": \\"${input.description.replace(/"/g, '\\"')}\\","
`;
        if (input.imageUrl) script += `JSON_DATA="\$JSON_DATA \\"imageUrl\\": \\"${input.imageUrl}\\","
`;
        script += `JSON_DATA="\$JSON_DATA}]"
`;
      }
    }

    script += `
JSON_DATA="\$JSON_DATA}"

# Send message
curl -X POST "\$URL" \\
  -H "Accept: application/vnd.tosslab.jandi-v2+json" \\
  -H "Content-Type: application/json" \\
  -d "\$JSON_DATA"
`;

    return script;
  }

  async execute(input: GenerateWebhookScriptInput) {
    try {
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
        default:
          return {
            success: false,
            error: `Unsupported language: ${input.language}`
          };
      }

      return {
        success: true,
        language: input.language,
        fileExtension,
        executionInstructions,
        script,
        message: `Successfully generated ${input.language} script for Jandi webhook`,
        features: {
          hasColor: !!input.color,
          hasAttachment: !!(input.title || input.description || input.imageUrl)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Error generating script: ${error}`
      };
    }
  }
}

export default GenerateWebhookScriptTool;