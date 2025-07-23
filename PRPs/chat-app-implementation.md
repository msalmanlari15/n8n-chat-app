name: "Chat App Implementation PRP - Complete MVP"
description: |

## Purpose
Complete implementation of a modern, real-time chat application with n8n workflow integration, session management, and dynamic response rendering. This PRP provides comprehensive context for implementing the full MVP as specified in mvp_prd.md.

## Core Principles
1. **Context is King**: All necessary documentation, examples, and patterns included
2. **Validation Loops**: Executable tests and checks for iterative refinement
3. **Information Dense**: Keywords and patterns from existing codebase examples
4. **Progressive Success**: Foundation first, then advanced features
5. **Global rules**: Follow all rules in CLAUDE.md and mvp_prd.md specifications

---

## Goal
Build a complete, production-ready chat application with real-time n8n workflow integration, persistent session management, and dynamic response rendering. The application should provide seamless user experience with interim workflow progress messages, collapsible sidebar navigation, and earth-toned design system.

## Why
- **Business Value**: Enables real-time workflow visibility and user engagement
- **User Experience**: Modern, accessible interface with optimal space utilization
- **Technical Innovation**: Dual-endpoint strategy for real-time updates without generic loading states
- **Scalability**: Modular architecture supporting future enhancements

## What
A Next.js 14+ application with:
- Real-time chat interface with message bubbles and streaming responses
- Collapsible sidebar (sidebar-07) with session management
- n8n webhook integration with interim message streaming
- MockAPI persistence for sessions and messages
- Dynamic response rendering (text, JSON, images, charts)
- Earth-toned design system with light/dark theme
- Responsive design with accessibility features

### Success Criteria
- [ ] User can create, rename, delete, and switch between chat sessions
- [ ] Messages sent to n8n webhook with real-time interim updates
- [ ] Final responses stream character-by-character without generic loading states
- [ ] Sidebar collapses/expands with icon mode for space optimization
- [ ] Dynamic content rendering supports all specified types (text, JSON, images, charts)
- [ ] Light/dark theme toggle with persistent preference
- [ ] Responsive design works on desktop, tablet, and mobile
- [ ] All TypeScript compilation passes without errors
- [ ] Application builds successfully for production

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Core Technologies
- url: https://nextjs.org/docs/app
  why: Next.js 14+ App Router patterns and best practices
  critical: App Router directory structure and layout patterns

- url: https://ui.shadcn.com/docs/components
  why: ShadCN UI component library and usage patterns
  critical: Sidebar component (sidebar-07) and theming system

- url: https://ui.shadcn.com/docs/components/sidebar
  why: Collapsible sidebar implementation patterns
  critical: Icon mode and responsive behavior

- url: https://tailwindcss.com/docs/customizing-colors
  why: Custom CSS variables and color system implementation
  critical: Theme configuration and variable usage

- url: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/
  why: n8n webhook integration patterns and payload structure
  critical: Request/response format and error handling

- url: https://mockapi.io/docs
  why: MockAPI integration for data persistence
  critical: CRUD operations and data modeling

# MUST READ - Existing Patterns
- file: examples/types/index.ts
  why: Complete TypeScript type definitions for the application
  critical: Data models match mvp_prd.md specifications exactly

- file: examples/components/ChatMessage.tsx
  why: Message display component with dynamic content rendering
  critical: ResponseRenderer pattern for different content types

- file: examples/lib/n8n-client.ts
  why: n8n webhook client with streaming support and error handling
  critical: Dual-endpoint strategy and retry logic implementation

- file: examples/lib/mockapi-client.ts
  why: MockAPI client for session and message persistence
  critical: CRUD operations and data transformation patterns

- file: examples/hooks/useChat.ts
  why: Complete chat state management with all operations
  critical: Session management and message handling patterns

- file: examples/themes/globals.css
  why: Earth-toned design system with custom CSS variables
  critical: Theme colors and component styling patterns

- file: examples/n8n/webhook-examples.md
  why: n8n webhook integration examples and response formats
  critical: Request/response structure and error handling patterns

- docfile: mvp_prd.md
  why: Complete technical specifications and acceptance criteria
  critical: All implementation phases and requirements
