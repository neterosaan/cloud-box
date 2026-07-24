const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'DIRECT_URL',
  'SUPABASE_URL',
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_BUCKET_NAME',
];

export const validateEnv = () => {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `[Startup] Missing required environment variables: ${missing.join(', ')}`
    );
    process.exit(1);
  }
};