# Quick Start Guide - Running the Backend

## Prerequisites

- Node.js 18 or higher
- MongoDB (you already have the connection string in your `.env`)
- API keys configured in `.env` file

## Step-by-Step Instructions

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Install Dependencies (if not already done)
```bash
npm install
```

### 3. Verify Environment Variables

Make sure your `.env` file has these required variables:
- `DATABASE_URL` - MongoDB connection string
- `OPENAI_API_KEY` - Your OpenAI API key
- `MODEL_NAME` - Model name (e.g., `gpt-4o` or `gpt-4-turbo`)
- `TAVILY_API_KEY` - Your Tavily API key

Optional variables:
- `TELEGRAM_BOT_TOKEN` - For Telegram bot
- `TWITTER_BEARER_TOKEN` - For Twitter bot
- `PORT` - Server port (default: 3001)

### 4. Run the Server

**Development mode** (with auto-reload on file changes):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

### 5. Verify It's Running

The server should start on `https://satyatrail.onrender.com` (or your configured PORT).

Test the health endpoint:
```bash
curl https://satyatrail.onrender.com/health
```

Or open in browser: https://satyatrail.onrender.com/health

You should see:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "model": "..."
  }
}
```

## Testing All Routes

Once the server is running, test all endpoints:

```bash
npm run test:routes
```

This will run the comprehensive test script that checks all API endpoints.

## Common Issues

### Port Already in Use
If port 3001 is already in use:
```bash
# Change PORT in .env file
PORT=3002 npm start
```

### MongoDB Connection Failed
- Check your `DATABASE_URL` in `.env`
- Make sure MongoDB is accessible
- If using MongoDB Atlas, check your IP whitelist

### Missing Environment Variables
The server will exit with an error message showing which variables are missing. Add them to your `.env` file.

## Using Docker (Alternative)

If you prefer Docker:

```bash
# Start MongoDB and Backend together
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

## Next Steps

1. ✅ Server running on https://satyatrail.onrender.com
2. ✅ Health check passing
3. ✅ Test routes with `npm run test:routes`
4. ✅ Connect frontend (set `VITE_API_URL=https://satyatrail.onrender.com` in frontend `.env`)

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm run test:routes` - Test all API endpoints
- `npm test` - Run Jest tests
- `npm run lint` - Run ESLint

