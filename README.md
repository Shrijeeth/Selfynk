# Selfynk

**An AI-powered Personal Brand Operating System.**

Selfynk solves the gap between who you are privately and how you show up publicly. It is an open-source, self-hosted personal edition built around a multi-agent AI framework designed to capture your professional identity, surface insights, and generate authentic content in your own voice.

## Core Philosophy

1. **Current ≠ Desired:** Make the gap between your current brand (how others perceive you) and your desired brand visible and actionable.
2. **Values + Action = Credibility:** Track alignment between your declared values and your daily actions. Credibility only comes when they align.
3. **Feelings over Facts:** Capture the emotional dimension of every interaction, reflecting on how you made others feel.

## Tech Stack

- **Backend:** Python 3.11+, FastAPI, SQLModel, SQLite (dev) / Postgres (prod)
- **Agent Framework:** Agno (supports Anthropic, OpenAI, or Ollama)
- **Frontend:** Next.js 14 (App Router), TypeScript, TailwindCSS, Shadcn/ui, Zustand, React Query
- **Deployment:** Docker Compose

## Quickstart

Get Selfynk running locally in exactly 3 steps:

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/selfynk.git
   cd selfynk
   ```

2. **Configure your environment:**

   ```bash
   cp .env.example .env
   # Edit the .env file to add your LLM provider API key (e.g., ANTHROPIC_API_KEY)
   ```

3. **Start the application:**

   ```bash
   make dev
   # Alternatives: docker compose up
   ```

Once running, access the user dashboard at [http://localhost:3000](http://localhost:3000). The backend API is available at [http://localhost:8000](http://localhost:8000).

## Agent Architecture

Selfynk operates using a multi-agent architecture powered by Agno, built on asynchronous FastAPI endpoints and Server-Sent Events (SSE) for real-time generation:

- **AnalystAgent:** Automatically extracts identity signals (themes, skills, values, tone, perception) from any input entry (journals, debriefs).
- **BrandDNAAgent:** Synthesizes identity from your analyses, value declarations, and desired brand statement into a clear picture of who you are today.
- **ContentWriterAgent:** Turns experiences into platform-native content (LinkedIn posts, Twitter threads, bios) that sound like you.
- **LegacyVisionAgent:** Computes your true 'desired brand statement' from a legacy design exercise.
- **PerceptionGapAgent:** Cross-references how you see yourself vs. how others likely see you.
- **CredibilityAgent:** Runs weekly to assess whether your actions aligned with your stated values.

## Repository Structure

```plaintext
selfynk/
├── backend/          # FastAPI app, SQLModel database models, Agno agents, Routers
├── frontend/         # Next.js frontend, shadcn UI components, capture pipelines
├── docker-compose.yml
├── .env.example
├── Makefile
└── README.md
```

## Community

See `CONTRIBUTING.md` for information on our development process, branch naming conventions, and pull request workflows.

---
