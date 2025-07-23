# n8n Workflow Configuration for Thinking Updates

## Add HTTP Request Node as a Tool to AI Agent

### 1. Add a new Tool to your AI Agent node:
- In your n8n workflow, edit the AI Agent node
- Add a new tool: **HTTP Request**
- Configure it as follows:

### 2. HTTP Request Tool Configuration:

**Name**: Update Thinking Status
**Description**: Use this tool to update the thinking status for the user. Call this whenever you're processing or thinking about something.

**Parameters**:
```json
{
  "method": "POST",
  "url": "http://localhost:3000/api/status",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "sessionId": "={{ $json.body.sessionId }}",
    "messageId": "={{ $json.body.messageId }}",
    "status": "thinking",
    "message": "{{ $json.thinkingMessage }}",
    "type": "{{ $json.thinkingType }}"
  }
}
```

### 3. Update Your System Prompt:

Add this to your AI Agent's system prompt:

```
You have access to an "Update Thinking Status" tool. Use it to keep the user informed about what you're doing:

1. When you start using the Think tool, call Update Thinking Status with:
   - message: "Analyzing your request..."
   - type: "thinking"

2. When searching with Tavily, call Update Thinking Status with:
   - message: "Searching the internet for relevant information..."
   - type: "processing"

3. When working with Notion, call Update Thinking Status with:
   - message: "Checking your Notion tasks..."
   - type: "processing"

4. Before formulating your final response, call Update Thinking Status with:
   - message: "Preparing your response..."
   - type: "typing"

Always use descriptive messages that tell the user what you're actually doing.
```

### 4. Alternative: Use Code Node for Status Updates

If the HTTP Request tool doesn't work well, you can add a Code node between your Webhook and AI Agent:

```javascript
// Code node to inject status update function
const statusUpdateUrl = 'http://localhost:3000/api/status';

// Create a function that the AI can use
const updateThinkingStatus = async (message, type = 'thinking') => {
  try {
    await fetch(statusUpdateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: $json.body.sessionId,
        messageId: $json.body.messageId,
        status: 'active',
        message,
        type
      })
    });
  } catch (error) {
    console.error('Failed to update status:', error);
  }
};

// Pass through the request with the function attached
return {
  json: {
    ...$json,
    updateThinkingStatus
  }
};
```

### 5. Webhook Response Configuration

Make sure your webhook is configured to handle the messageId:
- The frontend now sends `messageId` in the request
- This ID is used to track thinking updates

### 6. Testing the Setup

1. Start your Next.js app: `npm run dev`
2. Open the browser console
3. Send a message
4. You should see thinking updates appearing in real-time

### Example Flow:
1. User sends: "What are my tasks for today?"
2. Thinking status shows: "Analyzing your request..."
3. Thinking status updates: "Checking your Notion tasks..."
4. Thinking status updates: "Preparing your response..."
5. Final response streams in character by character

## Alternative Implementation Using Webhook

If you can't add HTTP Request as a tool, you can use multiple webhooks:

### Option 1: Split Workflow with Multiple Webhooks

1. **Main Webhook** (existing): Receives the chat message
2. **Status Webhook** (new): Create a new webhook node for status updates
   - Path: `status-update`
   - Configure to receive POST requests
   - Connect to HTTP Request node that updates your API

3. **In your AI Agent prompt**, include:
   ```
   When you need to update thinking status, format your response as:
   [THINKING: Your thinking message here]
   
   Examples:
   [THINKING: Analyzing your request and understanding the context...]
   [THINKING: Searching for the latest information...]
   [THINKING: Processing Notion tasks...]
   ```

4. **Add a Code node** after AI Agent to parse these markers:
   ```javascript
   const output = $json.output;
   const thinkingMatches = output.match(/\[THINKING: (.*?)\]/g);
   
   if (thinkingMatches) {
     for (const match of thinkingMatches) {
       const message = match.replace(/\[THINKING: |\]/g, '');
       // Send to status webhook
       await $http.post('http://localhost:3000/api/status', {
         sessionId: $json.sessionId,
         messageId: $json.messageId,
         status: 'thinking',
         message: message,
         type: 'thinking'
       });
     }
     
     // Remove thinking markers from final output
     const cleanOutput = output.replace(/\[THINKING: .*?\]/g, '').trim();
     return { json: { ...json, output: cleanOutput } };
   }
   
   return { json: $json };
   ```