```

### Current Codebase Structure
```bash
Test-Chat-App/
├── CLAUDE.md                  # Development guidelines
├── INITIAL.md                 # Feature specification
├── mvp_prd.md                 # Complete technical requirements
├── examples/                  # Implementation examples
│   ├── components/            # React components
│   ├── hooks/                 # Custom hooks
│   ├── lib/                   # API clients
│   ├── types/                 # TypeScript definitions
│   ├── themes/                # Design system
│   └── n8n/                   # Integration examples
└── PRPs/                      # This PRP
```

### Desired Codebase Structure
```bash
Test-Chat-App/
├── app/                       # Next.js App Router
│   ├── layout.tsx             # Root layout with providers
│   ├── page.tsx               # Main chat page
│   ├── globals.css            # Global styles with earth theme
│   └── providers.tsx          # Context providers
├── components/                # React components
│   ├── ui/                    # ShadCN UI components
│   ├── chat/                  # Chat-specific components
│   │   ├── ChatMessage.tsx    # Message display
│   │   ├── MessageInput.tsx   # Message input
│   │   ├── ResponseRenderer.tsx # Dynamic content rendering
│   │   └── StreamingIndicator.tsx # Real-time indicators
│   ├── sidebar/               # Sidebar components
│   │   ├── Sidebar.tsx        # Main sidebar (sidebar-07)
│   │   ├── SessionList.tsx    # Session management
│   │   └── ThemeToggle.tsx    # Theme switcher
│   └── layout/                # Layout components
│       └── MainLayout.tsx     # Main application layout
├── hooks/                     # Custom React hooks
│   ├── useChat.ts             # Chat state management
│   ├── useTheme.ts            # Theme management
│   └── useSession.ts          # Session operations
├── lib/                       # Utility libraries
│   ├── n8n-client.ts          # n8n webhook client
│   ├── mockapi-client.ts      # MockAPI client
│   ├── utils.ts               # Utility functions
│   └── constants.ts           # Application constants
├── types/                     # TypeScript definitions
│   └── index.ts               # All type definitions
├── context/                   # React contexts
│   ├── ChatContext.tsx        # Chat state context
│   └── ThemeContext.tsx       # Theme context
├── .env.local                 # Environment variables
├── next.config.js             # Next.js configuration
├── tailwind.config.js         # Tailwind configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies
```

### Known Gotchas & Library Quirks
```typescript
// CRITICAL: Next.js App Router requires specific patterns
// App Router uses server components by default - mark client components with 'use client'
// Dynamic imports needed for client-only components

// CRITICAL: ShadCN UI setup requirements
// Must install and configure properly with shadcn-ui CLI
// Components need proper import paths and CSS variables

// CRITICAL: n8n webhook integration
// Streaming endpoint requires Server-Sent Events (SSE) handling
// AbortController needed for proper cleanup
// Retry logic essential for production reliability

// CRITICAL: MockAPI limitations
// Rate limiting at 10 requests/second
// Data transformation required between API and app models
// Error handling must cover network timeouts and 429 responses

// CRITICAL: Theme system implementation
// CSS variables must be properly configured in tailwind.config.js
// Theme persistence requires localStorage with SSR considerations
// Dark mode toggle needs proper Tailwind class management
```

## Implementation Blueprint

### Data Models and Structure
Create comprehensive TypeScript models ensuring type safety and API consistency:

```typescript
// Core models from examples/types/index.ts
interface ChatSession {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
  metadata: SessionMetadata;
}

interface Message {
  id: string;
  sessionId: string;
  content: string;
  type: 'user' | 'assistant' | 'interim';
  timestamp: Date;
  responseData?: ResponseData;
}

interface N8NRequest {
  username: string;
  message: string;
  sessionId: string;
  timestamp: Date;
}

interface N8NResponse {
  type: 'interim' | 'final';
  messageType: 'text' | 'json' | 'image' | 'chart' | 'error';
  content: any;
  metadata?: ResponseMetadata;
}
```

### List of Tasks to Complete the PRP (in order)

```yaml
Task 1: Project Foundation Setup
CREATE Next.js 14+ project with App Router:
  - Initialize with TypeScript and Tailwind CSS
  - Configure shadcn-ui with proper component structure
  - Set up proper directory structure as specified above
  - Configure environment variables (.env.local)

Task 2: Design System Implementation
CREATE app/globals.css:
  - COPY earth-toned theme variables from examples/themes/globals.css
  - MODIFY with proper Tailwind CSS configuration
  - ENSURE theme switching functionality works

CREATE tailwind.config.js:
  - CONFIGURE custom colors and CSS variables
  - SETUP theme configuration for light/dark modes
  - INCLUDE ShadCN UI plugin configuration

