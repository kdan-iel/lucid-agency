import { createClient } from '@supabase/supabase-js';
import { emitInvalidSession } from '../utils/authSession';
import { getRequiredEnv, getRequiredHttpUrlEnv } from '../utils/env';

const supabaseUrl = getRequiredHttpUrlEnv('VITE_SUPABASE_URL');
const supabaseKey = getRequiredEnv('VITE_SUPABASE_ANON_KEY');

const authAwareFetch: typeof fetch = async (input, init) => {
  const response = await fetch(input, init);

  if (response.status === 401) {
    emitInvalidSession('invalid_session');
  }

  return response;
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    fetch: authAwareFetch,
  },
});
