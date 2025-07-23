# n8n Webhook Integration Examples

This document provides examples for integrating with n8n workflows via webhooks and streaming endpoints.

## Webhook Configuration

### Environment Variables

```env
# .env.local
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/chat
N8N_STREAMING_URL=https://your-n8n-instance.com/webhook/stream
```

## Request/Response Formats

### Request Format

```typescript
interface N8NRequest {
  username: string;
  message: string;
  sessionId: string;
  timestamp: Date;
}
```

Example request:
```json
{
  "username": "user123",
  "message": "Can you analyze this sales data?",
  "sessionId": "session-abc123",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Response Formats

#### Text Response
```json
{
  "type": "final",
  "messageType": "text",
  "content": "Here's your sales analysis: The data shows a 15% increase in Q4 sales compared to Q3.",
  "metadata": {
    "timestamp": "2024-01-15T10:30:05.000Z",
    "processingTime": 5000,
    "source": "sales-analysis-workflow"
  }
}
```

#### JSON Data Response
```json
{
  "type": "final",
  "messageType": "json",
  "content": {
    "summary": {
      "total_sales": 125000,
      "growth_rate": 0.15,
      "top_products": ["Product A", "Product B", "Product C"]
    },
    "monthly_breakdown": [
      { "month": "October", "sales": 40000 },
      { "month": "November", "sales": 42000 },
      { "month": "December", "sales": 43000 }
    ]
  },
  "metadata": {
    "timestamp": "2024-01-15T10:30:08.000Z",
    "processingTime": 8000,
    "source": "data-processor"
  }
}
```

#### Chart Response
```json
{
  "type": "final",
  "messageType": "chart",
  "content": {
    "type": "line",
    "title": "Sales Growth Trend",
    "data": {
      "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      "datasets": [{
        "label": "Sales ($)",
        "data": [35000, 38000, 41000, 39000, 45000, 48000],
        "borderColor": "#2e7d32",
        "backgroundColor": "rgba(46, 125, 50, 0.1)"
      }]
    },
    "options": {
      "responsive": true,
      "maintainAspectRatio": false
    }
  },
  "metadata": {
    "timestamp": "2024-01-15T10:30:12.000Z",
    "processingTime": 12000,
    "chartType": "line"
  }
}
```

#### Image Response
```json
{
  "type": "final",
  "messageType": "image",
  "content": "https://your-storage.com/generated-chart-abc123.png",
  "metadata": {
    "timestamp": "2024-01-15T10:30:15.000Z",
    "processingTime": 15000,
    "imageFormat": "png",
    "imageSize": "800x600"
  }
}
```

#### Error Response
```json
{
  "type": "final",
  "messageType": "error",
  "content": {
    "error": "Data processing failed",
    "details": "Unable to connect to data source",
    "code": "DATA_SOURCE_ERROR"
  },
  "metadata": {
    "timestamp": "2024-01-15T10:30:18.000Z",
    "processingTime": 3000,
    "errorType": "connection"
  }
}
```

## Streaming Messages (Interim Updates)

### Interim Message Examples

```json
{
  "type": "interim",
  "messageType": "text",
  "content": "Starting data analysis workflow...",
  "metadata": {
    "timestamp": "2024-01-15T10:30:01.000Z",
    "step": "initialization"
  }
}
```

```json
{
  "type": "interim",
  "messageType": "text",
  "content": "Connecting to database and fetching records...",
  "metadata": {
    "timestamp": "2024-01-15T10:30:03.000Z",
    "step": "data_fetch",
    "progress": 25
  }
}
```

```json
{
  "type": "interim",
  "messageType": "text",
  "content": "Processing 1,250 records...",
  "metadata": {
    "timestamp": "2024-01-15T10:30:06.000Z",
    "step": "data_processing",
    "progress": 50
  }
}
```

```json
{
  "type": "interim",
  "messageType": "text",
  "content": "Generating charts and visualizations...",
  "metadata": {
    "timestamp": "2024-01-15T10:30:09.000Z",
    "step": "visualization",
    "progress": 75
  }
}
```

## n8n Workflow Examples

### Basic Chat Workflow

```json
{
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "chat",
        "responseMode": "responseNode"
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [240, 300]
    },
    {
      "parameters": {
        "functionCode": "// Extract message and session info\nconst { message, sessionId, username } = $input.first().json;\n\n// Log the incoming request\nconsole.log('Received message:', message);\n\n// Process the message (example: simple echo)\nconst response = {\n  type: 'final',\n  messageType: 'text',\n  content: `Echo: ${message}`,\n  metadata: {\n    timestamp: new Date().toISOString(),\n    processingTime: 1000,\n    source: 'echo-processor'\n  }\n};\n\nreturn { json: response };"
      },
      "name": "Process Message",
      "type": "n8n-nodes-base.function",
      "position": [460, 300]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ $json }}"
      },
      "name": "Respond to Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [680, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "Process Message",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Process Message": {
      "main": [
        [
          {
            "node": "Respond to Webhook",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

### Data Analysis Workflow

```json
{
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "analyze",
        "responseMode": "responseNode"
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [240, 300]
    },
    {
      "parameters": {
        "url": "https://api.example.com/stream",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {
              "name": "sessionId",
              "value": "={{ $json.sessionId }}"
            }
          ]
        },
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Content-Type",
              "value": "text/event-stream"
            }
          ]
        },
        "sendBody": true,
        "bodyContentType": "json",
        "jsonBody": "={{ JSON.stringify({type: 'interim', messageType: 'text', content: 'Starting analysis...', metadata: {timestamp: new Date().toISOString(), step: 'initialization'}}) }}"
      },
      "name": "Send Interim Update 1",
      "type": "n8n-nodes-base.httpRequest",
      "position": [460, 200]
    },
    {
      "parameters": {
        "functionCode": "// Simulate data fetching\nconst delay = ms => new Promise(resolve => setTimeout(resolve, ms));\n\n// Send interim update\nconst interimUpdate = {\n  type: 'interim',\n  messageType: 'text',\n  content: 'Fetching data from database...',\n  metadata: {\n    timestamp: new Date().toISOString(),\n    step: 'data_fetch',\n    progress: 25\n  }\n};\n\n// Simulate processing time\nawait delay(2000);\n\nreturn { json: $input.first().json };"
      },
      "name": "Fetch Data",
      "type": "n8n-nodes-base.function",
      "position": [460, 300]
    },
    {
      "parameters": {
        "functionCode": "// Simulate data processing\nconst { message } = $input.first().json;\n\n// Mock analysis results\nconst analysisResults = {\n  summary: {\n    total_records: 1250,\n    avg_value: 4500,\n    growth_rate: 0.15\n  },\n  trends: [\n    { period: 'Q1', value: 125000 },\n    { period: 'Q2', value: 135000 },\n    { period: 'Q3', value: 142000 },\n    { period: 'Q4', value: 163000 }\n  ]\n};\n\nconst response = {\n  type: 'final',\n  messageType: 'json',\n  content: analysisResults,\n  metadata: {\n    timestamp: new Date().toISOString(),\n    processingTime: 5000,\n    source: 'data-analyzer'\n  }\n};\n\nreturn { json: response };"
      },
      "name": "Analyze Data",
      "type": "n8n-nodes-base.function",
      "position": [680, 300]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ $json }}"
      },
      "name": "Respond to Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [900, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "Send Interim Update 1",
            "type": "main",
            "index": 0
          },
          {
            "node": "Fetch Data",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Fetch Data": {
      "main": [
        [
          {
            "node": "Analyze Data",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Analyze Data": {
      "main": [
        [
          {
            "node": "Respond to Webhook",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

## Streaming Endpoint Configuration

### Server-Sent Events (SSE) Setup

```javascript
// n8n Function Node for streaming
const express = require('express');
const app = express();

app.get('/webhook/stream', (req, res) => {
  const sessionId = req.query.sessionId;
  
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Send interim messages
  const messages = [
    { type: 'interim', messageType: 'text', content: 'Initializing workflow...' },
    { type: 'interim', messageType: 'text', content: 'Connecting to data sources...' },
    { type: 'interim', messageType: 'text', content: 'Processing request...' }
  ];

  let index = 0;
  const interval = setInterval(() => {
    if (index < messages.length) {
      res.write(`data: ${JSON.stringify(messages[index])}\n\n`);
      index++;
    } else {
      res.write('data: [DONE]\n\n');
      res.end();
      clearInterval(interval);
    }
  }, 2000);

  // Handle client disconnect
  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});
```

## Error Handling

### Common Error Scenarios

```typescript
// Network timeout
{
  "type": "final",
  "messageType": "error",
  "content": {
    "error": "Request timeout",
    "details": "The workflow took longer than expected to complete",
    "code": "TIMEOUT_ERROR"
  },
  "metadata": {
    "timestamp": "2024-01-15T10:35:00.000Z",
    "errorType": "timeout"
  }
}

// Invalid input
{
  "type": "final", 
  "messageType": "error",
  "content": {
    "error": "Invalid input format",
    "details": "Message content must be a non-empty string",
    "code": "VALIDATION_ERROR"
  },
  "metadata": {
    "timestamp": "2024-01-15T10:35:00.000Z",
    "errorType": "validation"
  }
}

// Server error
{
  "type": "final",
  "messageType": "error", 
  "content": {
    "error": "Internal server error",
    "details": "An unexpected error occurred while processing your request",
    "code": "INTERNAL_ERROR"
  },
  "metadata": {
    "timestamp": "2024-01-15T10:35:00.000Z",
    "errorType": "server"
  }
}
```

## Testing the Integration

### Using curl

```bash
# Test basic webhook
curl -X POST https://your-n8n-instance.com/webhook/chat \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "message": "Hello, can you help me?",
    "sessionId": "test-session-123",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }'

# Test streaming endpoint
curl -N https://your-n8n-instance.com/webhook/stream?sessionId=test-session-123 \
  -H "Accept: text/event-stream"
```

### Using the n8n Client

```typescript
import { createN8NClient } from './lib/n8n-client';

const client = createN8NClient({
  webhookUrl: 'https://your-n8n-instance.com/webhook/chat',
  streamingUrl: 'https://your-n8n-instance.com/webhook/stream'
});

// Test message sending
const testMessage = async () => {
  try {
    const response = await client.sendMessage({
      username: 'testuser',
      message: 'Test message',
      sessionId: 'test-session',
      timestamp: new Date()
    });
    
    console.log('Response:', response);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Test streaming
const testStreaming = async () => {
  try {
    for await (const message of client.streamMessages('test-session')) {
      console.log('Streaming message:', message);
    }
  } catch (error) {
    console.error('Streaming error:', error);
  }
};
```

## Best Practices

### 1. Error Handling
- Always include proper error responses
- Use consistent error format across workflows
- Implement retry logic for transient failures

### 2. Performance
- Keep interim messages concise and meaningful
- Avoid sending too many interim updates (max 1 per 2 seconds)
- Implement timeouts for long-running workflows

### 3. Security
- Validate all incoming requests
- Implement rate limiting
- Use HTTPS for all webhook endpoints
- Consider implementing webhook signatures for authentication

### 4. Monitoring
- Log all webhook requests and responses
- Monitor response times and error rates
- Set up alerts for workflow failures

### 5. Testing
- Create comprehensive test cases for all response types
- Test error scenarios and edge cases
- Implement automated testing for workflow changes