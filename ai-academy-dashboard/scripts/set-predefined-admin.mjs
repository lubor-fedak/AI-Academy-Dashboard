#!/usr/bin/env node
/**
 * Add a predefined admin/mentor to the database.
 * Uses PREdefined_ADMIN_EMAIL and PREdefined_ADMIN_NAME from env - never in code.
 *
 * - Local: loads .env.local if present
 * - Vercel: uses env vars from Vercel dashboard (set PREdefined_ADMIN_EMAIL, etc.)
 *
 * Runs during build - skips if PREdefined_ADMIN_EMAIL not set (e.g. PR builds).
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envLocal = join(__dirname, '..', '.env.local');
if (existsSync(envLocal)) {
  for (const line of readFileSync(envLocal, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

const email = process.env.PREdefined_ADMIN_EMAIL;
const name = process.env.PREdefined_ADMIN_NAME;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!email?.trim()) {
  console.log('set-predefined-admin: PREdefined_ADMIN_EMAIL not set, skipping');
  process.exit(0);
}
if (!supabaseUrl || !serviceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

try {
  const { error } = await supabase.rpc('add_predefined_admin', {
    p_email: email.trim(),
    p_name: name?.trim() || null,
  });
  if (error) throw error;
  console.log(`Predefined admin added: ${email}`);
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
