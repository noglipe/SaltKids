import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  const erro = [
    !supabaseUrl && "❌ Variável NEXT_PUBLIC_SUPABASE_URL não configurada.",
    !supabaseKey && "❌ Variável NEXT_PUBLIC_SUPABASE_ANON_KEY não configurada.",
  ]
    .filter(Boolean)
    .join("\n");

  throw new Error(`Erro ao configurar Supabase:\n${erro}`);
}

export const supabase = createClient(supabaseUrl, supabaseKey);
