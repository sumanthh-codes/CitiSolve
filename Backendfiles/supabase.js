import dotenv from 'dotenv';
dotenv.config(); // load .env

import { createClient } from '@supabase/supabase-js' ;

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey)
