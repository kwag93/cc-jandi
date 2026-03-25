import { MCPTool } from "mcp-framework";
import { z } from "zod";

interface GenerateOutgoingHandlerInput {
  framework: 'express' | 'fastapi' | 'flask';
  verificationToken?: string;
  handlerLogic?: string;
}

class GenerateOutgoingHandlerTool extends MCPTool<GenerateOutgoingHandlerInput> {
  name = "generate_outgoing_handler";
  description = "Generate a server handler for Jandi Outgoing Webhook. Creates ready-to-run code for receiving and responding to Jandi outgoing webhook events.";

  schema = {
    framework: {
      type: z.enum(['express', 'fastapi', 'flask']),
      description: "Server framework to generate the handler for: 'express' (Node.js), 'fastapi' (Python), 'flask' (Python)",
    },
    verificationToken: {
      type: z.string().optional(),
      description: "Verification token to validate incoming requests from Jandi. If provided, the handler will verify the token.",
    },
    handlerLogic: {
      type: z.string().optional(),
      description: "Custom handler logic description. Default generates an echo bot that responds with the received message.",
    },
  };

  async execute(input: GenerateOutgoingHandlerInput) {
    try {
      let script: string;
      let fileName: string;
      let executionInstructions: string;

      switch (input.framework) {
        case 'express':
          script = this.generateExpressHandler(input);
          fileName = 'jandi-webhook-handler.js';
          executionInstructions = 'npm init -y && npm install express && node jandi-webhook-handler.js';
          break;
        case 'fastapi':
          script = this.generateFastAPIHandler(input);
          fileName = 'jandi_webhook_handler.py';
          executionInstructions = 'pip install fastapi uvicorn && uvicorn jandi_webhook_handler:app --reload --port 3000';
          break;
        case 'flask':
          script = this.generateFlaskHandler(input);
          fileName = 'jandi_webhook_handler.py';
          executionInstructions = 'pip install flask && python jandi_webhook_handler.py';
          break;
      }

      return {
        success: true,
        data: {
          framework: input.framework,
          fileName,
          executionInstructions,
          script,
          message: `Successfully generated ${input.framework} handler for Jandi Outgoing Webhook`,
          notes: [
            "The handler listens on port 3000 by default",
            "Use simulate_outgoing_payload to generate test payloads",
            "Response format: { body, connectColor?, connectInfo? }",
            "Response body max 5000 chars, total response max 256KB"
          ]
        }
      };
    } catch (error) {
      return { success: false, error: `Error generating handler: ${error}` };
    }
  }

  private generateExpressHandler(input: GenerateOutgoingHandlerInput): string {
    const tokenCheck = input.verificationToken
      ? `
  // Verify token
  if (req.body.token !== '${input.verificationToken}') {
    return res.status(401).json({ error: 'Invalid token' });
  }
`
      : '';

    return `const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

// Jandi Outgoing Webhook Handler
app.post('/webhook', (req, res) => {
  const { token, teamName, roomName, writerName, writerEmail, text, keyword, createdAt } = req.body;
  // Team Outgoing Webhook uses writer object: req.body.writer.name, req.body.writer.email
${tokenCheck}
  console.log(\`[\${new Date().toISOString()}] Message from \${writerName || req.body.writer?.name}: \${text}\`);

  // Respond with a Jandi message format
  // Return empty 200 to acknowledge without sending a response message
  res.json({
    body: \`Received: \${text}\`,
    connectColor: "#FAC11B",
    connectInfo: [{
      title: "Webhook Response",
      description: \`Processed message from \${writerName || req.body.writer?.name} in \${roomName}\`
    }]
  });
});

app.listen(PORT, () => {
  console.log(\`Jandi Outgoing Webhook handler listening on port \${PORT}\`);
  console.log(\`Endpoint: http://localhost:\${PORT}/webhook\`);
});
`;
  }

  private generateFastAPIHandler(input: GenerateOutgoingHandlerInput): string {
    const tokenCheck = input.verificationToken
      ? `
    # Verify token
    if payload.token != "${input.verificationToken}":
        raise HTTPException(status_code=401, detail="Invalid token")
`
      : '';

    return `from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
import uvicorn

app = FastAPI(title="Jandi Outgoing Webhook Handler")


class Writer(BaseModel):
    id: Optional[str] = None
    name: str
    email: str
    phoneNumber: Optional[str] = None


class OutgoingPayload(BaseModel):
    token: str
    teamName: str
    roomName: str
    writerName: Optional[str] = None  # Standard Outgoing
    writerEmail: Optional[str] = None  # Standard Outgoing
    writer: Optional[Writer] = None  # Team Outgoing
    text: str
    keyword: str
    createdAt: str
    data: Optional[Dict[str, Any]] = None
    platform: Optional[str] = None
    ip: Optional[str] = None


class ConnectInfo(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    imageUrl: Optional[str] = None


class WebhookResponse(BaseModel):
    body: str
    connectColor: Optional[str] = "#FAC11B"
    connectInfo: Optional[List[ConnectInfo]] = None


@app.post("/webhook", response_model=WebhookResponse)
async def handle_webhook(payload: OutgoingPayload):
${tokenCheck}
    writer_name = payload.writerName or (payload.writer.name if payload.writer else "Unknown")
    print(f"[{datetime.now().isoformat()}] Message from {writer_name}: {payload.text}")

    return WebhookResponse(
        body=f"Received: {payload.text}",
        connectColor="#FAC11B",
        connectInfo=[ConnectInfo(
            title="Webhook Response",
            description=f"Processed message from {writer_name} in {payload.roomName}"
        )]
    )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3000)
`;
  }

  private generateFlaskHandler(input: GenerateOutgoingHandlerInput): string {
    const tokenCheck = input.verificationToken
      ? `
    # Verify token
    if data.get('token') != '${input.verificationToken}':
        return jsonify({'error': 'Invalid token'}), 401
`
      : '';

    return `from flask import Flask, request, jsonify
from datetime import datetime

app = Flask(__name__)


@app.route('/webhook', methods=['POST'])
def handle_webhook():
    data = request.get_json()
${tokenCheck}
    # Support both standard and team outgoing webhook formats
    writer_name = data.get('writerName') or data.get('writer', {}).get('name', 'Unknown')
    text = data.get('text', '')
    room_name = data.get('roomName', '')

    print(f"[{datetime.now().isoformat()}] Message from {writer_name}: {text}")

    # Respond with Jandi message format
    return jsonify({
        'body': f'Received: {text}',
        'connectColor': '#FAC11B',
        'connectInfo': [{
            'title': 'Webhook Response',
            'description': f'Processed message from {writer_name} in {room_name}'
        }]
    })


if __name__ == '__main__':
    print('Jandi Outgoing Webhook handler listening on port 3000')
    print('Endpoint: http://localhost:3000/webhook')
    app.run(host='0.0.0.0', port=3000, debug=True)
`;
  }
}

export default GenerateOutgoingHandlerTool;
