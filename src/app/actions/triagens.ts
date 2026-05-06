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
 * Classifica uma triagem com os totais gerais e itens por modelo (opcional).
 * Ao finalizar, encaminha reforma+remanufatura para manutenção.
 */
export async function classificarTriagem(input: ClassificarTriagemInput) {
  try {
    const supabase = createAdminClient();

    // 1. Buscar triagem original para validar total
    const { data: triagens, error: fetchError } = await supabase
      .from("triagens")
      .select("id, quantidade_total, coleta_id, cliente_id, status")
      .eq("id", input.triagemId)
      .limit(1);

    if (fetchError) throw fetchError;

    const triagem = triagens && triagens.length > 0 ? triagens[0] : null;
    if (!triagem) return { success: false, error: "Triagem não encontrada." };

    if (triagem.status === "concluida") {
      return { success: false, error: "Triagem já está concluída e não pode ser editada." };
    }

    // 2. Validar soma
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
        error: `Para concluir, a soma (${somaTotal}) deve ser igual ao total coletado (${triagem.quantidade_total}).`,
      };
    }

    const novoStatus = input.finalizar ? "concluida" : "em_andamento";

    // 3. Atualizar triagem
    const { error: updateError } = await supabase
      .from("triagens")
      .update({
        quantidade_manutencao: input.quantidade_reforma,
        quantidade_remanufatura: input.quantidade_remanufatura,
        quantidade_compra_ivani: input.quantidade_compra,
        quantidade_sucata: input.quantidade_sucateado,
        observacao: input.observacao || "",
        status: novoStatus,
      })
      .eq("id", input.triagemId)
      .select("id");

    if (updateError) throw updateError;

    // 4. Sincronizar itens por modelo, se fornecidos
    if (input.itens && input.itens.length > 0) {
      await supabase.from("triagem_itens").delete().eq("triagem_id", input.triagemId);

      const itensParaInserir = input.itens.map((it) => ({
        triagem_id: input.triagemId,
        modelo_pallet_id: it.modelo_pallet_id,
        quantidade_reforma: it.quantidade_reforma || 0,
        quantidade_remanufatura: it.quantidade_remanufatura || 0,
        quantidade_compra_ivani: it.quantidade_compra_ivani || 0,
      }));

      const { error: itensError } = await supabase
        .from("triagem_itens")
        .insert(itensParaInserir);

      if (itensError) throw itensError;
    }

    // 5. Se finalizar, encaminhar para manutenção (REFORMA e REMANUFATURA)
    if (input.finalizar) {
      // Importação dinâmica para evitar circular dependency se houver
      const { gerarManutencoesDaTriagem } = await import("@/app/actions/manutencao");
      
      // Atualizar coleta se existir
      if (triagem.coleta_id) {
        await supabase
          .from("coletas")
          .update({ status: "triagem_concluida" })
          .eq("id", triagem.coleta_id)
          .select("id");
      }

      // Gerar manutenções
      const resManut = await gerarManutencoesDaTriagem(input.triagemId);
      if (!resManut.success) {
        console.warn("[classificarTriagem] Falha ao gerar manutenções:", resManut.error);
        // Não travamos a conclusão da triagem se a manutenção falhar, 
        // mas logamos para o manual sync depois.
      }
    }

    revalidatePath("/admin/triagem");
    revalidatePath("/admin/manutencao");
    revalidatePath("/admin/coleta");
    return { success: true };
  } catch (err: any) {
    console.error("[classificarTriagem] Erro:", err.message);
    return { success: false, error: "Erro ao salvar triagem: " + err.message };
  }
}

/**
 * Busca os dados completos de uma triagem pelo ID.
 */
export async function getTriagemById(triagemId: string) {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("triagens")
      .select(
        "id, coleta_id, cliente_id, nf_saida_pce, motorista, caminhao, data_coleta, quantidade_total, quantidade_sucata, quantidade_manutencao, quantidade_remanufatura, quantidade_compra_ivani, status, observacao, created_at"
      )
      .eq("id", triagemId)
      .limit(1);

    if (error) throw error;
    return { success: true, triagem: data?.[0] || null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
