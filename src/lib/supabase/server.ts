import { createClient } from "@supabase/supabase-js"

export function createServerSupabaseClient() {
  try {
    // Usar as variáveis de ambiente corretas
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl) {
      console.error("URL do Supabase não configurada")
      throw new Error("URL do Supabase não configurada")
    }

    if (!supabaseKey) {
      console.error("Chave do Supabase não configurada")
      throw new Error("Chave do Supabase não configurada")
    }

    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
    })
  } catch (error) {
    console.error("Erro ao criar cliente Supabase:", error)
    throw error
  }
}