Task 3: TypeScript Configuration
CREATE types/index.ts:
  - COPY all type definitions from examples/types/index.ts
  - ENSURE compatibility with Next.js App Router
  - VALIDATE all interfaces match mvp_prd.md specifications

Task 4: Core Library Setup
CREATE lib/n8n-client.ts:
  - COPY n8n client implementation from examples/lib/n8n-client.ts
  - MODIFY for Next.js environment compatibility
  - ENSURE proper error handling and retry logic

CREATE lib/mockapi-client.ts:
  - COPY MockAPI client from examples/lib/mockapi-client.ts
  - CONFIGURE for production environment
  - IMPLEMENT proper data transformation methods

Task 5: Context and State Management
CREATE context/ChatContext.tsx:
  - IMPLEMENT chat state management with useChat hook
  - MIRROR pattern from examples/hooks/useChat.ts
  - ENSURE proper session and message operations

CREATE context/ThemeContext.tsx:
  - IMPLEMENT theme switching with persistence
  - HANDLE SSR considerations for localStorage
  - PROVIDE theme toggle functionality

Task 6: Layout and Navigation
CREATE components/layout/MainLayout.tsx:
  - IMPLEMENT main application layout structure
  - INCLUDE sidebar and chat area containers
  - ENSURE responsive design principles

CREATE components/sidebar/Sidebar.tsx:
  - IMPLEMENT collapsible sidebar-07 pattern
  - MIRROR ShadCN UI sidebar component structure
  - INCLUDE session management and theme toggle

Task 7: Chat Interface Components
CREATE components/chat/ChatMessage.tsx:
  - COPY message display component from examples/components/ChatMessage.tsx
  - IMPLEMENT dynamic response rendering
  - ENSURE proper styling with earth-toned theme

CREATE components/chat/MessageInput.tsx:
  - IMPLEMENT message input with auto-expand textarea
  - HANDLE message sending with proper validation
  - INCLUDE send button and keyboard shortcuts

CREATE components/chat/ResponseRenderer.tsx:
  - IMPLEMENT dynamic content rendering for all types
  - HANDLE text, JSON, image, and chart responses
  - INTEGRATE with ShadCN Chart components

Task 8: Session Management
CREATE components/sidebar/SessionList.tsx:
  - IMPLEMENT session CRUD operations
  - HANDLE session switching and state management
  - INCLUDE session metadata display

CREATE hooks/useSession.ts:
  - IMPLEMENT session operations hook
  - HANDLE create, rename, delete, switch operations
  - ENSURE proper error handling and validation

Task 9: Real-time Integration
IMPLEMENT n8n webhook integration:
  - SETUP message sending with webhook client
  - HANDLE interim message streaming
  - IMPLEMENT proper error handling and retry logic

IMPLEMENT streaming message display:
  - HANDLE Server-Sent Events for interim messages
  - DISPLAY streaming indicators during processing
  - ENSURE proper cleanup and error recovery

Task 10: Advanced Features
IMPLEMENT dynamic response rendering:
  - HANDLE all response types (text, JSON, images, charts)
  - INTEGRATE ShadCN Chart components for data visualization
  - ENSURE proper loading states and error handling

IMPLEMENT theme system:
  - CONFIGURE light/dark mode switching
  - HANDLE theme persistence with localStorage
  - ENSURE proper Tailwind class management

Task 11: Testing and Validation
CREATE comprehensive test suite:
  - UNIT tests for components using React Testing Library
  - INTEGRATION tests for API clients
  - END-TO-END tests for user workflows

IMPLEMENT error handling:
  - HANDLE network errors and timeouts
  - PROVIDE user-friendly error messages
  - IMPLEMENT retry mechanisms where appropriate

Task 12: Production Readiness
OPTIMIZE performance:
  - IMPLEMENT proper code splitting
  - OPTIMIZE bundle size and loading times
  - HANDLE responsive design and mobile optimization

ENSURE accessibility:
  - IMPLEMENT proper ARIA labels and keyboard navigation
  - HANDLE screen reader compatibility
  - FOLLOW WCAG 2.1 AA guidelines
```

### Task 1 Pseudocode
```bash
# Initialize Next.js project
npx create-next-app@latest chat-app --typescript --tailwind --eslint --app

# Install ShadCN UI
npx shadcn-ui@latest init
npx shadcn-ui@latest add sidebar button card input textarea badge toast

# Install additional dependencies
npm install @radix-ui/react-icons lucide-react date-fns

