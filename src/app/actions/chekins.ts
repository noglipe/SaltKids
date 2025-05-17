"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createCheckin(formData: FormData) {
  try {
    const criancaId = formData.get("criancaId") as string
    const responsavelId = formData.get("responsavelId") as string
    const turmaId = formData.get("turmaId") as string

    if (!criancaId || !responsavelId || !turmaId) {
      return { error: "Dados incompletos para realizar o check-in" }
    }

    const supabase = createServerSupabaseClient()

    // Verificar se já existe um check-in ativo para esta criança
    const { data: checkinExistente, error: errorCheckin } = await supabase
      .from("checkins")
      .select("id")
      .eq("crianca_id", criancaId)
      .eq("status", "ativo")
      .maybeSingle()

    if (errorCheckin) {
      console.error("Erro ao verificar check-in existente:", errorCheckin)
      return { error: "Erro ao verificar check-in existente" }
    }

    if (checkinExistente) {
      return { error: "Esta criança já possui um check-in ativo" }
    }

    // Realizar o check-in
    const { data, error } = await supabase
      .from("checkins")
      .insert({
        crianca_id: criancaId,
        responsavel_id: responsavelId,
        turma_id: turmaId,
        horario: new Date().toISOString(),
        status: "ativo",
      })
      .select("id")
      .single()

    if (error) {
      console.error("Erro ao realizar check-in:", error)
      return { error: "Erro ao realizar check-in" }
    }

    revalidatePath("/checkin")
    revalidatePath("/dashboard")

    return { success: true, checkinId: data.id }
  } catch (error) {
    console.error("Erro não tratado:", error)
    return { error: "Ocorreu um erro inesperado" }
  }
}
