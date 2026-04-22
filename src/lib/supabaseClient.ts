import { createClient } from '@supabase/supabase-js';
import { getRequiredEnv, getRequiredHttpUrlEnv } from '../utils/env';

const supabaseUrl = getRequiredHttpUrlEnv('VITE_SUPABASE_URL');
const supabaseKey = getRequiredEnv('VITE_SUPABASE_ANON_KEY');

export const supabase = createClient(supabaseUrl, supabaseKey);
