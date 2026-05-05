"use server";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const SESSION_COOKIE = "ivani_portal_usuario";

/**
 * Cliente Supabase com Service Role para ignorar RLS no servidor.
 * O Service Role Key NUNCA deve ser exposto no client-side.
 */
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Configurações do Supabase (URL ou Service Role Key) não encontradas.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Valida se o usuário logado via cookie tem perfil 'admin'.
 */
async function validateAdminPermission() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  
  if (!session) return { allowed: false, error: "Sessão não encontrada. Faça login novamente." };
  
  try {
    const user = JSON.parse(session.value);
    if (user.perfil === "admin") {
      return { allowed: true, user };
    }
    return { allowed: false, error: "Sem permissão para realizar esta operação. Acesso restrito a administradores." };
  } catch (err) {
    return { allowed: false, error: "Erro ao validar permissões." };
  }
}

export async function salvarColeta(data: any, id?: string) {
  const auth = await validateAdminPermission();
  if (!auth.allowed) {
    return { error: auth.error };
  }

  const supabase = createAdminClient();
  
  try {
    if (id) {
      // Update
      const { error } = await supabase
        .from("coletas")
        .update(data)
        .eq("id", id);
      
      if (error) throw error;
    } else {
      // Insert
      const { data: newColeta, error } = await supabase
        .from("coletas")
        .insert({
          ...data,
          status: 'coletado',
          enviado_triagem: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;

      // Opcional: Se houver necessidade de registrar na timeline (lote_eventos)
      // Como coletas ainda não são lotes oficiais, podemos pular ou criar um evento genérico
      // se a tabela existir e houver um ID de lote relacionado.
    }

    revalidatePath("/admin/coleta");
    return { success: true };
  } catch (err: any) {
    console.error("Erro ao salvar coleta:", err);
    if (err.code === '42501') {
      return { error: "Sem permissão para criar coleta (RLS). Verifique as chaves do servidor." };
    }
    return { error: "Erro ao salvar: " + (err.message || "Erro desconhecido") };
  }
}

export async function excluirColeta(id: string) {
  const auth = await validateAdminPermission();
  if (!auth.allowed) {
    return { error: auth.error };
  }

  const supabase = createAdminClient();

  try {
    const { error } = await supabase
      .from("coletas")
      .delete()
      .eq("id", id);
    
    if (error) throw error;

    revalidatePath("/admin/coleta");
    return { success: true };
  } catch (err: any) {
    console.error("Erro ao excluir coleta:", err);
    return { error: "Erro ao excluir: " + (err.message || "Erro desconhecido") };
  }
}

export async function enviarParaTriagem(coleta: any) {
  const auth = await validateAdminPermission();
  if (!auth.allowed) {
    return { error: auth.error };
  }

  const supabase = createAdminClient();

  try {
    // 1. Verificar se já existe em triagens para evitar duplicidade
    const { data: existingTriagem } = await supabase
      .from("triagens")
      .select("id")
      .eq("coleta_id", coleta.id)
      .maybeSingle();

    if (existingTriagem) {
      // Apenas atualiza o status na coleta se já existir triagem (resiliência)
      await supabase
        .from("coletas")
        .update({ enviado_triagem: true, status: 'enviado_triagem' })
        .eq("id", coleta.id);
      
      revalidatePath("/admin/coleta");
      return { success: true };
    }

    // 2. Criar registro em Triagens
    const { data: triagem, error: insertError } = await supabase
      .from("triagens")
      .insert({
        coleta_id: coleta.id,
        cliente_id: "pce",
        nf_saida_pce: coleta.nf_saida_pce,
        motorista: coleta.motorista,
        caminhao: coleta.caminhao,
        data_coleta: coleta.data_coleta,
        quantidade_total: coleta.quantidade_material_bruto,
        quantidade_sucata: 0,
        quantidade_manutencao: 0,
        quantidade_remanufatura: 0,
        quantidade_compra_ivani: 0,
        status: "em_triagem"
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 3. Atualizar status na tabela Coletas
    const { error: updateError } = await supabase
      .from("coletas")
      .update({
        enviado_triagem: true,
        status: "enviado_triagem",
        data_envio_triagem: new Date().toISOString()
      })
      .eq("id", coleta.id);

    if (updateError) throw updateError;

    revalidatePath("/admin/coleta");
    return { success: true };
  } catch (err: any) {
    console.error("Erro ao enviar para triagem:", err);
    return { error: "Erro ao transferir: " + (err.message || "Erro desconhecido") };
  }
}

