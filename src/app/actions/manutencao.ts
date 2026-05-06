"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

/**
 * Inicia o processo de manutenção para um item.
 */
export async function iniciarManutencao(id: string) {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("manutencoes")
      .update({
        status: "em_andamento",
        data_inicio: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id");

    if (error) throw error;

    revalidatePath("/admin/manutencao");
    return { success: true };
  } catch (err: any) {
    console.error("[iniciarManutencao] Erro:", err.message);
    return { success: false, error: err.message || "Erro ao iniciar manutenção." };
  }
}

/**
 * Conclui a manutenção e envia para o estoque.
 */
export async function concluirManutencao(id: string) {
  try {
    const supabase = createAdminClient();

    // 1. Buscar o item de manutenção
    const { data: itemData, error: fetchError } = await supabase
      .from("manutencoes")
      .select("id, cliente_id, modelo_id, modelo_nome_snapshot, quantidade, status, tipo_servico")
      .eq("id", id)
      .limit(1);

    if (fetchError) throw fetchError;
    const item = itemData && itemData.length > 0 ? itemData[0] : null;

    if (!item) throw new Error("Item de manutenção não encontrado.");
    if (item.status === "concluida") throw new Error("Este item já foi concluído.");

    // 2. Atualizar status da manutenção
    const { error: updateError } = await supabase
      .from("manutencoes")
      .update({
        status: "concluida",
        data_conclusao: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id");

    if (updateError) throw updateError;

    // 3. Atualizar Estoque Acumulado
    const clienteId = item.cliente_id || "pce";
    
    // Verificar se já existe no estoque para este modelo
    const { data: estoqueAtual, error: estError } = await supabase
      .from("estoque_pallets")
      .select("id, quantidade")
      .eq("cliente_id", clienteId)
      .eq("modelo_id", item.modelo_id)
      .limit(1);

    if (estError) throw estError;

    if (estoqueAtual && estoqueAtual.length > 0) {
      // Atualizar existente
      const novaQtd = (estoqueAtual[0].quantidade || 0) + item.quantidade;
      await supabase
        .from("estoque_pallets")
        .update({ 
          quantidade: novaQtd,
          updated_at: new Date().toISOString() 
        })
        .eq("id", estoqueAtual[0].id);
    } else {
      // Criar novo registro de estoque
      await supabase.from("estoque_pallets").insert({
        cliente_id: clienteId,
        modelo_id: item.modelo_id,
        modelo_nome_snapshot: item.modelo_nome_snapshot,
        quantidade: item.quantidade,
        updated_at: new Date().toISOString()
      });
    }

    revalidatePath("/admin/manutencao");
    revalidatePath("/admin/estoque");
    return { success: true };
  } catch (err: any) {
    console.error("[concluirManutencao] Erro:", err.message);
    return { success: false, error: err.message || "Erro ao concluir manutenção." };
  }
}
