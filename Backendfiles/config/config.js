// config/config.js
// backend/config/config.js

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Replicate __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, ".env"),
});

export const config = {
  supabaseurl: process.env.SUPABASE_URL,
  port: process.env.PORT,
  secret:process.env.SESSION_SECRET,
  anonkey:process.env.SUPABASE_ANON_KEY,
  gmail: process.env.gmail,
  app_password: process.env.app_password,
};