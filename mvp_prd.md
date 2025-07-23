# Chat App MVP - Product Requirements Document

## 1. EXECUTIVE SUMMARY

### 1.1 Product Overview
A modern, real-time chat application that provides seamless communication between users and n8n workflows. The app features a clean, earth-toned design with collapsible sidebar navigation and dynamic response rendering capabilities.

### 1.2 Key Value Propositions
- **Real-time Workflow Visibility**: Users see actual n8n workflow progress through interim messages
- **Dynamic Response Handling**: Support for multiple content types (text, JSON, images, charts)
- **Optimal Space Utilization**: Collapsible sidebar maximizes chat area when needed
- **Session Management**: Persistent chat history with easy session switching
- **Modern UX**: Clean, accessible interface with light/dark mode support

### 1.3 Success Metrics
- User engagement time per session
- Session creation and management frequency
- Response time from n8n workflow integration
- User satisfaction with real-time progress visibility

## 2. PRODUCT FEATURES

### 2.1 Core Features

#### 2.1.1 Chat Interface
- **Message Input**: Multi-line text input with send button
- **Message Display**: Clean message bubbles with proper spacing
- **Real-time Updates**: Live message streaming without page refresh
- **Interim Messages**: Real-time workflow progress messages from n8n
- **Response Streaming**: Final responses stream character by character

#### 2.1.2 Session Management
- **New Session Creation**: One-click new chat session
- **Session Switching**: Easy navigation between active sessions
- **Session Persistence**: Chat history maintained across browser sessions
- **Session Operations**: Rename, delete, and organize sessions
- **Session Metadata**: Track creation time, message count, last activity

#### 2.1.3 Sidebar Navigation (sidebar-07)
- **Collapsible Design**: Sidebar collapses to icons for space optimization
- **Session List**: Visual list of all chat sessions
- **Profile Section**: User information and settings access
- **Theme Toggle**: Light/dark mode switching
- **Responsive Behavior**: Adapts to different screen sizes

#### 2.1.4 Dynamic Response Rendering
- **Text Responses**: Standard text formatting with proper typography
- **JSON Responses**: Syntax-highlighted JSON with expand/collapse
- **Image Responses**: Image display with loading states
- **Chart Responses**: Interactive charts using ShadCN Chart components
- **Error Handling**: Graceful error state display

### 2.2 Technical Features

#### 2.2.1 n8n Integration
- **Webhook Communication**: Bidirectional communication via N8N_WEBHOOK_URL
- **Streaming Updates**: Real-time workflow progress via N8N_STREAMING_URL
- **Payload Structure**: Standardized request/response format
- **Error Handling**: Robust error recovery and user feedback
- **Timeout Management**: Proper handling of long-running workflows
- **Dual Endpoint Strategy**: Primary webhook for message flow, streaming endpoint for progress updates

#### 2.2.2 Data Management
- **MockAPI Integration**: Session and message persistence
- **Local Storage**: Session ID and temporary data storage
- **State Management**: React Context for global state
- **Caching**: Optimized data fetching and caching

#### 2.2.3 Design System
- **Custom Theme**: Earth-toned color palette with CSS variables
- **Typography**: Montserrat, Merriweather, Source Code Pro fonts
- **Responsive Design**: Mobile-first approach with breakpoints
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

## 3. USER EXPERIENCE REQUIREMENTS

### 3.1 User Journey
1. **Initial Load**: User sees sidebar with "New Chat" option
2. **Session Creation**: Click "New Chat" creates new session
3. **Message Input**: User types message and hits send
4. **Workflow Progress**: Real-time interim messages show n8n progress
5. **Response Delivery**: Final response streams into chat
6. **Session Management**: User can switch, rename, or delete sessions

### 3.2 Interface Requirements
- **Loading States**: No generic "AI thinking" messages
- **Visual Feedback**: Clear indication of message status
- **Error States**: Informative error messages with recovery options
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Accessibility**: WCAG 2.1 AA compliance

### 3.3 Performance Requirements
- **Initial Load**: < 3 seconds for first meaningful paint
- **Message Sending**: Instant visual feedback
- **Real-time Updates**: < 500ms latency for interim messages
- **Response Streaming**: Smooth character-by-character display

## 4. TECHNICAL ARCHITECTURE

### 4.1 Frontend Stack
- **Framework**: Next.js 14+ with App Router
- **UI Library**: ShadCN UI components
- **Styling**: Tailwind CSS with custom CSS variables
- **State Management**: React Context API
- **TypeScript**: Full type safety throughout

### 4.2 Backend Integration
- **n8n Primary Webhook**: RESTful API communication via N8N_WEBHOOK_URL
- **n8n Streaming Endpoint**: Real-time progress updates via N8N_STREAMING_URL
- **MockAPI**: Session and message persistence
- **Real-time**: Dual-endpoint strategy for optimal real-time experience

### 4.3 Data Models

#### 4.3.1 Session Model
```typescript
interface ChatSession {
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
```

#### 4.3.2 Message Model
```typescript
interface Message {
  id: string;
  sessionId: string;
  content: string;
  type: 'user' | 'assistant' | 'interim';
  timestamp: Date;
  responseData?: {
    type: 'text' | 'json' | 'image' | 'chart';
    content: any;
    metadata?: Record<string, any>;
  };
}
```

