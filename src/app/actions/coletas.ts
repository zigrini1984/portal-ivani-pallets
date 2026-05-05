"use server";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const SESSION_COOKIE = "ivani_portal_usuario";

/**
 * Cliente Supabase com Service Role para ignorar RLS no servidor.
 */
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("ERRO: Configurações do Supabase ausentes no servidor.");
    throw new Error("Configuração do servidor incompleta.");
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
 * Conforme exemplo obrigatório do usuário.
 */
async function validateAdminPermission() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE);
  
  if (!raw) {
    throw new Error("Usuário não autenticado");
  }
  
  let user;
  try {
    user = JSON.parse(raw.value);
  } catch (err) {
    throw new Error("Sessão inválida");
  }
  
  if (user.perfil !== "admin") {
    throw new Error("Sem permissão");
  }

  return user;
}

export async function salvarColeta(data: any, id?: string) {
  try {
    // 1. Validar permissão
    await validateAdminPermission();

    // 2. Validar campos obrigatórios e garantir que não há undefined
    const nf_saida_pce = data.nf_saida_pce?.toString() || "";
    const motorista = data.motorista?.toString() || "";
    const caminhao = data.caminhao?.toString() || "";
    const data_coleta = data.data_coleta?.toString() || "";
    const quantidade_material_bruto = parseInt(data.quantidade_material_bruto || "0");
    const observacao = data.observacao?.toString() || "";
    const cliente_id = data.cliente_id?.toString() || "pce";

    if (!data_coleta) {
      return { error: "A data da coleta é obrigatória." };
    }

    if (isNaN(quantidade_material_bruto) || quantidade_material_bruto <= 0) {
      return { error: "A quantidade de material bruto deve ser maior que zero." };
    }

    const supabase = createAdminClient();
    
    const payload = {
      nf_saida_pce,
      motorista,
      caminhao,
      data_coleta,
      quantidade_material_bruto,
      observacao,
      cliente_id,
      status: 'coletado',
      enviado_triagem: false
    };

    if (id) {
      // Update
      const { error } = await supabase
        .from("coletas")
        .update(payload)
        .eq("id", id);
      
      if (error) {
        console.error("Erro ao atualizar coleta:", error);
        throw new Error("Erro ao salvar coleta");
      }
    } else {
      // Insert
      const { error } = await supabase
        .from("coletas")
        .insert({
          ...payload,
          created_at: new Date().toISOString()
        });
      
      if (error) {
        console.error("Erro ao criar coleta:", error);
        throw new Error("Erro ao salvar coleta");
      }
    }

    revalidatePath("/admin/coleta");
    return { success: true };
  } catch (err: any) {
    console.error("Erro na Server Action salvarColeta:", err.message);
    // Retorna o erro de forma controlada para o frontend
    return { error: err.message || "Erro inesperado ao processar a coleta" };
  }
}

export async function excluirColeta(id: string) {
  try {
    await validateAdminPermission();
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("coletas")
      .delete()
      .eq("id", id);
    
    if (error) {
      console.error("Erro ao excluir coleta:", error);
      throw new Error("Erro ao excluir coleta");
    }

    revalidatePath("/admin/coleta");
    return { success: true };
  } catch (err: any) {
    console.error("Erro na Server Action excluirColeta:", err.message);
    return { error: err.message };
  }
}

export async function enviarParaTriagem(coleta: any) {
  try {
    await validateAdminPermission();
    const supabase = createAdminClient();

    // 1. Verificar duplicidade
    const { data: existingTriagem } = await supabase
      .from("triagens")
      .select("id")
      .eq("coleta_id", coleta.id)
      .maybeSingle();

    if (existingTriagem) {
      await supabase
        .from("coletas")
        .update({ enviado_triagem: true, status: 'enviado_triagem' })
        .eq("id", coleta.id);
      
      revalidatePath("/admin/coleta");
      return { success: true };
    }

    // 2. Criar registro em Triagens
    const { error: insertError } = await supabase
      .from("triagens")
      .insert({
        coleta_id: coleta.id,
        cliente_id: coleta.cliente_id || "pce",
        nf_saida_pce: coleta.nf_saida_pce || "",
        motorista: coleta.motorista || "",
        caminhao: coleta.caminhao || "",
        data_coleta: coleta.data_coleta,
        quantidade_total: coleta.quantidade_material_bruto,
        quantidade_sucata: 0,
        quantidade_manutencao: 0,
        quantidade_remanufatura: 0,
        quantidade_compra_ivani: 0,
        status: "em_triagem"
      });

    if (insertError) {
      console.error("Erro ao criar triagem:", insertError);
      throw new Error("Erro ao transferir para triagem");
    }

    // 3. Atualizar status na tabela Coletas
    const { error: updateError } = await supabase
      .from("coletas")
      .update({
        enviado_triagem: true,
        status: "enviado_triagem",
        data_envio_triagem: new Date().toISOString()
      })
      .eq("id", coleta.id);

    if (updateError) {
      console.error("Erro ao atualizar status da coleta:", updateError);
      throw new Error("Erro ao concluir transferência");
    }

    revalidatePath("/admin/coleta");
    return { success: true };
  } catch (err: any) {
    console.error("Erro na Server Action enviarParaTriagem:", err.message);
    return { error: err.message };
  }
}


