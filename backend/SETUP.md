# Backend Setup Guide

Complete step-by-step guide to set up and run the SatyaTrail backend.

## Prerequisites

Before starting, ensure you have:

- ✅ **Node.js 18 or higher** - Check with: `node --version`
- ✅ **npm or yarn** - Check with: `npm --version`
- ✅ **MongoDB** - Either:
  - Local MongoDB installation, OR
  - MongoDB Atlas account (you already have a connection string in `.env`)
- ✅ **API Keys**:
  - OpenAI API key (already in `.env`)
  - Tavily API key (already in `.env`)
  - Optional: Telegram Bot Token
  - Optional: Twitter API credentials
  - Optional: Blockchain RPC URL and private key

## Quick Setup (5 minutes)

### Step 1: Navigate to Backend Directory

```bash
cd backend
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages listed in `package.json`, including:
- Express.js
- Mongoose (MongoDB)
- OpenAI SDK
- Tavily API client
- And all other dependencies

**Expected output**: Should complete without errors and show a list of installed packages.

### Step 3: Verify Environment Configuration

Your `.env` file already exists at `/Users/kumartanay/agentic/backend/.env` with the following configured:

✅ **Required variables** (already set):
- `DATABASE_URL` - MongoDB connection string
- `OPENAI_API_KEY` - OpenAI API key
- `MODEL_NAME` - AI model (gpt-4o)
- `TAVILY_API_KEY` - Tavily search API key

✅ **Optional variables** (already set):
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment mode
- `TELEGRAM_BOT_TOKEN` - Telegram bot (optional)
- `TWITTER_*` - Twitter API credentials (optional)
- `BLOCKCHAIN_*` - Blockchain configuration (optional)

**No changes needed** unless you want to modify the configuration.

### Step 4: Start the Server

**For Development** (with auto-reload on file changes):
```bash
npm run dev
```

**For Production**:
```bash
npm start
```

**Expected output**:
```
🚀 Server running on port 3001
Connected to MongoDB database
SatyaTrail backend server running on port 3001
Environment: development
Health check: http://localhost:3001/health
```

### Step 5: Verify Server is Running

Open your browser or use curl:

```bash
curl http://localhost:3001/health
```

**Expected response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "model": "gpt-4o"
  }
}
```

Or visit: http://localhost:3001/health

### Step 6: Test All Routes (Optional)

Once the server is running, test all endpoints:

```bash
npm run test:routes
```

This runs comprehensive tests for all API endpoints.

## Troubleshooting

### Issue: "Missing required environment variables"

**Solution**: Make sure your `.env` file contains:
- `DATABASE_URL`
- `OPENAI_API_KEY`
- `TAVILY_API_KEY`

### Issue: "MongoDB connection failed"

**Possible causes**:
1. MongoDB Atlas IP whitelist - Add your current IP to MongoDB Atlas
2. Wrong connection string - Verify `DATABASE_URL` in `.env`
3. Network issues - Check internet connection

**Solution**:
- If using MongoDB Atlas, go to Network Access and add your IP address
- Verify the connection string format: `mongodb+srv://username:password@cluster.mongodb.net/`

### Issue: "Port 3001 already in use"

**Solution**: Change the port in `.env`:
```
PORT=3002
```

Or kill the process using port 3001:
```bash
# Find the process
lsof -ti:3001

# Kill it
kill -9 $(lsof -ti:3001)
```

### Issue: "Cannot find module" errors

**Solution**: Reinstall dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Node.js version too old

**Solution**: Update Node.js to version 18 or higher:
```bash
# Using nvm (recommended)
nvm install 18
nvm use 18

# Or download from nodejs.org
```

## Using Docker (Alternative Method)

If you prefer to run everything in Docker containers:

### Prerequisites
- Docker Desktop installed
- Docker Compose installed

### Setup

1. **Build and start all services**:
```bash
docker-compose up -d
```

This will start:
- Backend API server (port 3001)
- MongoDB database (port 27017)
- Optional: MongoDB Express admin UI (port 8081) - use profile `admin`

2. **View logs**:
```bash
docker-compose logs -f backend
```

3. **Stop services**:
```bash
docker-compose down
```

4. **Stop and remove volumes** (clean slate):
```bash
docker-compose down -v
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with auto-reload |
| `npm run test:routes` | Test all API endpoints |
| `npm test` | Run Jest unit tests |
| `npm run lint` | Run ESLint code linting |
| `npm run seed` | Seed database with sample data |
| `npm run store-graph` | Store graph on blockchain |

## API Endpoints

Once running, the backend provides:

- `GET /health` - Health check
- `POST /api/v1/verify` - Main verification endpoint
- `POST /api/v1/verify/extension` - Browser extension endpoint
- `GET /api/v1/verify/:hash` - Get verification by hash
- `GET /api/v1/verify/recent` - Get recent verifications
- `POST /api/v1/webhook/telegram` - Telegram webhook
- `POST /api/v1/webhook/twitter` - Twitter webhook

## Environment Variables Reference

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-proj-...` |
| `TAVILY_API_KEY` | Tavily search API key | `tvly-dev-...` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `MODEL_NAME` | OpenAI model | `gpt-4o` |
| `BLOCKCHAIN_PROVIDER` | Blockchain provider | `ethereum` |
| `BLOCKCHAIN_DRY_RUN` | Simulate blockchain writes | `false` |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | - |
| `TWITTER_BEARER_TOKEN` | Twitter API token | - |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:5173` |

## Next Steps

After successful setup:

1. ✅ Server running on http://localhost:3001
2. ✅ Health check passing
3. ✅ Test routes with `npm run test:routes`
4. ✅ Connect frontend (set `VITE_API_URL=http://localhost:3001` in frontend `.env`)

## Project Structure

```
backend/
├── server.js              # Entry point
├── App.js                 # Express app configuration
├── .env                   # Environment variables (DO NOT COMMIT)
├── package.json           # Dependencies
├── routes/                # API routes
│   ├── verifyNews.js      # Main verification routes
│   ├── extension.js       # Extension routes
│   └── webhooks/          # Bot webhooks
├── controllers/           # Route controllers
├── services/              # Business logic
├── models/                # MongoDB schemas
├── utils/                 # Utilities
├── telegram/              # Telegram bot
├── twitter/               # Twitter bot
└── scripts/               # Utility scripts
```

## Need Help?

- Check the logs for error messages
- Review `README.md` for more details
- Review `QUICKSTART.md` for quick reference
- Verify all environment variables are set correctly
- Make sure Node.js version is 18+

---

**Ready to go!** Start the server with `npm run dev` and verify it's working at http://localhost:3001/health

