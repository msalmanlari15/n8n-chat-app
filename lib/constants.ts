export const APP_CONFIG = {
  name: 'Chat Application',
  version: '1.0.0',
  description: 'Modern chat application with n8n workflow integration',
} as const;

export const API_CONFIG = {
  n8n: {
    webhookUrl: process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/chat',
    streamingUrl: process.env.NEXT_PUBLIC_N8N_STREAMING_URL || 'https://your-n8n-instance.com/webhook/stream',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
  },
  mockApi: {
    baseUrl: process.env.NEXT_PUBLIC_MOCKAPI_BASE_URL || 'https://mockapi.io/api/v1',
    projectId: process.env.NEXT_PUBLIC_MOCKAPI_PROJECT_ID || 'your-project-id',
    timeout: 10000,
  },
} as const;

export const UI_CONFIG = {
  sidebar: {
    width: 280,
    collapsedWidth: 64,
    animationDuration: 200,
  },
  chat: {
    maxMessageLength: 4000,
    typingIndicatorDelay: 500,
    messageRetryAttempts: 3,
  },
  theme: {
    defaultTheme: 'light' as const,
    storageKey: 'chat-theme',
  },
} as const;

export const COLORS = {
  earth: {
    sand: '#f5f0e1',
    clay: '#daa578',
    moss: '#4c6f4a',
    stone: '#a69b8e',
    bark: '#654321',
  },
  semantic: {
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
} as const;

export const KEYBOARD_SHORTCUTS = {
  newSession: 'mod+n',
  search: 'mod+k',
  toggleSidebar: 'mod+\\',
  toggleTheme: 'mod+shift+t',
  sendMessage: 'enter',
  newLine: 'shift+enter',
} as const;

export const VALIDATION_RULES = {
  session: {
    nameMaxLength: 100,
    nameMinLength: 1,
  },
  message: {
    contentMaxLength: 4000,
    contentMinLength: 1,
  },
} as const;

export const ERROR_MESSAGES = {
  network: 'Network connection failed. Please check your internet connection.',
  timeout: 'Request timed out. Please try again.',
  server: 'Server error occurred. Please try again later.',
  validation: 'Invalid input. Please check your data.',
  notFound: 'Resource not found.',
  rateLimit: 'Too many requests. Please wait and try again.',
  unknown: 'An unexpected error occurred. Please try again.',
} as const;

export const STORAGE_KEYS = {
  theme: 'chat-theme',
  sessionId: 'current-session-id',
  sidebarCollapsed: 'sidebar-collapsed',
} as const;