# Configure environment variables
echo "N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/chat" >> .env.local
echo "N8N_STREAMING_URL=https://your-n8n-instance.com/webhook/stream" >> .env.local
echo "NEXT_PUBLIC_MOCKAPI_BASE_URL=https://mockapi.io/api/v1" >> .env.local
echo "NEXT_PUBLIC_MOCKAPI_PROJECT_ID=your-project-id" >> .env.local

# Verify installation
npm run dev
```

### Task 2 Pseudocode
```typescript
// app/globals.css - Earth-toned theme implementation
@tailwind base;
@tailwind components;
@tailwind utilities;

// Import fonts and configure CSS variables
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');

:root {
  --background: 248 245 240; /* Warm beige */
  --foreground: 28 20 16; /* Dark brown */
  --primary: 46 125 50; /* Forest green */
  // ... complete theme variables from examples/themes/globals.css
}

.dark {
  --background: 28 42 31; /* Deep forest */
  --foreground: 248 250 252; /* Light gray */
  // ... dark theme variables
}

// Custom component styles
.chat-message-bubble {
  border-radius: var(--radius);
  transition: all var(--transition-duration) var(--transition-timing);
}
```

### Integration Points
```yaml
NEXT.JS CONFIG:
  - modify: next.config.js
  - add: "experimental: { appDir: true }"
  - configure: TypeScript and ESLint integration

TAILWIND CONFIG:
  - modify: tailwind.config.js
  - add: Custom color palette and CSS variables
  - configure: ShadCN UI plugin and theme system

TYPESCRIPT CONFIG:
  - modify: tsconfig.json
  - add: Proper path mapping for components
  - configure: Strict type checking and Next.js types

PACKAGE.JSON:
  - add: All required dependencies
  - configure: Build and development scripts
  - include: Testing and linting commands
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# Run these FIRST - fix any errors before proceeding
npm run lint                    # ESLint checking
npm run type-check             # TypeScript compilation
npm run build                  # Next.js build verification

# Expected: No errors. If errors, READ the error and fix.
```

### Level 2: Component Testing
```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom

# Run component tests
npm run test                   # Jest unit tests
npm run test:watch            # Watch mode for development

# Expected: All tests pass. If failing, fix components and re-run.
```

### Level 3: Integration Testing
```bash
# Start development server
npm run dev

# Test the application manually
# 1. Visit http://localhost:3000
# 2. Create a new session
# 3. Send a message
# 4. Verify n8n webhook integration
# 5. Test theme switching
# 6. Verify responsive design

# Expected: All functionality works as specified in mvp_prd.md
```

### Level 4: Production Build
```bash
# Build for production
npm run build

# Start production server
npm start

# Test production build
curl -I http://localhost:3000

# Expected: Production build successful, no runtime errors
```

## Final Validation Checklist
- [ ] All TypeScript compilation passes: `npm run type-check`
- [ ] No linting errors: `npm run lint`
- [ ] Production build successful: `npm run build`
- [ ] All component tests pass: `npm run test`
- [ ] Manual testing covers all user workflows from mvp_prd.md
- [ ] n8n webhook integration works with proper error handling
- [ ] MockAPI integration persists sessions and messages
- [ ] Theme switching works with proper persistence
- [ ] Responsive design works on mobile, tablet, and desktop
- [ ] Accessibility standards met (WCAG 2.1 AA)
- [ ] Performance benchmarks achieved (<3s initial load)
- [ ] Error cases handled gracefully with user-friendly messages

---

## Anti-Patterns to Avoid
- ❌ Don't create custom patterns when ShadCN UI components exist
- ❌ Don't skip TypeScript compilation - fix all type errors
- ❌ Don't ignore the earth-toned design system - follow exact specifications
- ❌ Don't implement generic loading states - show actual workflow progress
- ❌ Don't hardcode API URLs - use environment variables
- ❌ Don't skip error handling - implement comprehensive error recovery
- ❌ Don't forget responsive design - test on all screen sizes
- ❌ Don't ignore accessibility - implement proper ARIA labels

---

## Confidence Score: 9/10

This PRP provides comprehensive context for one-pass implementation success:
- ✅ Complete technical specifications from mvp_prd.md
- ✅ All existing code patterns and examples included
- ✅ Detailed implementation tasks in proper order
- ✅ Executable validation gates for iterative refinement
- ✅ Comprehensive error handling and edge case coverage
- ✅ Production-ready architecture and performance considerations

The implementation should succeed with this level of detail and context.