#### 4.3.3 n8n Webhook Payload
```typescript
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
  metadata?: {
    timestamp: Date;
    processingTime?: number;
    source?: string;
  };
}
```

## 5. IMPLEMENTATION PHASES

### 5.1 Phase 1: Core Foundation (Week 1-2)
- [ ] Next.js project setup with ShadCN UI
- [ ] Basic sidebar-07 implementation
- [ ] Earth-toned design system integration
- [ ] Basic chat interface layout
- [ ] Message input and display components

### 5.2 Phase 2: Session Management (Week 2-3)
- [ ] MockAPI integration
- [ ] Session CRUD operations
- [ ] Session switching functionality
- [ ] Session persistence and recovery
- [ ] Session metadata tracking
- [ ] Mock data for all response types (text, JSON, images, charts)
- [ ] Response renderer with mock data testing

### 5.3 Phase 3: n8n Integration (Week 3-4)
- [ ] Webhook client implementation
- [ ] Environment variable configuration (.env)
- [ ] Message sending functionality
- [ ] Basic response handling
- [ ] Error handling and loading states
- [ ] Real-time interim message display
- [ ] Replace mock data with actual n8n responses

### 5.4 Phase 4: Advanced Features (Week 4-5)
- [ ] Dynamic response renderer
- [ ] Chart integration with ShadCN Charts
- [ ] Advanced error handling
- [ ] Performance optimization
- [ ] Mobile responsiveness

### 5.5 Phase 5: Polish & Testing (Week 5-6)
- [ ] Light/dark mode toggle
- [ ] Accessibility improvements
- [ ] Performance testing
- [ ] User acceptance testing
- [ ] Documentation and deployment

## 6. DESIGN SPECIFICATIONS

### 6.1 Color Palette
#### Light Mode
- Background: `#f8f5f0` (Warm beige)
- Primary: `#2e7d32` (Forest green)
- Secondary: `#e8f5e9` (Light green)
- Accent: `#c8e6c9` (Pale green)

#### Dark Mode
- Background: `#1c2a1f` (Deep forest)
- Primary: `#4caf50` (Bright green)
- Secondary: `#3e4a3d` (Dark green-gray)
- Accent: `#388e3c` (Medium green)

### 6.2 Typography
- **Primary Font**: Montserrat (Sans-serif)
- **Secondary Font**: Merriweather (Serif)
- **Code Font**: Source Code Pro (Monospace)

### 6.3 Component Specifications
- **Border Radius**: 0.5rem
- **Spacing Unit**: 0.25rem
- **Sidebar Width**: 280px (expanded), 64px (collapsed)
- **Message Bubble**: Rounded corners, proper padding
- **Input Area**: Fixed bottom, auto-expand textarea

## 7. ACCEPTANCE CRITERIA

### 7.1 Functional Requirements
- [ ] User can create and manage chat sessions
- [ ] Messages are sent to n8n webhook successfully
- [ ] Interim messages appear in real-time
- [ ] Final responses stream properly
- [ ] Sidebar collapses and expands correctly
- [ ] Light/dark mode toggle works
- [ ] Sessions persist across browser sessions

### 7.2 Technical Requirements
- [ ] No console errors in production
- [ ] Responsive design works on all devices
- [ ] Accessibility standards met
- [ ] Performance benchmarks achieved
- [ ] Error handling covers edge cases
- [ ] TypeScript compilation without errors

### 7.3 User Experience Requirements
- [ ] Intuitive navigation and interaction
- [ ] Clear visual feedback for all actions
- [ ] Smooth animations and transitions
- [ ] Consistent design throughout
- [ ] No "AI thinking" placeholder messages
- [ ] Professional, clean appearance

## 8. RISKS AND MITIGATION

### 8.1 Technical Risks
- **n8n Webhook Failures**: Implement retry logic and fallback messaging
- **MockAPI Limitations**: Consider backup storage solutions
- **Real-time Performance**: Optimize polling intervals and implement caching
- **Mobile Responsiveness**: Extensive testing on various devices

### 8.2 User Experience Risks
- **Confusing Interim Messages**: Clear messaging about workflow progress
- **Session Management Complexity**: Intuitive UI for session operations
- **Response Rendering Issues**: Robust error handling for all content types

### 8.3 Business Risks
- **Development Timeline**: Phased approach with clear milestones
- **Feature Scope Creep**: Strict MVP focus with future enhancement roadmap
- **Performance Issues**: Early performance testing and optimization

## 9. POST-MVP ROADMAP

### 9.1 Near-term Enhancements (Post-MVP)
- Advanced message search and filtering
- File upload and sharing capabilities
- Message export functionality
- User authentication and multi-user support
- Advanced chart customization options

### 9.2 Long-term Vision
- Multi-workspace support
- Advanced n8n workflow integration
- AI-powered message suggestions
- Analytics and usage insights
- Enterprise features and scaling

## 10. APPENDICES

### 10.1 Technical Dependencies
- Next.js 14+
- React 18+
- ShadCN UI components
- Tailwind CSS
- TypeScript 5+
- MockAPI service
- n8n webhook endpoint

### 10.2 Reference Materials
- ShadCN UI documentation
- Next.js App Router documentation
- n8n webhook documentation
- MockAPI integration guides
- Accessibility guidelines (WCAG 2.1)

---

**Document Version**: 1.0  
**Last Updated**: [Current Date]  
**Next Review**: [Weekly during development]
