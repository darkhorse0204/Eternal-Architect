import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://acyftmjnsygxculgwbpo.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjeWZ0bWpuc3lneGN1bGd3YnBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NzgwMjYsImV4cCI6MjA5NzU1NDAyNn0.349AvCag73RWfsUhqKyYnm_JjQBpryo_OnHND-RLxco';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
