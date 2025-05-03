/**
 * Validates that all required environment variables are present
 * This is called during app initialization to ensure proper configuration
 */
export const validateEnvironmentVariables = (): void => {
  const requiredVars = [
    'VITE_ALPHA_VANTAGE_API_KEY',
    // Add other required environment variables here
  ];

  const missingVars = requiredVars.filter(
    varName =>
      !import.meta.env[varName] || import.meta.env[varName] === 'your_alpha_vantage_api_key_here'
  );

  if (missingVars.length > 0) {
    // In development, provide a helpful message
    if (import.meta.env.DEV) {
      console.error(
        `Missing required environment variables: ${missingVars.join(', ')}\n` +
          `Please check your .env file and ensure all required variables are set.`
      );
    } else {
      // In production, log a generic error to avoid exposing variable names
      console.error(
        `Application is missing required configuration. Please contact the administrator.`
      );
    }
  }
};

/**
 * Gets an environment variable with proper typing and validation
 * @param name The name of the environment variable
 * @param defaultValue Optional default value if not found
 * @returns The environment variable value
 */
export const getEnvVariable = (name: string, defaultValue?: string): string => {
  const value = import.meta.env[name] || defaultValue;

  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${name} is not defined`);
  }

  return value || '';
};
