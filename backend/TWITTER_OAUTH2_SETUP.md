# Twitter OAuth 2.0 Setup Guide

This guide explains how to set up OAuth 2.0 authentication for the Twitter bot to fix authentication errors and rate limiting issues.

## Why OAuth 2.0?

- ✅ Better rate limits
- ✅ More secure authentication
- ✅ Modern Twitter API standard
- ✅ Better error handling

## Prerequisites

1. Twitter Developer Account (free tier is fine)
2. A Twitter App created in the Developer Portal
3. Read and Write permissions enabled

## Step-by-Step Setup

### Step 1: Enable OAuth 2.0 in Twitter Developer Portal

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Select your app
3. Go to **Settings** → **User authentication settings**
4. Click **Set up** or **Edit**

### Step 2: Configure OAuth 2.0 Settings

**App permissions:**
- Select: **Read and write** (or at least **Read and write** for bot functionality)

**Type of App:**
- Select: **Automated App or Bot**

**App info:**
- **App name:** SatyaTrail Bot (or your bot name)
- **Website URL:** `https://satyatrail.com` (or your website)
- **Callback URI / Redirect URL:** `http://localhost:3001/api/v1/webhook/twitter/callback` (for development)

5. Click **Save**

### Step 3: Generate OAuth 2.0 Credentials

After enabling OAuth 2.0, you'll see:
- **OAuth 2.0 Client ID**
- **OAuth 2.0 Client Secret**

Copy these values.

### Step 4: Generate OAuth 2.0 Access Token

For a bot, you need to generate an OAuth 2.0 access token. There are two methods:

#### Method A: Using Twitter Developer Portal (Easier)

1. Go to **Keys and tokens** tab in your app settings
2. Scroll to **OAuth 2.0 Bearer Token**
3. If you see **Generate** button, click it (for App-only access)
4. For User Context, you'll need to use the OAuth 2.0 flow (Method B)

#### Method B: Using OAuth 2.0 Flow (Recommended for Bots)

You need to complete the OAuth 2.0 authorization flow to get a user access token.

**Option 1: Use a script to generate the token**

Create a file `backend/scripts/generate-oauth2-token.js`:

```javascript
const { TwitterApi } = require('twitter-api-v2');
require('dotenv').config();

async function generateToken() {
  const client = new TwitterApi({
    clientId: process.env.TWITTER_OAUTH2_CLIENT_ID,
    clientSecret: process.env.TWITTER_OAUTH2_CLIENT_SECRET,
  });

  const authUrl = await client.generateAuthLink(process.env.TWITTER_OAUTH2_CALLBACK_URL);
  
  console.log('1. Visit this URL:', authUrl.url);
  console.log('2. Authorize the app');
  console.log('3. Copy the PIN/code from the callback URL');
  console.log('\nAfter authorization, run the script again with the PIN.');
}

generateToken().catch(console.error);
```

**Option 2: Use existing OAuth 1.0a tokens**

If you already have OAuth 1.0a tokens working, the bot will automatically fall back to them while you set up OAuth 2.0.

### Step 5: Update `.env` File

Add your OAuth 2.0 credentials to `backend/.env`:

```env
# OAuth 2.0 Configuration (Preferred)
TWITTER_OAUTH2_CLIENT_ID=your-oauth2-client-id-here
TWITTER_OAUTH2_CLIENT_SECRET=your-oauth2-client-secret-here
TWITTER_OAUTH2_ACCESS_TOKEN=your-oauth2-access-token-here

# OAuth 1.0a Configuration (Fallback - keep these for now)
TWITTER_API_KEY=your-api-key
TWITTER_API_SECRET=your-api-secret
TWITTER_ACCESS_TOKEN=your-access-token
TWITTER_ACCESS_SECRET=your-access-secret

# Bearer Token (Required for reading)
TWITTER_BEARER_TOKEN=your-bearer-token
```

### Step 6: Restart the Backend

```bash
cd backend
npm run dev
```

The bot will automatically:
1. Try OAuth 2.0 first (if configured)
2. Fall back to OAuth 1.0a if OAuth 2.0 is not available
3. Use retry logic with exponential backoff for rate limits
4. Wait for rate limits to reset automatically

## Current Implementation Features

### ✅ Automatic Fallback
- Tries OAuth 2.0 first
- Falls back to OAuth 1.0a if OAuth 2.0 fails
- Continues working with whatever credentials are available

### ✅ Rate Limit Handling
- Automatic retry with exponential backoff
- Respects rate limit reset times
- Adds delays between requests

### ✅ Better Error Handling
- Detailed error logging
- Rate limit detection
- Authentication error recovery

## Troubleshooting

### Error: "Request failed with code 429"

**Solution:** Rate limit reached. The bot will automatically:
- Wait for rate limit to reset
- Retry with exponential backoff
- Log when the next attempt will be

**Wait time:** Usually 15 minutes for most endpoints.

### Error: "Request failed with code 403"

**Possible causes:**
1. **Insufficient permissions** - Make sure app has "Read and Write" permissions
2. **Invalid credentials** - Check your OAuth 2.0 tokens
3. **App not approved** - Free tier apps need approval for some features

**Solution:**
- Check Twitter Developer Portal → App Settings → Permissions
- Regenerate tokens if needed
- Make sure OAuth 2.0 is enabled

### Bot Not Replying

**Check:**
1. Is `TWITTER_OAUTH2_ACCESS_TOKEN` set? (or OAuth 1.0a tokens)
2. Check logs for authentication errors
3. Verify bot has "Write" permissions

### Polling Not Starting

**Check:**
1. Is `TWITTER_BEARER_TOKEN` set?
2. Does the bot have a valid `botUserId`?
3. Check logs for "Starting Twitter mention polling"

## Quick Test

After setup, test the bot status:

```bash
curl http://localhost:3001/api/v1/webhook/twitter/status
```

Expected response should show:
- `status: "initialized"`
- `operational: true`
- `authMethod: "OAuth 2.0"` or `"OAuth 1.0a"`

## Migration from OAuth 1.0a to OAuth 2.0

You can migrate gradually:

1. ✅ Keep OAuth 1.0a credentials in `.env` (working)
2. ✅ Add OAuth 2.0 credentials
3. ✅ Bot will use OAuth 2.0 when available
4. ✅ Remove OAuth 1.0a credentials after OAuth 2.0 is confirmed working

## Resources

- [Twitter OAuth 2.0 Documentation](https://developer.twitter.com/en/docs/authentication/oauth-2-0)
- [Twitter API v2 Rate Limits](https://developer.twitter.com/en/docs/twitter-api/rate-limits)
- [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)

## Notes

- OAuth 2.0 User Context tokens don't expire (unlike Bearer tokens)
- Keep your OAuth 2.0 credentials secure - never commit to git
- Rate limits reset every 15 minutes for most endpoints
- The bot automatically handles rate limits and retries

---

**The bot will now use OAuth 2.0 with automatic retry and rate limit handling!** 🎉

