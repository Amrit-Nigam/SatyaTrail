# Twitter Bot Fixes - Mentions Not Working

## Issues Fixed

### 1. **Polling Mode Not Enabled**
- **Problem**: `TWITTER_USE_POLLING` was not set in `.env`, so the bot never started polling for mentions
- **Fix**: Added `TWITTER_USE_POLLING=true` to `.env` file
- **Location**: `backend/.env`

### 2. **Bot UserId Not Retrieved**
- **Problem**: Bot couldn't get its own user ID, which is required for filtering mentions
- **Fix**: Enhanced initialization to:
  - Get botUserId from OAuth client first
  - Fallback to bearer token if OAuth fails
  - Better error handling and logging
- **Location**: `backend/twitter/bot.js` - `initialize()` method

### 3. **Incorrect Reply Method**
- **Problem**: Used `client.v2.reply()` which doesn't exist in Twitter API v2
- **Fix**: Changed to use `client.v2.tweet()` with `reply` parameter
- **Location**: `backend/twitter/bot.js` - `reply()` method

### 4. **Polling Not Auto-Enabled**
- **Problem**: Polling only started if explicitly enabled, even when webhook wasn't configured
- **Fix**: Auto-enable polling if webhook URL is not set
- **Location**: `backend/twitter/bot.js` - `initialize()` method

### 5. **Better Error Handling & Logging**
- **Problem**: Limited visibility into what was happening
- **Fix**: Added comprehensive logging:
  - Poll start/stop messages
  - Mention detection logs
  - Error tracking with consecutive error counter
  - Better debugging information
- **Location**: `backend/twitter/bot.js` - `startMentionPolling()` method

### 6. **Tweet ID Format Handling**
- **Problem**: Twitter API v2 uses different field names (`id` vs `id_str`)
- **Fix**: Handle both formats in handlers
- **Location**: `backend/twitter/handlers.js` - `handleMention()` function

### 7. **Added Status Endpoint**
- **Fix**: Added `/api/v1/webhook/twitter/status` endpoint to check bot status
- **Location**: `backend/routes/webhooks/twitterWebhook.js`

## How to Test

### 1. Restart the Backend Server

```bash
cd backend
npm run dev
```

### 2. Check Bot Status

```bash
curl http://localhost:3001/api/v1/webhook/twitter/status
```

Expected response:
```json
{
  "status": "initialized",
  "operational": true,
  "botUserId": "your-bot-user-id",
  "hasClient": true,
  "hasStreamClient": true,
  "usePolling": true,
  "webhookUrl": null,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 3. Check Server Logs

Look for these log messages:
- `Twitter bot authenticated` - Bot successfully connected
- `Twitter mention polling started` - Polling is active
- `Polling for mentions` - Bot is checking for new mentions

### 4. Test Mention

1. Go to Twitter/X
2. Mention your bot: `@YourBotName verify https://example.com/article`
3. Wait up to 60 seconds (polling interval)
4. Check backend logs for:
   - `Found mentions` - Mentions detected
   - `Processing mention` - Mention being processed
   - `Reply sent` - Bot replied

## Troubleshooting

### Bot Not Initializing

**Check credentials in `.env`:**
- `TWITTER_API_KEY` - Should be set
- `TWITTER_API_SECRET` - Should be set  
- `TWITTER_BEARER_TOKEN` - Should be set
- `TWITTER_ACCESS_TOKEN` - Should be set
- `TWITTER_ACCESS_SECRET` - Should be set

### Polling Not Starting

**Check logs for:**
- `Twitter stream client created` - Stream client initialized
- `Starting Twitter mention polling` - Polling starting
- `Cannot start polling: botUserId unavailable` - User ID not found

### Mentions Not Detected

**Common issues:**
1. **Rate limiting** - Wait 60 seconds between requests per user
2. **Bot not mentioned** - Make sure you @ mention the bot account
3. **Poll interval** - Mentions are checked every 60 seconds
4. **Own tweets** - Bot ignores its own tweets

### Replies Not Sending

**Check:**
1. OAuth credentials are valid (`TWITTER_API_KEY`, `TWITTER_ACCESS_TOKEN`)
2. Bot has write permissions (Read & Write access in Twitter Developer Portal)
3. Error logs for API errors

## Configuration

### Polling Mode (Development - Current)

```env
TWITTER_USE_POLLING=true
TWITTER_WEBHOOK_URL=
```

- Checks for mentions every 60 seconds
- Best for development/testing
- No public endpoint needed

### Webhook Mode (Production)

```env
TWITTER_USE_POLLING=false
TWITTER_WEBHOOK_URL=https://your-domain.com/api/v1/webhook/twitter
```

- Real-time event delivery
- Requires public HTTPS endpoint
- Requires Twitter Developer Account with webhook subscription

## Next Steps

1. ✅ Restart backend server
2. ✅ Check status endpoint
3. ✅ Test with a mention
4. ✅ Monitor logs for errors
5. ✅ Verify bot replies are sent

## Environment Variables

All Twitter-related variables in `.env`:

```env
TWITTER_API_KEY=your-api-key
TWITTER_API_SECRET=your-api-secret
TWITTER_BEARER_TOKEN=your-bearer-token
TWITTER_ACCESS_TOKEN=your-access-token
TWITTER_ACCESS_SECRET=your-access-secret
TWITTER_USE_POLLING=true  # Enable polling mode
TWITTER_WEBHOOK_URL=      # Leave empty for polling mode
```

## API Endpoints

- `GET /api/v1/webhook/twitter` - CRC validation (for webhook setup)
- `POST /api/v1/webhook/twitter` - Receive webhook events
- `GET /api/v1/webhook/twitter/status` - Check bot status

---

**The bot should now respond to mentions!** 🎉

If issues persist, check the backend logs for detailed error messages.

