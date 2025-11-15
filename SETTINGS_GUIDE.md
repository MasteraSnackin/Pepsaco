# Settings Page Guide

## Overview

The Settings page provides a user-friendly interface for configuring your Google Gemini API key without manually editing configuration files. This eliminates the need to work with `.env.local` files directly.

## Accessing Settings

1. Navigate to the application in your browser
2. Click on the **Settings** link in the navigation bar (gear icon)
3. Or visit directly: `http://localhost:3000/settings`

## Features

### 🔑 API Key Management

The Settings page allows you to:

- **Enter API Key**: Input your Google Gemini API key securely
- **Save Configuration**: Automatically saves to `.env.local` file
- **Test API Key**: Validates your API key works correctly
- **View Current Key**: Shows masked version of currently configured key (e.g., `AIza****xyz`)

### 📋 Step-by-Step Instructions

The page includes comprehensive instructions:

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key" or "Get API Key"
4. Copy the generated key
5. Paste it in the field and click "Save API Key"
6. Restart the development server for changes to take effect

### ✨ AI Features Overview

The page displays all AI features enabled by the API key:

- ✅ Natural language to SQL query generation
- ✅ Query explanation and optimization
- ✅ Automated business insights
- ✅ Executive summaries
- ✅ Smart alerts and anomaly detection

### 💰 Pricing Information

Clear pricing details are provided:

- **Free Tier**: 60 requests per minute
- **Estimated Cost**: ~$12-15/month for moderate usage
- **Cost Breakdown**:
  - Query generation: ~$0.005 per query
  - Daily insights: ~$0.75/month
  - Alerts: ~$0.50/month

## How It Works

### Backend Implementation

#### 1. Settings API Endpoint (`/api/settings`)

**GET Request**: Retrieves current API key status
```typescript
// Returns masked key if configured
{
  "configured": true,
  "key": "AIza****xyz"
}
```

**POST Request**: Saves new API key
```typescript
// Request body
{
  "apiKey": "your-gemini-api-key-here"
}

// Response
{
  "success": true,
  "message": "API key saved successfully"
}
```

#### 2. Test API Endpoint (`/api/settings/test`)

**GET Request**: Validates the configured API key
```typescript
// Success response
{
  "success": true,
  "message": "API key is valid and working",
  "testResponse": "API key is working"
}

// Error response
{
  "error": "Invalid API key. Please check your key and try again.",
  "details": "API_KEY_INVALID"
}
```

### Frontend Implementation

The Settings page (`/app/settings/page.tsx`) provides:

1. **State Management**:
   - `apiKey`: Current input value
   - `currentKey`: Masked version of saved key
   - `message`: Success/error messages
   - `isLoading`: Loading states for save/test operations

2. **Key Features**:
   - Password-masked input field
   - Real-time validation
   - Success/error message display
   - Responsive design with Tailwind CSS

3. **User Actions**:
   - **Save**: Writes to `.env.local` file
   - **Test**: Validates API key with Gemini API
   - **View**: Shows masked current key

## File Structure

```
pepsaco-db-viewer/
├── app/
│   ├── settings/
│   │   └── page.tsx              # Settings page UI
│   └── api/
│       └── settings/
│           ├── route.ts          # GET/POST for API key management
│           └── test/
│               └── route.ts      # GET for API key validation
├── components/
│   └── Navigation.tsx            # Updated with Settings link
└── .env.local                    # API key storage (auto-updated)
```

## Security Considerations

### ✅ Implemented Security Features

1. **Password Masking**: API key input field uses `type="password"`
2. **Masked Display**: Shows only first 4 and last 4 characters (e.g., `AIza****xyz`)
3. **Server-Side Storage**: Keys stored in `.env.local`, not in browser
4. **No Client Exposure**: API key never sent to client after saving

### ⚠️ Important Notes

- The `.env.local` file should be in `.gitignore` (already configured)
- Never commit API keys to version control
- Restart the development server after saving a new key
- The API key is stored in plain text in `.env.local` (standard practice for development)

## Troubleshooting

### Issue: "API key not configured"

**Solution**: 
1. Enter your API key in the Settings page
2. Click "Save API Key"
3. Restart the development server: `npm run dev`

### Issue: "Invalid API key"

**Solution**:
1. Verify you copied the complete key from Google AI Studio
2. Ensure no extra spaces or characters
3. Check your Google Cloud Console for API key restrictions
4. Try generating a new API key

### Issue: "API quota exceeded"

**Solution**:
1. Check your usage in Google Cloud Console
2. Wait for quota to reset (usually per minute)
3. Consider upgrading to a paid plan if needed

### Issue: Changes not taking effect

**Solution**:
1. Restart the development server
2. Clear browser cache
3. Check `.env.local` file was updated correctly

## Development Server Restart

After saving a new API key, you **must** restart the development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

This is required because Next.js loads environment variables at startup.

## API Key Best Practices

1. **Keep it Secret**: Never share your API key publicly
2. **Rotate Regularly**: Generate new keys periodically
3. **Monitor Usage**: Check Google Cloud Console for usage patterns
4. **Set Restrictions**: Configure API key restrictions in Google Cloud Console
5. **Use Different Keys**: Use separate keys for development and production

## Next Steps

After configuring your API key:

1. Visit the **AI Insights** page to see automated business insights
2. Try the **Query Builder** with natural language queries
3. Check the **Sales Dashboard** for AI-powered analytics
4. Monitor the **Alerts** section for anomaly detection

## Support

For issues or questions:

1. Check the [Gemini Migration Guide](./GEMINI_MIGRATION.md)
2. Review the [AI Integration Guide](./AI_INTEGRATION_GUIDE.md)
3. Consult the [Implementation Plan](./AI_IMPLEMENTATION_PLAN.md)

## Related Documentation

- [GEMINI_MIGRATION.md](./GEMINI_MIGRATION.md) - Complete migration guide
- [AI_INTEGRATION_GUIDE.md](./AI_INTEGRATION_GUIDE.md) - AI strategy and features
- [AI_IMPLEMENTATION_PLAN.md](./AI_IMPLEMENTATION_PLAN.md) - Step-by-step implementation
- [README.md](./README.md) - Main project documentation