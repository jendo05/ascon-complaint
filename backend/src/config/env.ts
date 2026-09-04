const required = ['SUPABASE_URL', 'SUPABASE_SECRET_KEY'] as const

for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing env variable: ${key}`)
}

export const env = {
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseKey: process.env.SUPABASE_SECRET_KEY!,
  port:        Number(process.env.PORT ?? 3000),
  clientUrl:   process.env.CLIENT_URL ?? '*',
  nodeEnv:     process.env.NODE_ENV ?? 'development',
}