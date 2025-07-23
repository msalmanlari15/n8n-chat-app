/**
 * n8n Webhook Client
 * Handles communication with n8n workflows via webhook and streaming endpoints
 */

import { N8NRequest, N8NResponse, ChatError } from '../types';

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
  private abortController: AbortController | null = null;

  constructor(config: N8NClientConfig) {
    this.config = {
      timeout: 30000,
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
    
    this.abortController = new AbortController();
    const timeoutId = setTimeout(() => this.abortController?.abort(), timeout);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: this.abortController.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new N8NError(
          `HTTP ${response.status}: ${response.statusText}`,
          'server',
          { status: response.status, statusText: response.statusText }
        );
      }

      const data = await response.json();
      return this.validateResponse(data);
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new N8NError('Request timeout', 'timeout');
        }
        
        if (error.message.includes('fetch')) {
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
   * Validate n8n response format
   */
  private validateResponse(data: any): N8NResponse {
    if (!data || typeof data !== 'object') {
      throw new N8NError('Invalid response format', 'validation');
    }

    const { type, messageType, content, metadata } = data;

    if (!type || !['interim', 'final'].includes(type)) {
      throw new N8NError('Invalid response type', 'validation', data);
    }

    if (!messageType || !['text', 'json', 'image', 'chart', 'error'].includes(messageType)) {
      throw new N8NError('Invalid message type', 'validation', data);
    }

    return {
      type,
      messageType,
      content,
      metadata: metadata || {}
    };
  }

  /**
   * Cancel ongoing request
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
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