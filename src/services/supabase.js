import { createClient } from '@supabase/supabase-js';

// .trim() previene errores silenciosos si hay espacios accidentales en .env.local
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL  ?? '').trim();
const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '[Supabase] ⚠️  Variables de entorno no configuradas.\n' +
    'Agrega VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env.local'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
