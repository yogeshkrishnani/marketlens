import { getEnvVariable } from '@/utils/envValidation';

export const config = {
  api: {
    alphaVantage: {
      baseUrl: 'https://www.alphavantage.co/query',
      apiKey: getEnvVariable('VITE_ALPHA_VANTAGE_API_KEY', 'demo'),
    },
  },

  features: {
    enableRealTimeData: getEnvVariable('VITE_ENABLE_REAL_TIME', 'false') === 'true',
  },

  settings: {
    isDevelopment: import.meta.env.DEV,
    refreshInterval: parseInt(getEnvVariable('VITE_REFRESH_INTERVAL', '60000')),
  },
};
