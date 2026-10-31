const required = ['SUPABASE_URL', 'SUPABASE_SECRET_KEY'] as const;

for (const key of required) {
  if (!process.env[key]?.trim()) {
    throw new Error(`Missing environment variable: ${key}`);
  }
}

const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}

export const env = {
  supabaseUrl: process.env.SUPABASE_URL!.trim(),
  supabaseKey: process.env.SUPABASE_SECRET_KEY!.trim(),
  port,
  clientOrigins: (process.env.CLIENT_URL ?? 'http://localhost:8080,http://127.0.0.1:8080')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  nodeEnv: process.env.NODE_ENV ?? 'development',
};
