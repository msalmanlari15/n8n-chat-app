# Chat App Examples

This directory contains example code and patterns for implementing the Chat Application features. These examples demonstrate best practices, component structures, and integration patterns for the modern chat application.

## Directory Structure

```
examples/
├── components/          # React components and UI patterns
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries and helpers
├── types/              # TypeScript type definitions
├── n8n/                # n8n webhook integration examples
├── mockapi/            # MockAPI integration examples
├── themes/             # Design system and theming
└── README.md           # This file
```

## Key Features Demonstrated

- **Real-time Chat Interface**: Message bubbles, input handling, streaming responses
- **Session Management**: Create, switch, rename, delete chat sessions
- **n8n Integration**: Webhook communication, interim messages, response handling
- **Dynamic Response Rendering**: Text, JSON, images, charts display
- **Collapsible Sidebar**: ShadCN sidebar-07 pattern with icon mode
- **Earth-toned Design**: Custom CSS variables and theme system
- **MockAPI Integration**: Session persistence and data management

## Usage Notes

- These examples are for reference and inspiration only
- Do not copy directly - adapt to your specific project structure
- Follow the patterns and conventions shown in the examples
- Ensure proper TypeScript typing throughout your implementation
- Test all components thoroughly before production use

## Getting Started

1. Review the component examples to understand the structure
2. Examine the type definitions for data models
3. Study the integration patterns for n8n and MockAPI
4. Implement the design system from the themes examples
5. Use the hook examples for state management patterns

## Additional Resources

- [ShadCN UI Components](https://ui.shadcn.com/)
- [Next.js 14+ Documentation](https://nextjs.org/docs)
- [n8n Webhook Documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [MockAPI Documentation](https://mockapi.io/docs)