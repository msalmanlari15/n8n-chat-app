/**
 * n8n Webhook Client
 * Handles communication with n8n workflows via webhook and streaming endpoints
 */

import { N8NRequest, N8NResponse, ChatError } from '@/types';

export class N8NError extends Error {
  constructor(
    message: string,
    public type: 'network' | 'timeout' | 'server' | 'validation',
    public details?: any
  ) {
    super(message);
    this.name = 'N8NError';
  }
}

export interface N8NClientConfig {
  webhookUrl: string;
  streamingUrl: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export class N8NClient {
  private config: Required<N8NClientConfig>;

  constructor(config: N8NClientConfig) {
    this.config = {
      timeout: 120000, // Increased to 2 minutes for AI processing
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    };
  }

  /**
   * Send a message to n8n webhook
   */
  async sendMessage(request: N8NRequest): Promise<N8NResponse> {
    const { webhookUrl, timeout } = this.config;
    
    try {
      console.log('=== N8N WEBHOOK DEBUG ===');
      console.log('Webhook URL:', webhookUrl);
      console.log('Request payload:', JSON.stringify(request, null, 2));
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(request),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new N8NError(
          `HTTP ${response.status}: ${response.statusText}`,
          'server',
          { status: response.status, statusText: response.statusText, body: errorText }
        );
      }

      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.log('Response is not JSON, treating as plain text');
        data = responseText;
      }
      
      console.log('Parsed response data:', data);
      const validatedResponse = this.validateResponse(data);
      console.log('Validated response:', validatedResponse);
      console.log('=== END N8N WEBHOOK DEBUG ===');
      
      return validatedResponse;
    } catch (error) {
      console.error('=== N8N WEBHOOK ERROR ===');
      console.error('Error details:', error);
      console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('=== END N8N WEBHOOK ERROR ===');
      
      if (error instanceof Error) {
        if (error.name === 'TimeoutError' || error.name === 'AbortError') {
          throw new N8NError('Request timeout', 'timeout');
        }
        
        if (error.message.includes('fetch') || error.message.includes('network')) {
          throw new N8NError('Network error', 'network', error);
        }
      }
      
      throw error;
    }
  }

  /**
   * Set up streaming connection for real-time updates
   */
  async *streamMessages(sessionId: string): AsyncGenerator<N8NResponse, void, unknown> {
    const { streamingUrl } = this.config;
    const url = new URL(streamingUrl);
    url.searchParams.set('sessionId', sessionId);

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new N8NError(
          `Streaming failed: ${response.status}`,
          'server',
          { status: response.status }
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new N8NError('No response body', 'server');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          
          // Keep the last incomplete line in buffer
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.trim() === '') continue;
            
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (data === '[DONE]') {
                return;
              }
              
              try {
                const parsed = JSON.parse(data);
                const response = this.validateResponse(parsed);
                yield response;
              } catch (error) {
                console.warn('Failed to parse streaming data:', error);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      if (error instanceof N8NError) {
        throw error;
      }
      
      throw new N8NError(
        'Streaming connection failed',
        'network',
        error
      );
    }
  }

  /**
   * Send message with retry logic
   */
  async sendMessageWithRetry(request: N8NRequest): Promise<N8NResponse> {
    const { retryAttempts, retryDelay } = this.config;
    
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        return await this.sendMessage(request);
      } catch (error) {
        if (error instanceof N8NError) {
          // Don't retry validation errors
          if (error.type === 'validation') {
            throw error;
          }
          
          // Don't retry on final attempt
          if (attempt === retryAttempts) {
            throw error;
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        } else {
          throw error;
        }
      }
    }
    
    throw new N8NError('Max retry attempts reached', 'network');
  }

  /**
   * Remove duplicate content from response
   */
  private deduplicateContent(content: string): string {
    if (typeof content !== 'string') {
      return content;
    }

    // Split content into lines
    const lines = content.split('\n');
    const seenLines = new Set<string>();
    const deduplicatedLines: string[] = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines for deduplication check
      if (trimmedLine === '') {
        deduplicatedLines.push(line);
        continue;
      }
      
      // If we haven't seen this line before, add it
      if (!seenLines.has(trimmedLine)) {
        seenLines.add(trimmedLine);
        deduplicatedLines.push(line);
      }
    }
    
    return deduplicatedLines.join('\n');
  }

  /**
   * Detect if content is mixed format (contains text and chart keys)
   */
  private isMixedContent(content: any): boolean {
    if (!Array.isArray(content)) return false;
    
    return content.some(item => {
      if (!item || typeof item !== 'object') return false;
      
      const keys = Object.keys(item);
      const hasText = keys.some(key => key.startsWith('text'));
      const hasChart = keys.some(key => key.startsWith('chart'));
      
      return hasText || hasChart;
    });
  }

  /**
   * Validate n8n response format
   */
  private validateResponse(data: any): N8NResponse {
    if (!data || typeof data !== 'object') {
      // If we get a simple response, wrap it in our expected format
      return {
        type: 'final',
        messageType: 'text',
        content: String(data),
        metadata: { timestamp: new Date() }
      };
    }

    // Check if response already has our expected format
    if (data.type && data.messageType && data.content !== undefined) {
      return {
        type: data.type,
        messageType: data.messageType,
        content: data.messageType === 'text' ? this.deduplicateContent(data.content) : data.content,
        metadata: data.metadata || { timestamp: new Date() }
      };
    }

    // Handle various possible n8n response formats
    let content = data.content || data.message || data.response || data.text || data.output || data;
    let messageType = data.messageType || data.format || 'text';
    let type = data.type || 'final';
    
    // Special handling for n8n output field that contains JSON string
    if (data.output && typeof data.output === 'string') {
      try {
        const parsedOutput = JSON.parse(data.output);
        if (parsedOutput && typeof parsedOutput === 'object') {
          // If the output contains a valid JSON object, use it as the base
          content = parsedOutput.content || parsedOutput;
          messageType = parsedOutput.messageType || messageType;
          type = parsedOutput.type || type;
        }
      } catch (error) {
        // If parsing fails, treat output as regular text content
        console.warn('Failed to parse n8n output as JSON:', error);
      }
    }

    // Check if this is a mixed content response (array with text/chart combinations)
    if (this.isMixedContent(content)) {
      messageType = 'mixed';
    } else if (Array.isArray(content)) {
      // If it's an array but not mixed content, treat as JSON
      messageType = 'json';
    }

    // Validate messageType
    if (!['text', 'json', 'image', 'chart', 'error', 'mixed'].includes(messageType)) {
      messageType = 'text';
    }

    // Validate type
    if (!['interim', 'final'].includes(type)) {
      type = 'final';
    }

    return {
      type,
      messageType,
      content: messageType === 'text' ? this.deduplicateContent(content) : content,
      metadata: data.metadata || { 
        timestamp: new Date(),
        source: 'n8n-webhook',
        originalResponse: data
      }
    };
  }

  /**
   * Cancel ongoing request
   */
  cancel(): void {
    // Requests now use AbortSignal.timeout() which auto-cancels
    console.log('Cancel requested - using timeout-based cancellation');
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.webhookUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Factory function for creating client instances
export function createN8NClient(config: N8NClientConfig): N8NClient {
  return new N8NClient(config);
}

// Example usage
export const n8nClientExample = () => {
  const client = createN8NClient({
    webhookUrl: process.env.N8N_WEBHOOK_URL!,
    streamingUrl: process.env.N8N_STREAMING_URL!,
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000
  });

  // Example: Send message
  const sendMessage = async () => {
    try {
      const request: N8NRequest = {
        username: 'user123',
        message: 'Hello, can you analyze this data?',
        sessionId: 'session-123',
        timestamp: new Date()
      };

      const response = await client.sendMessageWithRetry(request);
      console.log('Response:', response);
    } catch (error) {
      if (error instanceof N8NError) {
        console.error('N8N Error:', error.message, error.type);
      } else {
        console.error('Unexpected error:', error);
      }
    }
  };

  // Example: Stream messages
  const streamMessages = async () => {
    try {
      const sessionId = 'session-123';
      
      for await (const response of client.streamMessages(sessionId)) {
        console.log('Streaming response:', response);
        
        if (response.type === 'final') {
          break;
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
    }
  };

  return { sendMessage, streamMessages };
};

// Utility functions for common operations
export const n8nUtils = {
  /**
   * Format error for user display
   */
  formatError(error: N8NError): string {
    switch (error.type) {
      case 'network':
        return 'Network connection failed. Please check your internet connection.';
      case 'timeout':
        return 'Request timed out. The workflow may be taking longer than expected.';
      case 'server':
        return 'Server error occurred. Please try again later.';
      case 'validation':
        return 'Invalid data format. Please contact support.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  },

  /**
   * Check if response is interim message
   */
  isInterimMessage(response: N8NResponse): boolean {
    return response.type === 'interim';
  },

  /**
   * Check if response is final message
   */
  isFinalMessage(response: N8NResponse): boolean {
    return response.type === 'final';
  },

  /**
   * Extract processing time from metadata
   */
  getProcessingTime(response: N8NResponse): number | null {
    return response.metadata?.processingTime || null;
  }
};