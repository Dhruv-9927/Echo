<p align="center">
  <h1 align="center">🧠 ECHO</h1>
  <p align="center"><strong>AI-Powered Organizational Knowledge Engine</strong></p>
  <p align="center">Passively ingests Slack conversations and builds a living Knowledge Graph of your team's collective intelligence.</p>
</p>

---

## ✨ What is ECHO?

Engineering teams make hundreds of decisions every week — in Slack threads, standups, and incident channels. Within weeks, that tribal knowledge is buried and forgotten.

**ECHO** solves this by passively listening to your Slack workspace, extracting structured intelligence using AI, and building a real-time Knowledge Graph that maps:

- **Who** knows **what**
- **When** decisions were made and **why**
- **Which** knowledge is **decaying** (hasn't been referenced recently)
- **Who** to ask when you're stuck on a specific technology

## 🚀 Features

| Feature | Description |
|---------|-------------|
| **🔗 Knowledge Graph** | Interactive force-directed graph visualization showing people, concepts, decisions, and their relationships |
| **🔍 Expert Finder** | Search any technology and instantly discover your team's subject matter experts with cited evidence |
| **💬 Ask ECHO** | Natural language Q&A over your team's entire history with source citations |
| **📜 Memory Timeline** | Chronological feed of ingested intelligence with decay scoring |
| **⚡ Real-time Ingestion** | Live Slack monitoring via Socket Mode — zero manual input required |
| **🧮 Temporal Decay** | Knowledge freshness scoring — recently discussed topics pulse, old ones fade |

## 🏗️ Architecture

```
Slack Workspace
      │
      ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Slack Bolt  │────▶│  Ingestion   │────▶│   Groq LLM      │
│  Socket Mode │     │  Pipeline    │     │  (Qwen 3 32B)   │
└─────────────┘     └──────┬───────┘     └────────┬────────┘
                           │                       │
                    ┌──────▼───────┐        ┌──────▼────────┐
                    │   Memory     │        │  Entity       │
                    │   Store      │        │  Extraction   │
                    └──────┬───────┘        └──────┬────────┘
                           │                       │
                    ┌──────▼───────────────────────▼────────┐
                    │         Knowledge Graph               │
                    │   (Nodes + Edges + Decay Scores)      │
                    └──────────────┬────────────────────────┘
                                   │
                    ┌──────────────▼────────────────────────┐
                    │         Express API + Socket.io       │
                    └──────────────┬────────────────────────┘
                                   │
                    ┌──────────────▼────────────────────────┐
                    │      React Dashboard (Vite)           │
                    │  Graph │ Experts │ Ask │ Timeline     │
                    └──────────────────────────────────────┘
```

## 🛠️ Tech Stack

- **Runtime:** Node.js 20+ · TypeScript 5
- **Backend:** Express · Socket.io · Groq SDK
- **Frontend:** React · Vite · D3.js Force Graph · Lucide Icons
- **Slack:** Bolt SDK (Socket Mode)
- **AI:** Groq Cloud (Qwen 3 32B) for entity extraction
- **Architecture:** pnpm monorepo with shared packages

## 📁 Project Structure

```
echo/
├── apps/
│   ├── api/          # Express + Socket.io API server
│   ├── web/          # React + Vite dashboard
│   └── slack-bot/    # Slack Bolt bot + ingestion pipeline
├── packages/
│   ├── types/        # Shared TypeScript types
│   ├── memory/       # Memory store (in-memory + Hindsight)
│   ├── graph/        # Knowledge Graph engine
│   └── agent/        # AI agent + entity extraction
├── scripts/          # Seed & utility scripts
└── package.json      # Monorepo root
```

## ⚡ Quick Start

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9
- [Groq API Key](https://console.groq.com)
- [Slack Bot Token](https://api.slack.com/apps) (with Socket Mode enabled)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/Dhruv-9927/Echo.git
cd Echo

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 4. Seed demo data (optional)
pnpm seed

# 5. Start everything
pnpm dev:all
```

### Environment Variables

```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=qwen/qwen3-32b
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_APP_TOKEN=xapp-your-app-token
API_PORT=3001
DEBUG=true
```

## 📸 Screenshots

### Knowledge Graph
Interactive force-directed graph showing relationships between people, technologies, and decisions.

### Expert Finder
Search any technology to discover who on your team is the expert — backed by memory evidence.

### Ask ECHO
Ask natural language questions and get AI-powered answers with cited Slack sources.

### Memory Timeline
Chronological feed of all ingested intelligence with decay scoring.

## 🏆 Built For

**NexaAI Hackathon 2026**

## 👥 Team

- **Dhruv** — Full Stack Development & Architecture

## 📄 License

MIT
