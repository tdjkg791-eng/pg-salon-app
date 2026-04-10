import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

// Untyped client — we use our own hand-written row types from ./types for reads via casts.
// Supabase's Database generic is strict about relationship metadata we don't have.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
