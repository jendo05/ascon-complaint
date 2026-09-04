import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

export const getSupabaseClient = (accessToken: string) => {
  return createClient(env.supabaseUrl, env.supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
};