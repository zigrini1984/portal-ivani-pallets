"use server";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const SESSION_COOKIE = "ivani_portal_usuario";

// Cliente Supabase com Service Role para ignorar RLS no servidor
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Validar se o usuário é admin
async function getAdminUser() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  
  if (!session) return null;
  
  try {
    const user = JSON.parse(session.value);
    if (user.perfil === "admin") return user;
    return null;
  } catch {
    return null;
  }
}

export async function salvarColeta(data: any, id?: string) {
  const admin = await getAdminUser();
  if (!admin) {
    return { error: "Sem permissão para salvar coleta. Acesso restrito a administradores." };
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
      const { error } = await supabase
        .from("coletas")
        .insert({
          ...data,
          status: 'coletado',
          enviado_triagem: false
        });
      
      if (error) throw error;
    }

    revalidatePath("/admin/coleta");
    return { success: true };
  } catch (err: any) {
    console.error("Erro ao salvar coleta:", err);
    return { error: "Erro ao salvar: " + err.message };
  }
}

export async function excluirColeta(id: string) {
  const admin = await getAdminUser();
  if (!admin) {
    return { error: "Sem permissão para excluir coleta." };
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
    return { error: "Erro ao excluir: " + err.message };
  }
}

export async function enviarParaTriagem(coleta: any) {
  const admin = await getAdminUser();
  if (!admin) {
    return { error: "Sem permissão para enviar para triagem." };
  }

  const supabase = createAdminClient();

  try {
    // 1. Verificar se já existe em triagens
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
    const { error: insertError } = await supabase
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
      });

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
    return { error: "Erro ao transferir: " + err.message };
  }
}
