"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

/**
 * Reprocessa todo o estoque da PCE baseado em movimentações, triagens e manutenções.
 */
export async function reprocessarEstoque() {
  try {
    const supabase = createAdminClient();
    const clienteId = "pce";

    console.log("[ReprocessarEstoque] Iniciando...");

    // 1. Buscar todas as manutenções concluídas
    const { data: manutData, error: manutError } = await supabase
      .from("manutencoes")
      .select("id, modelo_pallet_id, modelo_id, modelo_nome_snapshot, quantidade, quantidade_entrada, quantidade_concluida, status")
      .eq("cliente_id", clienteId)
      .eq("status", "concluida");

    if (manutError) throw manutError;

    // 2. Buscar todas as triagens com remanufatura (entrada direta)
    const { data: triagemData, error: triagemError } = await supabase
      .from("triagem_itens")
      .select("id, modelo_pallet_id, modelo_nome_snapshot, quantidade_remanufatura, triagem:triagens(cliente_id)")
      .gt("quantidade_remanufatura", 0);

    if (triagemError) throw triagemError;

    // Filtrar triagens do cliente PCE (já que o gt() foi em itens)
    const triagemItensPCE = triagemData.filter((it: any) => it.triagem?.cliente_id === clienteId);

    // 3. Agrupar saldos por modelo
    const saldos: Record<string, {
      modelo_pallet_id?: string;
      modelo_id?: string;
      modelo_nome_snapshot: string;
      total: number;
    }> = {};

    // Processar Manutenções
    for (const m of manutData) {
      const key = m.modelo_pallet_id || m.modelo_id || m.modelo_nome_snapshot;
      if (!saldos[key]) {
        saldos[key] = {
          modelo_pallet_id: m.modelo_pallet_id,
          modelo_id: m.modelo_id,
          modelo_nome_snapshot: m.modelo_nome_snapshot || "Modelo Desconhecido",
          total: 0
        };
      }
      saldos[key].total += Number(m.quantidade_concluida || m.quantidade || m.quantidade_entrada || 0);
    }

    // Processar Triagens (Remanufatura)
    for (const it of triagemItensPCE) {
      const key = it.modelo_pallet_id || it.modelo_nome_snapshot;
      if (!saldos[key]) {
        saldos[key] = {
          modelo_pallet_id: it.modelo_pallet_id,
          modelo_nome_snapshot: it.modelo_nome_snapshot || "Modelo Desconhecido",
          total: 0
        };
      }
      saldos[key].total += Number(it.quantidade_remanufatura || 0);
    }

    // 4. Buscar saídas manuais das movimentações para abater do saldo
    const { data: movSaida, error: movError } = await supabase
      .from("estoque_movimentacoes")
      .select("modelo_pallet_id, quantidade")
      .eq("cliente_id", clienteId)
      .eq("tipo", "saida");

    if (movError) throw movError;

    for (const s of movSaida) {
      const key = s.modelo_pallet_id;
      if (key && saldos[key]) {
        saldos[key].total -= Number(s.quantidade || 0);
      }
    }

    // 5. Atualizar estoque_pallets
    let modelosAtualizados = 0;
    let totalQuantidade = 0;

    for (const key in saldos) {
      const s = saldos[key];
      if (s.total <= 0) continue;

      // Tentar encontrar registro existente
      let query = supabase.from("estoque_pallets").select("id").eq("cliente_id", clienteId);
      if (s.modelo_pallet_id) {
          query = query.eq("modelo_pallet_id", s.modelo_pallet_id);
      } else {
          query = query.eq("modelo_nome_snapshot", s.modelo_nome_snapshot);
      }

      const { data: existing } = await query.limit(1);

      const payload = {
        cliente_id: clienteId,
        modelo_pallet_id: s.modelo_pallet_id,
        modelo_id: s.modelo_id,
        modelo_nome_snapshot: s.modelo_nome_snapshot,
        quantidade: s.total,
        quantidade_disponivel: s.total, // Atualiza ambas para evitar discrepâncias
        updated_at: new Date().toISOString()
      };

      if (existing && existing.length > 0) {
        const { error: updErr } = await supabase
          .from("estoque_pallets")
          .update(payload)
          .eq("id", existing[0].id);
        if (updErr) console.error(`Erro ao atualizar modelo ${key}:`, updErr.message);
      } else {
        const { error: insErr } = await supabase
          .from("estoque_pallets")
          .insert([payload]);
        if (insErr) console.error(`Erro ao inserir modelo ${key}:`, insErr.message);
      }

      modelosAtualizados++;
      totalQuantidade += s.total;
    }

    revalidatePath("/admin/estoque");

    return {
      success: true,
      message: "Estoque reprocessado com sucesso!",
      details: {
        itensProcessados: manutData.length + triagemItensPCE.length,
        modelosAtualizados,
        totalQuantidade
      }
    };

  } catch (err: any) {
    console.error("[ReprocessarEstoque] Erro Crítico:", err);
    return {
      success: false,
      error: err.message,
      details: err
    };
  }
}
