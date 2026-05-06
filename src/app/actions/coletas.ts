"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export type CriarColetaInput = {
  data_coleta: string;
  quantidade_material_bruto: number;
  nf_saida_pce?: string;
  motorista?: string;
  caminhao?: string;
  observacao?: string;
};

export async function criarColeta(input: CriarColetaInput) {
  try {
    if (!input.data_coleta) {
      return { success: false, error: "A data da coleta é obrigatória." };
    }

    if (!input.quantidade_material_bruto || input.quantidade_material_bruto <= 0) {
      return { success: false, error: "A quantidade de material bruto deve ser maior que zero." };
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from("coletas")
      .insert({
        cliente_id: "pce",
        data_coleta: input.data_coleta,
        quantidade_material_bruto: input.quantidade_material_bruto,
        nf_saida_pce: input.nf_saida_pce || "",
        motorista: input.motorista || "",
        caminhao: input.caminhao || "",
        observacao: input.observacao || "",
        status: "coletado",
        enviado_triagem: false,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error("[criarColeta] Erro Supabase:", error);
      return { success: false, error: "Erro ao salvar no banco de dados: " + error.message };
    }

    revalidatePath("/admin/coleta");
    return { success: true };
  } catch (err: any) {
    console.error("[criarColeta] Erro inesperado:", err.message);
    return { success: false, error: "Erro interno ao criar coleta." };
  }
}

/**
 * Envia uma coleta para triagem de forma segura no servidor.
 */
export async function enviarColetaParaTriagem(coletaId: string) {
  try {
    if (!coletaId) {
      return { success: false, error: "ID da coleta não informado." };
    }

    const supabase = createAdminClient();

    // 1. Buscar coleta original
    const { data: coletas, error: coletaError } = await supabase
      .from("coletas")
      .select("id, cliente_id, data_coleta, quantidade_material_bruto, status, enviado_triagem, nf_saida_pce, motorista, caminhao")
      .eq("id", coletaId)
      .limit(1);

    if (coletaError) throw coletaError;
    
    const coleta = coletas && coletas.length > 0 ? coletas[0] : null;

    if (!coleta) {
      return { success: false, error: "Coleta não encontrada." };
    }

    // 2. Verificar se já existe triagem
    const { data: triagens, error: triagemCheckError } = await supabase
      .from("triagens")
      .select("id")
      .eq("coleta_id", coletaId)
      .limit(1);

    if (triagemCheckError) throw triagemCheckError;

    // 3. Se não existir, criar triagem
    if (!triagens || triagens.length === 0) {
      const { error: insertError } = await supabase
        .from("triagens")
        .insert({
          coleta_id: coleta.id,
          cliente_id: coleta.cliente_id || "pce",
          data_coleta: coleta.data_coleta,
          quantidade_total: coleta.quantidade_material_bruto,
          nf_saida_pce: coleta.nf_saida_pce || "",
          motorista: coleta.motorista || "",
          caminhao: coleta.caminhao || "",
          status: "pendente",
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error("[enviarColetaParaTriagem] Erro ao criar triagem:", insertError);
        return { success: false, error: "Erro ao criar registro de triagem: " + insertError.message };
      }
    }

    // 4. Atualizar coleta
    const { error: updateError } = await supabase
      .from("coletas")
      .update({
        status: "enviado_triagem",
        enviado_triagem: true,
        data_envio_triagem: new Date().toISOString()
      })
      .eq("id", coletaId);

    if (updateError) {
      console.error("[enviarColetaParaTriagem] Erro ao atualizar coleta:", updateError);
      return { success: false, error: "Erro ao atualizar status da coleta: " + updateError.message };
    }

    revalidatePath("/admin/coleta");
    return { success: true };
  } catch (err: any) {
    console.error("[enviarColetaParaTriagem] Erro inesperado:", err.message);
    return { success: false, error: "Falha ao processar envio para triagem: " + err.message };
  }
}

export async function salvarColeta(data: any, id?: string) {
  try {
    const supabase = createAdminClient();
    
    const payload = {
      nf_saida_pce: data.nf_saida_pce || "",
      motorista: data.motorista || "",
      caminhao: data.caminhao || "",
      data_coleta: data.data_coleta,
      quantidade_material_bruto: parseInt(data.quantidade_material_bruto || "0"),
      observacao: data.observacao || "",
      cliente_id: "pce",
      status: data.status || 'coletado',
      enviado_triagem: data.enviado_triagem ?? false
    };

    if (id) {
      const { error } = await supabase.from("coletas").update(payload).eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("coletas").insert({ ...payload, created_at: new Date().toISOString() });
      if (error) throw error;
    }

    revalidatePath("/admin/coleta");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function excluirColeta(id: string) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("coletas").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/admin/coleta");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}
