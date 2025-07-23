/**
 * MockAPI Client
 * Handles session and message persistence using MockAPI service
 */

import { ChatSession, Message, MockAPISession, MockAPIMessage, ApiResponse } from '../types';

export class MockAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'MockAPIError';
  }
}

export interface MockAPIConfig {
  baseUrl: string;
  projectId: string;
  timeout?: number;
}

export class MockAPIClient {
  private config: Required<MockAPIConfig>;
  private baseUrl: string;

  constructor(config: MockAPIConfig) {
    this.config = {
      timeout: 10000,
      ...config
    };
    this.baseUrl = `${this.config.baseUrl}/projects/${this.config.projectId}`;
  }

  /**
   * Generic API request handler
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const { timeout } = this.config;

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: AbortSignal.timeout(timeout),
        ...options,
      });

      if (!response.ok) {
        throw new MockAPIError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof MockAPIError) {
        throw error;
      }
      
      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          throw new MockAPIError('Request timeout');
        }
        
        if (error.message.includes('fetch')) {
          throw new MockAPIError('Network error', undefined, error);
        }
      }
      
      throw new MockAPIError('Unexpected error', undefined, error);
    }
  }

  // Session Management

  /**
   * Get all sessions
   */
  async getSessions(): Promise<ChatSession[]> {
    const sessions = await this.request<MockAPISession[]>('/sessions');
    return sessions.map(this.transformSession);
  }

