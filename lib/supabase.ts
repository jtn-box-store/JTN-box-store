import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL manquante");
}

if (!supabaseKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY manquante");
}

export const supabase = createClient(
  supabaseUrl.replace(/\/+$/, ""),
  supabaseKey
);