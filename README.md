# SatyaTrail — News Authenticity & Trail Explorer

A full-stack news verification platform that traces the origin and propagation of news stories through a network of sources, using AI-powered multi-agent verification, blockchain storage, and an intuitive visualization interface.

## 🌟 Features

### Frontend Features
- **Tile-based Feed**: Browse news articles with veracity badges and dynamic images
- **Source Network Visualization**: Interactive 3D graph showing how stories propagate from origin through amplifiers, debunkers, and commentators
- **Multi-Agent Verification**: ChatGPT-style claim checker with real-time agent responses
- **Agent Rankings**: Leaderboard showing agent reputation scores, accuracy rates, and credibility metrics
- **Source Reputation System**: Each source scored based on historical accuracy and credibility
- **Trail Explorer**: Visualize the complete trail of how a story spread across sources
- **Recent Verifications Sidebar**: Quick access to previously verified claims
- **Neo-Brutalist Design**: Bold, high-contrast UI with newspaper-inspired styling

### Backend Features
- **Multi-Agent Orchestration**: TOI, NDTV, India Times, and Generic agents analyze claims
- **Source Graph Tracing**: Maps how news propagates across sources with role classification
- **Blockchain Storage**: Immutable verification records on Polygon/Solana
- **Reputation System**: ELO-inspired algorithm tracking agent performance over time
- **Tavily Search Integration**: Web search and content extraction for evidence gathering
- **OpenAI GPT Integration**: AI-powered analysis and reasoning
- **Bot Integrations**: Telegram, Twitter/X, and WhatsApp bots for public verification

### Extension Features
- **Full Page Verification**: Analyze entire webpages for misinformation
- **Quick Check**: Verify selected text instantly
- **Detailed Results**: Claim-by-claim verdicts with evidence
- **Evidence Sources**: View supporting evidence from trusted sources

## 🛠️ Tech Stack

### Frontend
- **Framework**: Vite + React.js (JavaScript)
- **Styling**: TailwindCSS with Neo-Brutalism theme
- **UI Kit**: Radix UI primitives + Lucide icons
- **State**: Zustand for global stores + URL search params
- **Forms**: react-hook-form + zod
- **3D Visualization**: Three.js + React Three Fiber
- **Animations**: Framer Motion
- **Notifications**: sonner

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **AI**: OpenAI GPT-4o
- **Search**: Tavily API
- **Blockchain**: Polygon (Mumbai testnet) / Solana (devnet)
- **Bots**: Telegraf, Twitter API v2, Twilio

### Blockchain
- **Network**: Polygon Mumbai / Solana Devnet
- **Smart Contracts**: Solidity (Hardhat)
- **Storage**: Immutable verification hashes on-chain


## 🏗️ Architecture

### System Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        FE[Frontend<br/>React + Vite]
        EXT[Chrome Extension<br/>Content Script]
        BOT_TG[Telegram Bot]
        BOT_TW[Twitter Bot]
        BOT_WA[WhatsApp Bot]
    end

    subgraph "API Gateway"
        API[Express.js API Server<br/>Port 3001]
    end

    subgraph "Backend Services"
        ORCH[Orchestrator<br/>Multi-Agent Coordinator]
        AG_TOI[TOI Agent]
        AG_NDTV[NDTV Agent]
        AG_IT[India Times Agent]
        AG_GEN[Generic Agent]
        REP[Reputation System<br/>ELO Algorithm]
        GRAPH[Graph Service<br/>Source Network Builder]
    end

    subgraph "External APIs"
        OPENAI[OpenAI GPT-4o<br/>AI Analysis]
        TAVILY[Tavily API<br/>Web Search]
    end

    subgraph "Data Layer"
        MONGO[(MongoDB<br/>Verifications<br/>Reputations<br/>Source Graphs)]
    end

    subgraph "Blockchain"
        POLYGON[Polygon Mumbai<br/>Smart Contract]
        SOLANA[Solana Devnet<br/>Alternative]
    end

    FE -->|HTTP/REST| API
    EXT -->|HTTP/REST| API
    BOT_TG -->|Webhooks| API
    BOT_TW -->|Webhooks| API
    BOT_WA -->|Webhooks| API

    API -->|Verify Request| ORCH
    API -->|Fetch Data| MONGO
    API -->|Store Hash| POLYGON
    API -->|Reputation Queries| REP

    ORCH -->|Delegate| AG_TOI
    ORCH -->|Delegate| AG_NDTV
    ORCH -->|Delegate| AG_IT
    ORCH -->|Delegate| AG_GEN

    AG_TOI -->|AI Analysis| OPENAI
    AG_NDTV -->|AI Analysis| OPENAI
    AG_IT -->|AI Analysis| OPENAI
    AG_GEN -->|AI Analysis| OPENAI

    AG_TOI -->|Evidence Search| TAVILY
    AG_NDTV -->|Evidence Search| TAVILY
    AG_IT -->|Evidence Search| TAVILY
    AG_GEN -->|Evidence Search| TAVILY

    ORCH -->|Build Graph| GRAPH
    GRAPH -->|Store| MONGO

    ORCH -->|Update Scores| REP
    REP -->|Store| MONGO

    ORCH -->|Store Results| MONGO
    ORCH -->|Store Hash| POLYGON

    style FE fill:#6366f1,stroke:#4f46e5,color:#fff
    style EXT fill:#6366f1,stroke:#4f46e5,color:#fff
    style API fill:#10b981,stroke:#059669,color:#fff
    style ORCH fill:#f59e0b,stroke:#d97706,color:#fff
    style MONGO fill:#47a248,stroke:#2e7d32,color:#fff
    style OPENAI fill:#8b5cf6,stroke:#7c3aed,color:#fff
    style TAVILY fill:#ec4899,stroke:#db2777,color:#fff
    style POLYGON fill:#8247e5,stroke:#6b21a8,color:#fff
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- MongoDB (local or cloud)
- API keys for:
  - OpenAI
  - Tavily
  - (Optional) Telegram bot token, Twitter API credentials

