export const validateEnvironmentVariables = (): void => {
  const requiredVars = ['VITE_ALPHA_VANTAGE_API_KEY'];

  const missingVars = requiredVars.filter(
    varName =>
      !import.meta.env[varName] || import.meta.env[varName] === 'your_alpha_vantage_api_key_here'
  );

  if (missingVars.length > 0) {
    if (import.meta.env.DEV) {
      console.error(
        `Missing required environment variables: ${missingVars.join(', ')}\n` +
          `Please check your .env file and ensure all required variables are set.`
      );
    } else {
      console.error(
        `Application is missing required configuration. Please contact the administrator.`
      );
    }
  }
};

export const getEnvVariable = (name: string, defaultValue?: string): string => {
  const value = import.meta.env[name] || defaultValue;

  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${name} is not defined`);
  }

  return value || '';
};
