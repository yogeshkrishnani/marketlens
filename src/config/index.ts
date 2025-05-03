import { getEnvVariable } from '@/utils/envValidation';

// Application configuration derived from environment variables
export const config = {
  // API Configurations
  api: {
    alphaVantage: {
      baseUrl: 'https://www.alphavantage.co/query',
      apiKey: getEnvVariable('VITE_ALPHA_VANTAGE_API_KEY', 'demo'),
    },
    // Add other API configurations here
  },

  // Feature flags
  features: {
    // Example feature flag from environment variable
    enableRealTimeData: getEnvVariable('VITE_ENABLE_REAL_TIME', 'false') === 'true',
  },

  // Application settings
  settings: {
    isDevelopment: import.meta.env.DEV,
    refreshInterval: parseInt(getEnvVariable('VITE_REFRESH_INTERVAL', '60000')), // 1 minute default
  },
};
