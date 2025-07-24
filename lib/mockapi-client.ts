/**
 * MockAPI Client with localStorage fallback
 * Handles session and message persistence using MockAPI service or localStorage
 */

import { ChatSession, Message, MockAPISession, MockAPIMessage, ApiResponse } from '@/types';

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

// LocalStorage fallback implementation
class LocalStorageMockAPIClient {
  private readonly SESSIONS_KEY = 'chat-sessions';
  private readonly MESSAGES_KEY = 'chat-messages';

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getStorageData<T>(key: string): T[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private setStorageData<T>(key: string, data: T[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  // Session Management
  async getSessions(): Promise<ChatSession[]> {
    const sessions = this.getStorageData<MockAPISession>(this.SESSIONS_KEY);
    return sessions.map(this.transformSession);
  }

  async getSession(id: string): Promise<ChatSession | null> {
    const sessions = this.getStorageData<MockAPISession>(this.SESSIONS_KEY);
    const session = sessions.find(s => s.id === id);
    return session ? this.transformSession(session) : null;
  }

  async createSession(name: string): Promise<ChatSession> {
    const now = new Date().toISOString();
    const sessionData: MockAPISession = {
      id: this.generateId(),
      name,
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
      lastActivity: now,
      isActive: true
    };

    const sessions = this.getStorageData<MockAPISession>(this.SESSIONS_KEY);
    sessions.push(sessionData);
    this.setStorageData(this.SESSIONS_KEY, sessions);

    return this.transformSession(sessionData);
  }

  async updateSession(id: string, updates: Partial<Pick<ChatSession, 'name'>>): Promise<ChatSession> {
    const sessions = this.getStorageData<MockAPISession>(this.SESSIONS_KEY);
    const index = sessions.findIndex(s => s.id === id);
    
    if (index === -1) {
      throw new MockAPIError('Session not found', 404);
    }

    sessions[index] = { 
      ...sessions[index], 
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    this.setStorageData(this.SESSIONS_KEY, sessions);
    return this.transformSession(sessions[index]);
  }

  async deleteSession(id: string): Promise<void> {
    const sessions = this.getStorageData<MockAPISession>(this.SESSIONS_KEY);
    const filteredSessions = sessions.filter(s => s.id !== id);
    this.setStorageData(this.SESSIONS_KEY, filteredSessions);
    
    // Also delete associated messages
    const messages = this.getStorageData<MockAPIMessage>(this.MESSAGES_KEY);
    const filteredMessages = messages.filter(m => m.sessionId !== id);
    this.setStorageData(this.MESSAGES_KEY, filteredMessages);
  }

  async updateSessionActivity(id: string): Promise<void> {
    const sessions = this.getStorageData<MockAPISession>(this.SESSIONS_KEY);
    const index = sessions.findIndex(s => s.id === id);
    
    if (index !== -1) {
      sessions[index].lastActivity = new Date().toISOString();
      sessions[index].updatedAt = new Date().toISOString();
      this.setStorageData(this.SESSIONS_KEY, sessions);
    }
  }

  // Message Management
  async getMessages(sessionId: string): Promise<Message[]> {
    const messages = this.getStorageData<MockAPIMessage>(this.MESSAGES_KEY);
    return messages
      .filter(m => m.sessionId === sessionId)
      .map(this.transformMessage)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async createMessage(message: Omit<Message, 'id'>): Promise<Message> {
    const messageId = this.generateId();
    console.log('LocalStorage: Creating message with ID:', messageId, 'type:', message.type);
    
    const messageData: MockAPIMessage = {
      id: messageId,
      sessionId: message.sessionId,
      content: message.content,
      type: message.type,
      timestamp: message.timestamp.toISOString(),
      responseType: message.responseData?.type,
      responseContent: message.responseData?.content,
      responseMetadata: message.responseData?.metadata
    };

    const messages = this.getStorageData<MockAPIMessage>(this.MESSAGES_KEY);
    
    // Check if a similar message already exists (same content, type, session)
    const existingMessage = messages.find(m => 
      m.sessionId === message.sessionId && 
      m.content === message.content && 
      m.type === message.type &&
      Math.abs(new Date(m.timestamp).getTime() - message.timestamp.getTime()) < 1000 // Within 1 second
    );
    
    if (existingMessage) {
      console.log('LocalStorage: Similar message already exists, returning existing:', existingMessage.id);
      return this.transformMessage(existingMessage);
    }
    
    messages.push(messageData);
    this.setStorageData(this.MESSAGES_KEY, messages);
    console.log('LocalStorage: Message saved successfully:', messageId);

    // Update session message count
    await this.incrementSessionMessageCount(message.sessionId);

    return this.transformMessage(messageData);
  }

  async updateMessage(id: string, updates: Partial<Message>): Promise<Message> {
    const messages = this.getStorageData<MockAPIMessage>(this.MESSAGES_KEY);
    const index = messages.findIndex(m => m.id === id);
    
    if (index === -1) {
      throw new MockAPIError('Message not found', 404);
    }

    messages[index] = {
      ...messages[index],
      content: updates.content || messages[index].content,
      responseType: updates.responseData?.type || messages[index].responseType,
      responseContent: updates.responseData?.content || messages[index].responseContent,
      responseMetadata: updates.responseData?.metadata || messages[index].responseMetadata
    };
    
    this.setStorageData(this.MESSAGES_KEY, messages);
    return this.transformMessage(messages[index]);
  }

  async deleteMessage(id: string): Promise<void> {
    const messages = this.getStorageData<MockAPIMessage>(this.MESSAGES_KEY);
    const filteredMessages = messages.filter(m => m.id !== id);
    this.setStorageData(this.MESSAGES_KEY, filteredMessages);
  }

  private async incrementSessionMessageCount(sessionId: string): Promise<void> {
    const sessions = this.getStorageData<MockAPISession>(this.SESSIONS_KEY);
    const index = sessions.findIndex(s => s.id === sessionId);
    
    if (index !== -1) {
      sessions[index].messageCount += 1;
      sessions[index].lastActivity = new Date().toISOString();
      sessions[index].updatedAt = new Date().toISOString();
      this.setStorageData(this.SESSIONS_KEY, sessions);
    }
  }

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

  private transformMessage(message: MockAPIMessage): Message {
    let responseData = undefined;
    
    if (message.responseType) {
      // Check if stored content is the problematic mixed format
      let processedContent = message.responseContent;
      let processedType = message.responseType;
      
      // If we have content that looks like mixed format but wasn't detected properly
      if (processedContent && typeof processedContent === 'object' && !Array.isArray(processedContent)) {
        const keys = Object.keys(processedContent);
        const hasText = keys.some(key => key.startsWith('text'));
        const hasChart = keys.some(key => key.startsWith('chart'));
        
        if (hasText || hasChart) {
          // Convert to mixed format and wrap in array
          processedContent = [processedContent];
          processedType = 'mixed';
          console.log('MockAPI: Converted stored mixed content to array format');
        }
      }
      
      responseData = {
        type: processedType,
        content: processedContent,
        metadata: message.responseMetadata
      };
    }
    
    return {
      id: message.id,
      sessionId: message.sessionId,
      content: message.content,
      type: message.type,
      timestamp: new Date(message.timestamp),
      responseData
    };
  }

  async healthCheck(): Promise<boolean> {
    return typeof window !== 'undefined' && 'localStorage' in window;
  }

  async clearAllData(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.SESSIONS_KEY);
      localStorage.removeItem(this.MESSAGES_KEY);
    }
  }
}

export class MockAPIClient {
  private config: Required<MockAPIConfig>;
  private baseUrl: string;
  private fallbackClient: LocalStorageMockAPIClient;
  private useFallback: boolean = false;

  constructor(config: MockAPIConfig) {
    this.config = {
      timeout: 10000,
      ...config
    };
    this.baseUrl = `${this.config.baseUrl}/projects/${this.config.projectId}`;
    this.fallbackClient = new LocalStorageMockAPIClient();
    
    // Check if we should use fallback (invalid URLs indicate development mode)
    this.useFallback = config.baseUrl.includes('mockapi.io') && config.projectId === 'your-project-id';
  }

  /**
   * Generic API request handler
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (this.useFallback) {
      throw new MockAPIError('Using fallback client', 0);
    }

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
  async getSessions(): Promise<ChatSession[]> {
    try {
      if (this.useFallback) {
        return await this.fallbackClient.getSessions();
      }
      const sessions = await this.request<MockAPISession[]>('/sessions');
      return sessions.map(this.transformSession);
    } catch (error) {
      console.warn('MockAPI failed, using localStorage fallback:', error);
      return await this.fallbackClient.getSessions();
    }
  }

  async getSession(id: string): Promise<ChatSession | null> {
    try {
      if (this.useFallback) {
        return await this.fallbackClient.getSession(id);
      }
      const session = await this.request<MockAPISession>(`/sessions/${id}`);
      return this.transformSession(session);
    } catch (error) {
      if (error instanceof MockAPIError && error.status === 404) {
        return null;
      }
      console.warn('MockAPI failed, using localStorage fallback:', error);
      return await this.fallbackClient.getSession(id);
    }
  }

  async createSession(name: string): Promise<ChatSession> {
    try {
      if (this.useFallback) {
        return await this.fallbackClient.createSession(name);
      }
      
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
    } catch (error) {
      console.warn('MockAPI failed, using localStorage fallback:', error);
      return await this.fallbackClient.createSession(name);
    }
  }

  async updateSession(id: string, updates: Partial<Pick<ChatSession, 'name'>>): Promise<ChatSession> {
    try {
      if (this.useFallback) {
        return await this.fallbackClient.updateSession(id, updates);
      }

      const updateData: Partial<MockAPISession> = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      const session = await this.request<MockAPISession>(`/sessions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      return this.transformSession(session);
    } catch (error) {
      console.warn('MockAPI failed, using localStorage fallback:', error);
      return await this.fallbackClient.updateSession(id, updates);
    }
  }

  async deleteSession(id: string): Promise<void> {
    try {
      if (this.useFallback) {
        return await this.fallbackClient.deleteSession(id);
      }

      await this.request(`/sessions/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.warn('MockAPI failed, using localStorage fallback:', error);
      return await this.fallbackClient.deleteSession(id);
    }
  }

  async updateSessionActivity(id: string): Promise<void> {
    try {
      if (this.useFallback) {
        return await this.fallbackClient.updateSessionActivity(id);
      }

      const updateData = {
        lastActivity: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.request(`/sessions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
    } catch (error) {
      console.warn('MockAPI failed, using localStorage fallback:', error);
      return await this.fallbackClient.updateSessionActivity(id);
    }
  }

  // Message Management
  async getMessages(sessionId: string): Promise<Message[]> {
    try {
      if (this.useFallback) {
        return await this.fallbackClient.getMessages(sessionId);
      }

      const messages = await this.request<MockAPIMessage[]>(`/messages?sessionId=${sessionId}`);
      return messages.map(this.transformMessage).sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    } catch (error) {
      console.warn('MockAPI failed, using localStorage fallback:', error);
      return await this.fallbackClient.getMessages(sessionId);
    }
  }

  async createMessage(message: Omit<Message, 'id'>): Promise<Message> {
    try {
      if (this.useFallback) {
        return await this.fallbackClient.createMessage(message);
      }

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
    } catch (error) {
      console.warn('MockAPI failed, using localStorage fallback:', error);
      return await this.fallbackClient.createMessage(message);
    }
  }

  async updateMessage(id: string, updates: Partial<Message>): Promise<Message> {
    try {
      if (this.useFallback) {
        return await this.fallbackClient.updateMessage(id, updates);
      }

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
    } catch (error) {
      console.warn('MockAPI failed, using localStorage fallback:', error);
      return await this.fallbackClient.updateMessage(id, updates);
    }
  }

  async deleteMessage(id: string): Promise<void> {
    try {
      if (this.useFallback) {
        return await this.fallbackClient.deleteMessage(id);
      }

      await this.request(`/messages/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.warn('MockAPI failed, using localStorage fallback:', error);
      return await this.fallbackClient.deleteMessage(id);
    }
  }

  // Utility Methods
  private async incrementSessionMessageCount(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      try {
        await this.request(`/sessions/${sessionId}`, {
          method: 'PUT',
          body: JSON.stringify({
            messageCount: session.metadata.messageCount + 1,
            lastActivity: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }),
        });
      } catch (error) {
        console.warn('Failed to update session message count:', error);
      }
    }
  }

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

  private transformMessage(message: MockAPIMessage): Message {
    let responseData = undefined;
    
    if (message.responseType) {
      // Check if stored content is the problematic mixed format
      let processedContent = message.responseContent;
      let processedType = message.responseType;
      
      // If we have content that looks like mixed format but wasn't detected properly
      if (processedContent && typeof processedContent === 'object' && !Array.isArray(processedContent)) {
        const keys = Object.keys(processedContent);
        const hasText = keys.some(key => key.startsWith('text'));
        const hasChart = keys.some(key => key.startsWith('chart'));
        
        if (hasText || hasChart) {
          // Convert to mixed format and wrap in array
          processedContent = [processedContent];
          processedType = 'mixed';
          console.log('MockAPI: Converted stored mixed content to array format');
        }
      }
      
      responseData = {
        type: processedType,
        content: processedContent,
        metadata: message.responseMetadata
      };
    }
    
    return {
      id: message.id,
      sessionId: message.sessionId,
      content: message.content,
      type: message.type,
      timestamp: new Date(message.timestamp),
      responseData
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (this.useFallback) {
        return await this.fallbackClient.healthCheck();
      }
      await this.request('/sessions?limit=1');
      return true;
    } catch {
      return await this.fallbackClient.healthCheck();
    }
  }

  async clearAllData(): Promise<void> {
    try {
      if (this.useFallback) {
        return await this.fallbackClient.clearAllData();
      }

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
    } catch (error) {
      console.warn('MockAPI failed, using localStorage fallback:', error);
      return await this.fallbackClient.clearAllData();
    }
  }
}

// Factory function
export function createMockAPIClient(config: MockAPIConfig): MockAPIClient {
  return new MockAPIClient(config);
}

// Hook for React components
export function useMockAPIClient() {
  const client = createMockAPIClient({
    baseUrl: process.env.NEXT_PUBLIC_MOCKAPI_BASE_URL || 'https://mockapi.io/api/v1',
    projectId: process.env.NEXT_PUBLIC_MOCKAPI_PROJECT_ID || 'your-project-id'
  });

  return client;
}

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