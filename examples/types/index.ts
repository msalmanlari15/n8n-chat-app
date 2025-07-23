/**
 * Type definitions for the Chat Application
 * Based on the technical specifications in mvp_prd.md
 */

// Core data models
export interface ChatSession {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
  metadata: {
    messageCount: number;
    lastActivity: Date;
    isActive: boolean;
  };
}

export interface Message {
  id: string;
  sessionId: string;
  content: string;
  type: 'user' | 'assistant' | 'interim';
  timestamp: Date;
  responseData?: ResponseData;
}

export interface ResponseData {
  type: 'text' | 'json' | 'image' | 'chart';
  content: any;
  metadata?: Record<string, any>;
}

// n8n Integration types
export interface N8NRequest {
  username: string;
  message: string;
  sessionId: string;
  timestamp: Date;
}

export interface N8NResponse {
  type: 'interim' | 'final';
  messageType: 'text' | 'json' | 'image' | 'chart' | 'error';
  content: any;
  metadata?: {
    timestamp: Date;
    processingTime?: number;
    source?: string;
  };
}

// UI State types
export interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  isLoading: boolean;
  error: string | null;
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
}

export interface MessageInputState {
  value: string;
  isSubmitting: boolean;
  error: string | null;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

// MockAPI integration types
export interface MockAPISession {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastActivity: string;
  isActive: boolean;
}

export interface MockAPIMessage {
  id: string;
  sessionId: string;
  content: string;
  type: 'user' | 'assistant' | 'interim';
  timestamp: string;
  responseType?: 'text' | 'json' | 'image' | 'chart';
  responseContent?: any;
  responseMetadata?: Record<string, any>;
}

// Component prop types
export interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  onRetry?: () => void;
}

export interface SessionListProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onSessionRename: (sessionId: string, newName: string) => void;
  onSessionDelete: (sessionId: string) => void;
  onNewSession: () => void;
}

export interface MessageInputProps {
  onSubmit: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

// Chart data types for ShadCN Charts
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
}

// Theme types
export interface ThemeColors {
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
  border: string;
  ring: string;
}

export interface ThemeConfig {
  light: ThemeColors;
  dark: ThemeColors;
}

// Environment configuration
export interface EnvConfig {
  N8N_WEBHOOK_URL: string;
  N8N_STREAMING_URL: string;
  MOCKAPI_BASE_URL: string;
  MOCKAPI_PROJECT_ID: string;
}

// Error types
export interface ChatError {
  type: 'network' | 'validation' | 'server' | 'timeout';
  message: string;
  details?: any;
  timestamp: Date;
}

// Utility types
export type MessageType = Message['type'];
export type ResponseType = ResponseData['type'];
export type Theme = 'light' | 'dark';
export type SessionAction = 'create' | 'rename' | 'delete' | 'switch';