### Frontend Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The frontend will run on `http://localhost:5173` (or the next available port).

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Start MongoDB (if using Docker)
docker-compose up -d mongo

# Run development server (with auto-reload)
npm run dev

# Or run production server
npm start
```

The backend will run on `http://localhost:3001` (or configured port).

### Extension Setup

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `extension` folder from this project
5. The SatyaTrail icon should appear in your toolbar

### Verification Flow Diagram

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Orchestrator
    participant Agents
    participant OpenAI
    participant Tavily
    participant GraphService
    participant Reputation
    participant MongoDB
    participant Blockchain

    User->>Frontend: Submit Claim/URL
    Frontend->>API: POST /api/v1/verify
    API->>Orchestrator: Initiate Verification
    
    par Parallel Agent Processing
        Orchestrator->>Agents: Delegate to TOI Agent
        Orchestrator->>Agents: Delegate to NDTV Agent
        Orchestrator->>Agents: Delegate to India Times Agent
        Orchestrator->>Agents: Delegate to Generic Agent
    end

    loop For Each Agent
        Agents->>Tavily: Search for Evidence
        Tavily-->>Agents: Return Search Results
        Agents->>OpenAI: Analyze Claim + Evidence
        OpenAI-->>Agents: Return Analysis & Verdict
        Agents-->>Orchestrator: Agent Report
    end

    Orchestrator->>Orchestrator: Aggregate Verdicts
    Orchestrator->>GraphService: Build Source Graph
    GraphService->>GraphService: Classify Roles<br/>(Origin/Amplifier/Debunker/Commentary)
    GraphService-->>Orchestrator: Source Graph
    
    Orchestrator->>Reputation: Update Agent Scores
    Reputation->>Reputation: Calculate ELO Updates
    Reputation->>MongoDB: Store Updated Reputations
    
    Orchestrator->>MongoDB: Store Verification Result
    Orchestrator->>Blockchain: Store Graph Hash
    
    Blockchain-->>Orchestrator: Transaction Hash
    Orchestrator-->>API: Verification Complete
    API-->>Frontend: Return Results
    Frontend-->>User: Display Verification
```

## 🎯 Source Network Role Classification

The system classifies sources in the trail network into four roles:

- **Origin**: The original source where the story first appeared (earliest timestamp)
- **Amplifier**: High-credibility sources that spread the story (high reputation + amplifier signals)
- **Debunker**: Fact-check sources that verify or debunk claims (fact-check domains + debunk signals)
- **Commentary**: Analysis, opinion pieces, and other commentary on the story

Classification uses:
- Backend-provided roles (if available)
- Timestamp analysis (earliest = origin)
- Domain reputation and fact-check domain lists
- Content signals (keywords, language patterns)
- Credibility scores

## 📊 Reputation System

The reputation system uses an ELO-inspired algorithm:

- **Reputation Score**: Base score (1000) adjusted by verification outcomes
- **Accuracy Rate**: Percentage of verifications where agent agreed with consensus
- **Credibility Score**: Average credibility score (0-100) across all verifications
- **Total Verifications**: Count of verifications performed by the agent

Scores are updated after each verification based on:
- Agreement with consensus verdict
- Confidence level of the verification
- Time decay (older verifications have less weight)

## 🔗 Blockchain Integration

Verification results are stored on-chain for immutability:

- **Network**: Polygon Mumbai (testnet) / Solana Devnet
- **Storage**: Graph hash stored on-chain
- **Verification**: Full verification data stored off-chain, hash on-chain
- **Smart Contract**: `SatyaTrail.sol` handles hash storage and retrieval

## 🤖 Multi-Agent System

The platform uses specialized agents for verification:

- **Generic Verification Agent**: General-purpose fact-checking
- **TOI Agent**: Times of India perspective
- **NDTV Agent**: NDTV perspective
- **India Times Agent**: India Times perspective

Each agent:
- Analyzes claims independently
- Provides reasoning and evidence
- Assigns credibility scores
- Contributes to consensus verdict