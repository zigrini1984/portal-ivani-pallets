"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

/**
 * Gera registros de manutenção para uma triagem finalizada.
 * Filtra apenas reforma e remanufatura.
 */
export async function gerarManutencoesDaTriagem(triagemId: string) {
  try {
    const supabase = createAdminClient();

    // 1. Buscar dados da triagem
    const { data: triagemData, error: triError } = await supabase
      .from("triagens")
      .select("id, coleta_id, cliente_id, status")
      .eq("id", triagemId)
      .single();

    if (triError || !triagemData) throw new Error("Triagem não encontrada.");

    // 2. Buscar itens da triagem (por modelo)
    const { data: itens, error: itensError } = await supabase
      .from("triagem_itens")
      .select(`
        modelo_pallet_id,
        quantidade_reforma,
        quantidade_remanufatura,
        modelos_pallets ( nome )
      `)
      .eq("triagem_id", triagemId);

    if (itensError) throw itensError;

    const manutItems: any[] = [];

    // 3. Processar cada item da triagem
    for (const item of (itens || [])) {
      const modeloNome = (item.modelos_pallets as any)?.nome || "Modelo Desconhecido";
      
      // REFORMA
      if (item.quantidade_reforma > 0) {
        manutItems.push({
          triagem_id: triagemId,
          coleta_id: triagemData.coleta_id,
          cliente_id: triagemData.cliente_id || "pce",
          modelo_id: item.modelo_pallet_id,
          modelo_nome_snapshot: modeloNome,
          tipo_servico: "reforma",
          quantidade: item.quantidade_reforma,
          status: "pendente"
        });
      }

      // REMANUFATURA
      if (item.quantidade_remanufatura > 0) {
        manutItems.push({
          triagem_id: triagemId,
          coleta_id: triagemData.coleta_id,
          cliente_id: triagemData.cliente_id || "pce",
          modelo_id: item.modelo_pallet_id,
          modelo_nome_snapshot: modeloNome,
          tipo_servico: "remanufatura",
          quantidade: item.quantidade_remanufatura,
          status: "pendente"
        });
      }
    }

    if (manutItems.length === 0) return { success: true, message: "Nenhum item para manutenção encontrado." };

    // 4. Inserir evitando duplicidade (verificar se já existem manutenções para este triagem_id + modelo_id + tipo_servico)
    for (const mItem of manutItems) {
      const { data: exist } = await supabase
        .from("manutencoes")
        .select("id")
        .eq("triagem_id", triagemId)
        .eq("modelo_id", mItem.modelo_id)
        .eq("tipo_servico", mItem.tipo_servico)
        .limit(1);

      if (!exist || exist.length === 0) {
        await supabase.from("manutencoes").insert(mItem);
      }
    }

    revalidatePath("/admin/manutencao");
    return { success: true };
  } catch (err: any) {
    console.error("[gerarManutencoesDaTriagem] Erro:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Sincroniza manutenções pendentes de triagens concluídas.
 * Útil para triagens finalizadas antes da implementação do fluxo.
 */
export async function sincronizarManutencoesPendentes() {
  try {
    const supabase = createAdminClient();

    // 1. Buscar todas as triagens concluídas
    const { data: triagens, error: triError } = await supabase
      .from("triagens")
      .select("id")
      .eq("status", "concluida");

    if (triError) throw triError;

    let totalCriados = 0;
    for (const tri of (triagens || [])) {
      const res = await gerarManutencoesDaTriagem(tri.id);
      if (res.success) totalCriados++;
    }

    revalidatePath("/admin/manutencao");
    return { success: true, count: totalCriados };
  } catch (err: any) {
    console.error("[sincronizarManutencoesPendentes] Erro:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Inicia o processo de manutenção para um item.
 */
export async function iniciarManutencao(id: string) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("manutencoes")
      .update({ status: "em_andamento", data_inicio: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    revalidatePath("/admin/manutencao");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Conclui a manutenção e envia para o estoque.
 */
export async function concluirManutencao(id: string) {
  try {
    const supabase = createAdminClient();

    const { data: itemData, error: fetchError } = await supabase
      .from("manutencoes")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !itemData) throw new Error("Item não encontrado.");
    if (itemData.status === "concluida") throw new Error("Já concluído.");

    // Atualizar manutenção
    const { error: updateError } = await supabase
      .from("manutencoes")
      .update({ status: "concluida", data_conclusao: new Date().toISOString() })
      .eq("id", id);
    if (updateError) throw updateError;

    // Atualizar Estoque Acumulado (PCE)
    const clienteId = itemData.cliente_id || "pce";
    const { data: estoque, error: estError } = await supabase
      .from("estoque_pallets")
      .select("id, quantidade")
      .eq("cliente_id", clienteId)
      .eq("modelo_id", itemData.modelo_id)
      .limit(1);

    if (estError) throw estError;

    if (estoque && estoque.length > 0) {
      await supabase
        .from("estoque_pallets")
        .update({ 
          quantidade: (estoque[0].quantidade || 0) + itemData.quantidade,
          updated_at: new Date().toISOString()
        })
        .eq("id", estoque[0].id);
    } else {
      await supabase.from("estoque_pallets").insert({
        cliente_id: clienteId,
        modelo_id: itemData.modelo_id,
        modelo_nome_snapshot: itemData.modelo_nome_snapshot,
        quantidade: itemData.quantidade,
      });
    }

    revalidatePath("/admin/manutencao");
    revalidatePath("/admin/estoque");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
