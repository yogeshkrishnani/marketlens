# Environment Variables Setup

This document explains how to set up environment variables for the MarketLens application.

## Required Environment Variables

The application requires the following environment variables to be set:

- `VITE_ALPHA_VANTAGE_API_KEY` - API key for Alpha Vantage financial data API

## Setting Up Environment Variables

1. Copy the `.env.example` file to a new file called `.env`:

```bash
cp .env.example .env
```

2. Open the `.env` file and replace the placeholder values with your actual API keys:

```
VITE_ALPHA_VANTAGE_API_KEY=your_actual_api_key_here
```

3. Make sure to never commit your `.env` file with actual API keys to version control.

## Getting API Keys

### Alpha Vantage API

1. Visit [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
2. Fill out the form to get a free API key
3. Copy the API key and paste it in your `.env` file

## Environment Variables in Different Environments

### Development

In development, the application uses variables from your local `.env` file.

### Production

For production deployments, set these environment variables in your hosting provider's configuration:

- For Vercel: Use the Environment Variables section in the project settings
- For Netlify: Use the Environment Variables section in the site settings
- For other providers: Follow their specific documentation for setting environment variables

## Troubleshooting

If you encounter errors related to missing environment variables:

1. Check that your `.env` file exists in the project root
2. Verify that all required variables are set in the `.env` file
3. Restart the development server after making changes to environment variables

If you're still having issues, check the console for specific error messages that might provide more details.