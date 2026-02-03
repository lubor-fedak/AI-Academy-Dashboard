-- Migration: Update Day 2 - Agentic AI Framework + Clerk Authentication
-- Date: 2026-02-03
-- Description: Updates mission_days content for Day 2 to focus on Agentic AI Framework understanding
--              and Clerk authentication implementation

-- ============================================================================
-- UPDATE DAY 2: Agentic AI Framework + Authentication
-- Focus: Evolution layers (AI→Deep Learning→Gen AI→Agents→Agentic AI) + Clerk Auth
-- ============================================================================

UPDATE mission_days
SET
  title = 'From Chatbot to Agent',
  codename = 'Agentic AI Framework',
  subtitle = 'Understanding the evolution of AI systems and implementing authentication for agentic applications',
  tech_skills_focus = ARRAY[
    'Agentic AI Framework',
    'Evolution Layers (AI/ML → Agentic AI)',
    'Clerk Authentication',
    'Agent Capabilities & Governance',
    'User Context for AI Personalization'
  ],
  briefing_content = E'# Day 2: From Chatbot to Agent

## Mission Briefing

Yesterday you understood the AI landscape and briefed the CEO. Today, you go deeper into **how AI systems evolved** from simple machine learning to fully autonomous agentic systems—and you''ll implement **authentication** that every production AI system needs.

## The Evolution of AI

AI didn''t jump from "simple chatbot" to "autonomous agent" overnight. Understanding each layer helps you:
- Know which tools to use when
- Explain to clients why their "just add AI" request is more complex
- Design systems that use the right level of autonomy

### The Five Layers

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AGENTIC AI                                    │
│              "Automate entire processes"                             │
│   Multi-agent collaboration, Goal decomposition, Governance          │
├─────────────────────────────────────────────────────────────────────┤
│                        AI AGENTS                                     │
│              "Autonomous Tasks"                                      │
│   Tool use, Planning (ReAct, CoT), Memory, Human-in-the-loop        │
├─────────────────────────────────────────────────────────────────────┤
│                     GENERATIVE AI                                    │
│              "Create New Content"                                    │
│   RAG, Prompt Engineering, Multimodal generation                     │
├─────────────────────────────────────────────────────────────────────┤
│                     DEEP LEARNING                                    │
│              Multi-layered neural networks                           │
│   CNNs, RNNs, LSTMs, Transformers                                   │
├─────────────────────────────────────────────────────────────────────┤
│                        AI & ML                                       │
│              "Turn data into decisions"                              │
│   Supervised, Unsupervised, Reinforcement learning                   │
└─────────────────────────────────────────────────────────────────────┘
```

## Why Authentication Matters for AI

Every production AI system needs to know:
- **Who** is asking the question (user identity)
- **What** they''re allowed to do (permissions)
- **How** to personalize responses (user context)
- **When** they did it (audit trail)

Today you''ll implement **Clerk** - authentication built for modern AI applications.

## Today''s Objectives

1. **Understand** the 5 evolution layers and when each applies
2. **Explain** agent capabilities: tool use, planning, memory, oversight
3. **Implement** Clerk authentication (or detailed plan for non-technical roles)
4. **Connect** user identity to AI agent context

## The Stakes

Without proper authentication:
- You can''t personalize AI responses
- You can''t implement role-based agent capabilities
- You can''t audit who did what (EU AI Act requirement!)
- You can''t bill customers for usage

---

*"The difference between a demo and a product? Authentication, authorization, and audit logs."*
— Every engineer who shipped to production',
  resources_content = E'# Day 2 Resources

## Agentic AI Framework

### Key Concepts

**Evolution Layers:**
- **AI & ML**: Traditional machine learning - classification, regression, clustering
- **Deep Learning**: Neural networks with multiple layers - CNNs for images, RNNs for sequences
- **Generative AI**: Creating new content - text, images, code, music
- **AI Agents**: Autonomous task execution with tools, planning, and memory
- **Agentic AI**: Multi-agent systems with governance, orchestration, and human oversight

**Agent Capabilities:**
- **Tool Use & Function Calling**: Agents interact with external APIs and systems
- **Planning (ReAct, CoT, ToT)**: Breaking down complex tasks into steps
- **Memory Systems**: Short-term (conversation) vs long-term (persistent knowledge)
- **Human-in-the-Loop**: When and how humans intervene in agent decisions

**Governance Layer:**
- Multi-agent collaboration patterns
- Goal decomposition & task chaining
- Guardrails and safety boundaries
- Observability & tracing
- Delegation & handoff protocols

## Clerk Authentication

### Documentation
- [Clerk Docs](https://clerk.com/docs)
- [Clerk + Next.js](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk Webhooks](https://clerk.com/docs/integrations/webhooks)

### Key Implementation Steps

1. **Install Clerk**
   ```bash
   npm install @clerk/nextjs
   ```

2. **Environment Variables**
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
   CLERK_SECRET_KEY=sk_...
   ```

3. **Middleware Setup**
   ```typescript
   // middleware.ts
   import { clerkMiddleware } from "@clerk/nextjs/server";
   export default clerkMiddleware();
   ```

4. **Protected Routes**
   ```typescript
   import { auth } from "@clerk/nextjs/server";

   export async function GET() {
     const { userId } = await auth();
     if (!userId) {
       return new Response("Unauthorized", { status: 401 });
     }
     // User is authenticated
   }
   ```

5. **User Metadata for AI Personalization**
   ```typescript
   import { currentUser } from "@clerk/nextjs/server";

   const user = await currentUser();
   const preferences = user?.publicMetadata?.aiPreferences;
   // Pass to your AI agent for personalization
   ```

### Why Clerk for AI Applications?

- **Session Management**: Maintains user context across AI conversations
- **User Metadata**: Store preferences for AI personalization
- **Webhooks**: React to auth events (new user → initialize AI profile)
- **Role-Based Access**: Different users get different agent capabilities
- **Audit Trail**: Track who interacted with which AI features

## Verification Questions

Use these to check your understanding:

1. "What''s the key difference between Gen AI and AI Agents?"
2. "Why do we need the Agentic AI layer—isn''t AI Agents enough?"
3. "How would you use Clerk user metadata to personalize an AI agent?"
4. "For EU AI Act compliance, how does Clerk help with audit requirements?"

## Deliverables

### Part A: Framework Understanding
Explain each evolution layer and demonstrate understanding of:
- Agent capabilities (tool use, planning, memory)
- Governance requirements (guardrails, observability)

### Part B: Clerk Implementation
Either working code OR detailed implementation plan showing:
- Authentication flow
- Protected routes
- User context passing to AI agent
- Role-based agent capabilities'
WHERE day = 2;
