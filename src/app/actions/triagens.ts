"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ClassificarTriagemInput = {
  triagemId: string;
  quantidade_reforma: number;
  quantidade_remanufatura: number;
  quantidade_compra: number;
  quantidade_sucateado: number;
  observacao?: string;
  itens?: {
    modelo_pallet_id: string;
    quantidade_reforma: number;
    quantidade_remanufatura: number;
    quantidade_compra_ivani: number;
    quantidade_sucateado: number;
  }[];
  finalizar?: boolean;
};

// ─── Actions ─────────────────────────────────────────────────────────────────

/**
 * Classifica uma triagem, atualiza totais e itens por modelo.
 * Ao finalizar, gera automaticamente os registros de manutenção.
 */
export async function classificarTriagem(input: ClassificarTriagemInput) {
  try {
    const supabase = createAdminClient();

    // 1. Buscar triagem original para validar total
    const { data: triagens, error: fetchError } = await supabase
      .from("triagens")
      .select("id, quantidade_total, coleta_id, status")
      .eq("id", input.triagemId);

    if (fetchError) throw fetchError;
    const triagem = triagens?.[0];

    if (!triagem) return { success: false, error: "Triagem não encontrada." };
    if (triagem.status === "concluida") {
      return { success: false, error: "Triagem já está concluída e não pode ser alterada." };
    }

    // 2. Validar soma total
    const somaTotal =
      (input.quantidade_reforma || 0) +
      (input.quantidade_remanufatura || 0) +
      (input.quantidade_compra || 0) +
      (input.quantidade_sucateado || 0);

    if (somaTotal > triagem.quantidade_total) {
      return {
        success: false,
        error: `A soma (${somaTotal}) excede o total coletado (${triagem.quantidade_total}).`,
      };
    }

    if (input.finalizar && somaTotal !== triagem.quantidade_total) {
      return {
        success: false,
        error: `Para concluir, a soma (${somaTotal}) deve ser EXATAMENTE igual ao total coletado (${triagem.quantidade_total}).`,
      };
    }

    const novoStatus = input.finalizar ? "concluida" : "em_andamento";
    const triadoEm = input.finalizar ? new Date().toISOString() : null;

    // 3. Atualizar triagem
    const updateData: any = {
      quantidade_manutencao: input.quantidade_reforma,
      quantidade_remanufatura: input.quantidade_remanufatura,
      quantidade_compra_ivani: input.quantidade_compra,
      quantidade_sucata: input.quantidade_sucateado,
      observacao: input.observacao || "",
      status: novoStatus,
      updated_at: new Date().toISOString()
    };

    if (triadoEm) {
      updateData.triado_em = triadoEm;
    }

    const { error: updateError } = await supabase
      .from("triagens")
      .update(updateData)
      .eq("id", input.triagemId);

    if (updateError) throw updateError;

    // 4. Sincronizar itens por modelo
    if (input.itens && input.itens.length > 0) {
      // Deleta itens antigos (Clean & Sync)
      const { error: delError } = await supabase
        .from("triagem_itens")
        .delete()
        .eq("triagem_id", input.triagemId);
      
      if (delError) throw delError;

      const itensParaInserir = input.itens.map((it) => ({
        triagem_id: input.triagemId,
        modelo_pallet_id: it.modelo_pallet_id,
        quantidade_reforma: it.quantidade_reforma || 0,
        quantidade_remanufatura: it.quantidade_remanufatura || 0,
        quantidade_compra_ivani: it.quantidade_compra_ivani || 0,
        quantidade_sucateado: it.quantidade_sucateado || 0
      }));

      const { error: insError } = await supabase
        .from("triagem_itens")
        .insert(itensParaInserir);

      if (insError) throw insError;
    }

    // 5. Fluxo Automático ao Finalizar: Gerar Manutenções
    if (input.finalizar) {
      // Importação dinâmica para evitar circular dependency
      const { gerarManutencoesDaTriagem } = await import("@/app/actions/manutencao");
      
      // Atualizar status da coleta original
      if (triagem.coleta_id) {
        await supabase
          .from("coletas")
          .update({ status: "triagem_concluida", updated_at: new Date().toISOString() })
          .eq("id", triagem.coleta_id);
      }

      // Tentar gerar as manutenções
      const resManut = await gerarManutencoesDaTriagem(input.triagemId);
      
      if (!resManut.success) {
        // Se falhar ao gerar manutenção, retornamos erro para o usuário não achar que está tudo OK
        return { 
          success: false, 
          error: "Triagem concluída, mas falhou ao gerar manutenções: " + resManut.error 
        };
      }
    }

    revalidatePath("/admin/triagem");
    revalidatePath("/admin/manutencao");
    revalidatePath("/admin/coleta");

    return { 
      success: true, 
      message: input.finalizar 
        ? "Triagem concluída e manutenção gerada com sucesso." 
        : "Triagem salva como rascunho." 
    };
  } catch (err: any) {
    console.error("[classificarTriagem] Erro fatal:", err.message);
    return { success: false, error: "Erro ao salvar triagem: " + err.message };
  }
}

/**
 * Busca triagem detalhada pelo ID.
 */
export async function getTriagemById(triagemId: string) {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("triagens")
      .select("id, coleta_id, cliente_id, nf_saida_pce, motorista, caminhao, data_coleta, quantidade_total, quantidade_sucata, quantidade_manutencao, quantidade_remanufatura, quantidade_compra_ivani, status, observacao, created_at, triado_em")
      .eq("id", triagemId);

    if (error) throw error;
    return { success: true, triagem: data?.[0] || null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
