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
    // 1. Validar campos obrigatórios
    if (!input.data_coleta) {
      return { success: false, error: "A data da coleta é obrigatória." };
    }

    if (!input.quantidade_material_bruto || input.quantidade_material_bruto <= 0) {
      return { success: false, error: "A quantidade de material bruto deve ser maior que zero." };
    }

    const supabase = createAdminClient();

    // 2. Inserir na tabela public.coletas
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

// Mantendo as outras funções para não quebrar o sistema, 
// mas garantindo que usem o admin client do arquivo centralizado.
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

export async function enviarParaTriagem(coleta: any) {
  try {
    const supabase = createAdminClient();

    const { data: existing, error: checkError } = await supabase
      .from("triagens")
      .select("id")
      .eq("coleta_id", coleta.id)
      .limit(1);

    if (checkError) throw checkError;

    if (!existing || existing.length === 0) {
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
          status: "em_triagem"
        });
      if (insertError) throw insertError;
    }

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
    return { error: err.message };
  }
}
