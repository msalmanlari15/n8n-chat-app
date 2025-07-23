### 🔄 Project Awareness & Context
- **Always read `mvp_prd.md`** at the start of a new conversation to understand the project's architecture, goals, and technical specifications.
- **Check `TASK.md`** before starting a new task. If the task isn't listed, add it with a brief description and today's date.
- **Use consistent naming conventions, file structure, and architecture patterns** as described in `mvp_prd.md`.
- **Follow the 5-phase implementation roadmap** outlined in `mvp_prd.md` for structured development.
- **While doing local development, we will never use npm run build. Only npm run dev.**

### 🧱 Code Structure & Modularity
- **Never create a file longer than 500 lines of code.** If a file approaches this limit, refactor by splitting it into modules or helper files.
- **Organize code into clearly separated modules**, grouped by feature or responsibility:
  - `components/` - React UI components
  - `hooks/` - Custom React hooks
  - `lib/` - Utility functions and API clients
  - `types/` - TypeScript type definitions
  - `app/` - Next.js App Router pages and layouts
- **Use clear, consistent imports** (prefer relative imports within the same feature).
- **Use environment variables** for configuration (N8N_WEBHOOK_URL, N8N_STREAMING_URL, etc.).

### 🧪 Testing & Reliability
- **Always create unit tests for new features** (components, hooks, utils, etc).
- **After updating any logic**, check whether existing unit tests need to be updated. If so, do it.
- **Tests should live in a `__tests__` folder** or alongside components with `.test.tsx` suffix.
  - Include at least:
    - 1 test for expected use
    - 1 edge case
    - 1 failure case

### ✅ Task Completion
- **Mark completed tasks in `TASK.md`** immediately after finishing them.
- Add new sub-tasks or TODOs discovered during development to `TASK.md` under a "Discovered During Work" section.

### 📎 Style & Conventions
- **Use TypeScript** as the primary language with full type safety.
- **Follow the tech stack**: Next.js 14+ with App Router, React 18+, ShadCN UI, Tailwind CSS.
- **Use ShadCN UI components** for consistent design system implementation.
- **Follow the earth-toned design system** with custom CSS variables as specified in `mvp_prd.md`.
- Write **JSDoc comments for complex functions**:
  ```typescript
  /**
   * Sends a message to the n8n webhook and handles the response
   * @param message - The user's message
   * @param sessionId - The current chat session ID
   * @returns Promise<N8NResponse>
   */
  ```

### 📚 Documentation & Explainability
- **Update `README.md`** when new features are added, dependencies change, or setup steps are modified.
- **Comment non-obvious code** and ensure everything is understandable to a mid-level developer.
- When writing complex logic, **add an inline comment** explaining the why, not just the what.

### 🎨 Design System & UI Guidelines
- **Use the earth-toned color palette** specified in `mvp_prd.md` with custom CSS variables.
- **Implement the collapsible sidebar-07** pattern with icon mode for space optimization.
- **Follow responsive design principles** with mobile-first approach.
- **Ensure accessibility compliance** with ARIA labels and keyboard navigation.
- **Use consistent spacing and typography** as defined in the design specifications.

### 🔗 Integration Guidelines
- **n8n Webhook Integration**: Use dual-endpoint strategy for optimal real-time experience.
- **MockAPI Integration**: For session persistence and chat history management.
- **Real-time Updates**: Implement interim messages without generic "AI thinking" placeholders.
- **Error Handling**: Provide graceful error recovery and user feedback.
- **Response Rendering**: Support multiple content types (text, JSON, images, charts).

### 🧠 AI Behavior Rules
- **Never assume missing context. Ask questions if uncertain.**
- **Never hallucinate libraries or functions** – only use known, verified packages from the tech stack.
- **Always confirm file paths and module names** exist before referencing them in code or tests.
- **Never delete or overwrite existing code** unless explicitly instructed to or if part of a task from `TASK.md`.
- **Follow the implementation phases** outlined in `mvp_prd.md` for structured development.