  /**
   * Get session by ID
   */
  async getSession(id: string): Promise<ChatSession | null> {
    try {
      const session = await this.request<MockAPISession>(`/sessions/${id}`);
      return this.transformSession(session);
    } catch (error) {
      if (error instanceof MockAPIError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Create new session
   */
  async createSession(name: string): Promise<ChatSession> {
    const now = new Date().toISOString();
    const sessionData: Omit<MockAPISession, 'id'> = {
      name,
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
      lastActivity: now,
      isActive: true
    };

    const session = await this.request<MockAPISession>('/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });

    return this.transformSession(session);
  }

  /**
   * Update session
   */
  async updateSession(id: string, updates: Partial<Pick<ChatSession, 'name'>>): Promise<ChatSession> {
    const updateData: Partial<MockAPISession> = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const session = await this.request<MockAPISession>(`/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });

    return this.transformSession(session);
  }

  /**
   * Delete session
   */
  async deleteSession(id: string): Promise<void> {
    await this.request(`/sessions/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(id: string): Promise<void> {
    const updateData = {
      lastActivity: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await this.request(`/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  // Message Management

  /**
   * Get messages for a session
   */
  async getMessages(sessionId: string): Promise<Message[]> {
    const messages = await this.request<MockAPIMessage[]>(`/messages?sessionId=${sessionId}`);
    return messages.map(this.transformMessage).sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  /**
   * Create new message
   */
  async createMessage(message: Omit<Message, 'id'>): Promise<Message> {
    const messageData: Omit<MockAPIMessage, 'id'> = {
      sessionId: message.sessionId,
      content: message.content,
      type: message.type,
      timestamp: message.timestamp.toISOString(),
      responseType: message.responseData?.type,
      responseContent: message.responseData?.content,
      responseMetadata: message.responseData?.metadata
    };

    const createdMessage = await this.request<MockAPIMessage>('/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });

    // Update session message count and activity
    await this.incrementSessionMessageCount(message.sessionId);

    return this.transformMessage(createdMessage);
  }

  /**
   * Update message
   */
  async updateMessage(id: string, updates: Partial<Message>): Promise<Message> {
    const updateData: Partial<MockAPIMessage> = {
      content: updates.content,
      responseType: updates.responseData?.type,
      responseContent: updates.responseData?.content,
      responseMetadata: updates.responseData?.metadata
    };

    const message = await this.request<MockAPIMessage>(`/messages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });

    return this.transformMessage(message);
  }

  /**
   * Delete message
   */
  async deleteMessage(id: string): Promise<void> {
    await this.request(`/messages/${id}`, {
      method: 'DELETE',
    });
  }

  // Utility Methods

  /**
   * Increment session message count
   */
  private async incrementSessionMessageCount(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      await this.request(`/sessions/${sessionId}`, {
        method: 'PUT',
        body: JSON.stringify({
          messageCount: session.metadata.messageCount + 1,
          lastActivity: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }),
      });
    }
  }

  /**
   * Transform MockAPI session to ChatSession
   */
  private transformSession(session: MockAPISession): ChatSession {
    return {
      id: session.id,
      name: session.name,
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt),
      messages: [], // Messages are loaded separately
      metadata: {
        messageCount: session.messageCount,
        lastActivity: new Date(session.lastActivity),
        isActive: session.isActive
      }
    };
  }

  /**
   * Transform MockAPI message to Message
   */
  private transformMessage(message: MockAPIMessage): Message {
    return {
      id: message.id,
      sessionId: message.sessionId,
      content: message.content,
      type: message.type,
      timestamp: new Date(message.timestamp),
      responseData: message.responseType ? {
        type: message.responseType,
        content: message.responseContent,
        metadata: message.responseMetadata
      } : undefined
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.request('/sessions?limit=1');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear all data (for testing)
   */
  async clearAllData(): Promise<void> {
    const [sessions, messages] = await Promise.all([
      this.getSessions(),
      this.request<MockAPIMessage[]>('/messages')
    ]);

    // Delete all messages
    await Promise.all(
      messages.map(message => this.deleteMessage(message.id))
    );

    // Delete all sessions
    await Promise.all(
      sessions.map(session => this.deleteSession(session.id))
    );
  }
}

// Factory function
export function createMockAPIClient(config: MockAPIConfig): MockAPIClient {
  return new MockAPIClient(config);
}

// Hook for React components
export function useMockAPIClient() {
  const client = createMockAPIClient({
    baseUrl: process.env.NEXT_PUBLIC_MOCKAPI_BASE_URL!,
    projectId: process.env.NEXT_PUBLIC_MOCKAPI_PROJECT_ID!
  });

  return client;
}

// Example usage
export const mockAPIExample = () => {
  const client = createMockAPIClient({
    baseUrl: 'https://mockapi.io/api/v1',
    projectId: 'your-project-id'
  });

  // Example: Session management
  const sessionOperations = {
    async createNewSession() {
      try {
        const session = await client.createSession('New Chat Session');
        console.log('Created session:', session);
        return session;
      } catch (error) {
        console.error('Failed to create session:', error);
      }
    },

    async loadSessions() {
      try {
        const sessions = await client.getSessions();
        console.log('Loaded sessions:', sessions);
        return sessions;
      } catch (error) {
        console.error('Failed to load sessions:', error);
      }
    },

    async renameSession(id: string, newName: string) {
      try {
        const session = await client.updateSession(id, { name: newName });
        console.log('Renamed session:', session);
        return session;
      } catch (error) {
        console.error('Failed to rename session:', error);
      }
    }
  };

  // Example: Message management
  const messageOperations = {
    async sendMessage(sessionId: string, content: string) {
      try {
        const message = await client.createMessage({
          sessionId,
          content,
          type: 'user',
          timestamp: new Date()
        });
        console.log('Sent message:', message);
        return message;
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    },

    async loadMessages(sessionId: string) {
      try {
        const messages = await client.getMessages(sessionId);
        console.log('Loaded messages:', messages);
        return messages;
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    }
  };

  return { sessionOperations, messageOperations };
};

// Utility functions
export const mockAPIUtils = {
  /**
   * Format error for user display
   */
  formatError(error: MockAPIError): string {
    if (error.status === 404) {
      return 'Resource not found';
    }
    if (error.status === 429) {
      return 'Too many requests. Please wait and try again.';
    }
    if (error.status && error.status >= 500) {
      return 'Server error. Please try again later.';
    }
    return 'An error occurred. Please try again.';
  },

  /**
   * Validate session name
   */
  validateSessionName(name: string): string | null {
    if (!name.trim()) {
      return 'Session name cannot be empty';
    }
    if (name.length > 100) {
      return 'Session name cannot exceed 100 characters';
    }
    return null;
  }
};