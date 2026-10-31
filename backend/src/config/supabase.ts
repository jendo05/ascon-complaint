import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

const authOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
};

export const authClient = createClient(env.supabaseUrl, env.supabaseKey, authOptions);

export const getSupabaseClient = (accessToken: string) =>
  createClient(env.supabaseUrl, env.supabaseKey, {
    ...authOptions,
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });
