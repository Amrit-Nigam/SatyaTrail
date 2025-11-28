# SatyaTrail Backend

AI-powered news verification backend with multi-agent orchestration, source-graph tracing, and blockchain storage.

## Features

- **Multi-Agent Verification**: TOI, NDTV, India Times, and Generic agents analyze claims from different perspectives
- **Tavily Search Integration**: Web search and content extraction for evidence gathering
- **OpenAI GPT Integration**: AI-powered analysis and reasoning
- **Source Graph Tracing**: Maps how news propagates across sources
- **Blockchain Storage**: Immutable verification records on Polygon/Solana
- **Bot Integrations**: Telegram and Twitter/X bots for public verification

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB
- **AI**: OpenAI GPT-4o (configurable)
- **Search**: Tavily API
- **Blockchain**: Polygon (Mumbai testnet) / Solana (devnet)
- **Bots**: Telegraf, Twitter API v2

## Quick Start

### Prerequisites

- Node.js 18 or higher
- MongoDB (local or cloud)
- API keys for OpenAI, Tavily
- (Optional) Telegram bot token, Twitter API credentials

### Local Development

1. **Clone and install dependencies**:
```bash
cd backend
npm install
```

2. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. **Start MongoDB** (if not using cloud):
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongo mongo:7

# Or use docker-compose
docker-compose up -d mongo
```

4. **Run the server**:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

5. **Test the API**:
```bash
curl http://localhost:3001/health
```

### Using Docker

```bash
# Build and run all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

## API Endpoints

### POST /api/v1/verify

Main verification endpoint.

**Request Body**:
```json
{
  "url": "https://example.com/news-article",
  "text": "Optional raw text to verify",
  "source": "frontend|telegram|twitter|extension"
}
```

**Response**:
```json
{
  "verdict": "true|false|mixed|unknown",
  "accuracy_score": 85.5,
  "agent_reports": [
    {
      "agent_name": "Times of India Agent",
      "credibility_score": 80,
      "summary": "Analysis summary...",
      "evidence_links": ["https://..."],
      "reasoning": "Detailed reasoning..."
    }
  ],
  "source_graph": {
    "nodes": [...],
    "edges": [...],
    "hash": "sha256hash..."
  },
  "blockchain_hash": "0x...",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "metadata": {...}
}
```

### POST /api/v1/verify/extension

Optimized endpoint for browser extension (compact response).

### GET /api/v1/verify/:hash

Retrieve a previous verification by graph hash.

### GET /api/v1/verify/recent

Get recent verifications.

### POST /api/v1/webhook/telegram

Telegram webhook endpoint.

### POST /api/v1/webhook/twitter

Twitter webhook endpoint (with CRC validation).

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3001) |
| `NODE_ENV` | No | Environment (development/production) |
| `DATABASE_URL` | Yes | MongoDB connection string |
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `MODEL_NAME` | Yes | OpenAI model (e.g., gpt-4o) |
| `TAVILY_API_KEY` | Yes | Tavily search API key |
| `BLOCKCHAIN_PROVIDER` | No | 'polygon' or 'solana' |
| `BLOCKCHAIN_RPC_URL` | No | Blockchain RPC endpoint |
| `BLOCKCHAIN_PRIVATE_KEY` | No | Wallet private key (testnet) |
| `BLOCKCHAIN_DRY_RUN` | No | Simulate blockchain writes |
| `TELEGRAM_BOT_TOKEN` | No | Telegram bot token |
| `TWITTER_BEARER_TOKEN` | No | Twitter API bearer token |
| `CORS_ORIGINS` | No | Allowed CORS origins |

## Multi-Agent System

### Agents

1. **TOI Agent**: Mainstream centrist perspective, trusts government sources
2. **India Times Agent**: Digital-first focus, skeptical of viral content
3. **NDTV Agent**: Liberal-leaning, emphasizes investigative journalism
4. **Generic Agent**: Neutral, evidence-based fact-checking

### Orchestrator

- Runs agents in parallel
- Aggregates results using weighted scoring
- Updates agent reputations based on consensus

### Reputation System

Agents build reputation over time based on accuracy:

```
new_score = old_score + K * (actual - expected) * confidence_weight

Where:
- K = 32 (base adjustment factor)
- actual = 1 if agreed with final verdict, 0 otherwise
- expected = old_score / 100
- confidence_weight = agent's confidence (0-1)
```

Time decay: Scores decay 1% per week towards neutral (50).

## Blockchain Integration

### Polygon (Default)

Uses Mumbai testnet by default. Only stores:
- Graph hash (SHA-256)
- Verdict
- Timestamp

Full graph data stored in MongoDB.

### Dry Run Mode

Set `BLOCKCHAIN_DRY_RUN=true` to simulate transactions without actual writes.

### Manual Storage

```bash
node scripts/storeGraphOnChain.js <graph_hash> <verdict> [--dry-run]
```

## Graph Canonicalization

Source graphs are hashed using deterministic JSON serialization:

1. Sort nodes and edges by ID
2. Extract minimal fields (id, url, title, role, relationships)
3. Use `json-stable-stringify` for deterministic key ordering
4. SHA-256 hash the result

This ensures identical graphs always produce the same hash.

## Telegram Bot

Commands:
- `/start` - Welcome message
- `/help` - Show help
- `/verify <url or text>` - Verify content
- `/status` - Bot status

Or simply send a URL or claim to verify.

## Twitter Bot

Mention @YourBot with a URL or claim to verify. The bot will reply with:
- Verdict and accuracy score
- Brief summary
- Link to full report

## Development

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Project Structure

```
backend/
├── server.js              # Entry point
├── routes/
│   ├── verifyNews.js      # Main verification routes
│   ├── extension.js       # Extension routes
│   ├── agents/            # Agent implementations
│   │   ├── orchestrator.js
│   │   ├── toiAgent.js
│   │   ├── indiaTimesAgent.js
│   │   ├── ndtvAgent.js
│   │   └── genericAgent.js
│   └── webhooks/          # Bot webhooks
├── services/
│   ├── tavilyService.js   # Search integration
│   ├── openaiService.js   # AI integration
│   ├── blockchainService.js
│   └── graphService.js    # Graph building
├── controllers/
├── models/                # MongoDB schemas
├── utils/
│   ├── logger.js
│   ├── validators.js
│   ├── cors.js
│   └── reputationSystem.js
├── telegram/              # Telegram bot
├── twitter/               # Twitter bot
└── scripts/
```

## Deployment

### Cloud Providers

The backend can be deployed to:
- AWS (ECS, EC2, Lambda)
- Google Cloud (Cloud Run, GKE)
- Azure (Container Apps)
- Railway, Render, Fly.io

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use production MongoDB (Atlas)
- [ ] Configure proper CORS origins
- [ ] Set up rate limiting
- [ ] Enable blockchain writes (`BLOCKCHAIN_DRY_RUN=false`)
- [ ] Configure monitoring/alerting
- [ ] Set up log aggregation

## License

MIT

## Support

For issues and feature requests, please open a GitHub issue.

