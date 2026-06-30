import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True cuando las variables de entorno de Supabase están configuradas. */
export const isSupabaseConfigured = Boolean(url && anonKey);

// Fallbacks de marcador para que la build no falle si aún no hay env vars.
// Las llamadas reales fallarán hasta configurar NEXT_PUBLIC_SUPABASE_URL y
// NEXT_PUBLIC_SUPABASE_ANON_KEY (ver .env.local.example).
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key'
);
