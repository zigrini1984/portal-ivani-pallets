"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

// ─── REPROCESSAR ESTOQUE ─────────────────────────────────────────────────────
// Reconstrói o saldo de estoque_pallets somando manutenções concluídas,
// depois subtrai as saídas manuais registradas em estoque_movimentacoes.

export async function reprocessarEstoque() {
  try {
    const supabase = createAdminClient();
    const clienteId = "pce";

    // 1. Buscar manutenções concluídas
    const { data: manutData, error: manutError } = await supabase
      .from("manutencoes")
      .select(
        "id, cliente_id, modelo_id, modelo_pallet_id, modelo_nome_snapshot, tipo_servico, quantidade, quantidade_entrada, quantidade_concluida, status"
      )
      .eq("cliente_id", clienteId)
      .eq("status", "concluida");

    if (manutError) throw manutError;

    // 2. Agrupar saldos por chave de modelo (modelo_pallet_id)
    const saldos: Record<
      string,
      {
        modelo_id: string | null;
        modelo_pallet_id: string | null;
        modelo_nome_snapshot: string;
        total: number;
      }
    > = {};

    for (const m of manutData ?? []) {
      const qty = Number(m.quantidade_concluida || m.quantidade || m.quantidade_entrada || 0);
      if (qty <= 0) continue;
      if (!["reforma", "remanufatura"].includes(m.tipo_servico ?? "")) continue;

      // Chave de agrupamento: usar obrigatoriamente modelo_pallet_id
      const key = m.modelo_pallet_id ?? "sem_modelo";

      if (!saldos[key]) {
        saldos[key] = {
          modelo_id: m.modelo_id ?? m.modelo_pallet_id ?? null,
          modelo_pallet_id: m.modelo_pallet_id ?? null,
          modelo_nome_snapshot: m.modelo_nome_snapshot ?? "Modelo não informado",
          total: 0,
        };
      }
      saldos[key].total += qty;
    }

    // 3. Abater saídas manuais registradas em estoque_movimentacoes
    const { data: movSaidas } = await supabase
      .from("estoque_movimentacoes")
      .select("modelo_pallet_id, quantidade")
      .eq("cliente_id", clienteId)
      .eq("tipo", "saida");

    for (const s of movSaidas ?? []) {
      const key = s.modelo_pallet_id;
      if (key && saldos[key]) {
        saldos[key].total = Math.max(0, saldos[key].total - Number(s.quantidade || 0));
      }
    }

    // 4. Persistir em estoque_pallets
    let modelosAtualizados = 0;
    let quantidadeTotal = 0;

    for (const key in saldos) {
      const s = saldos[key];
      if (s.total < 0) continue;

      // Verificar se já existe registro deste modelo para este cliente
      const { data: existing } = await supabase
        .from("estoque_pallets")
        .select("id, quantidade, quantidade_disponivel")
        .eq("cliente_id", clienteId)
        .eq("modelo_pallet_id", s.modelo_pallet_id)
        .limit(1);

      const payload = {
        cliente_id: clienteId,
        modelo_id: s.modelo_id,
        modelo_pallet_id: s.modelo_pallet_id,
        modelo_nome_snapshot: s.modelo_nome_snapshot,
        quantidade: s.total,
        quantidade_disponivel: s.total,
        updated_at: new Date().toISOString(),
      };

      if (existing && existing.length > 0) {
        await supabase
          .from("estoque_pallets")
          .update(payload)
          .eq("id", existing[0].id);
      } else {
        await supabase.from("estoque_pallets").insert([payload]);
      }

      modelosAtualizados++;
      quantidadeTotal += s.total;
    }

    revalidatePath("/admin/estoque");

    return {
      success: true,
      message: "Estoque reprocessado com sucesso!",
      modelosAtualizados,
      quantidadeTotal,
      itensProcessados: (manutData ?? []).length,
    };
  } catch (err: any) {
    console.error("[reprocessarEstoque] Erro:", err);
    return {
      success: false,
      error: String(err.message ?? err),
    };
  }
}

// ─── REGISTRAR SAÍDA ─────────────────────────────────────────────────────────

export async function registrarSaidaEstoque(input: {
  estoqueId: string;
  quantidadeSaida: number;
  observacao?: string;
}) {
  try {
    const supabase = createAdminClient();
    const { estoqueId, quantidadeSaida, observacao } = input;

    if (!estoqueId || quantidadeSaida <= 0) {
      return { success: false, error: "Dados inválidos para saída." };
    }

    // 1. Buscar saldo atual (explicitamente)
    const { data: estData, error: estError } = await supabase
      .from("estoque_pallets")
      .select("id, cliente_id, modelo_pallet_id, quantidade, quantidade_disponivel")
      .eq("id", estoqueId)
      .limit(1);

    if (estError) throw estError;
    const item = estData?.[0];
    if (!item) return { success: false, error: "Item de estoque não encontrado." };

    const saldoDisponivel = Number(item.quantidade_disponivel || item.quantidade || 0);
    if (quantidadeSaida > saldoDisponivel) {
      return {
        success: false,
        error: `Saldo insuficiente. Disponível: ${saldoDisponivel} unidades.`,
      };
    }

    const novoSaldoDisponivel = saldoDisponivel - quantidadeSaida;
    const novoSaldoTotal = Math.max(0, Number(item.quantidade || 0) - quantidadeSaida);

    // 2. Atualizar saldo (total e disponível)
    const { error: updError } = await supabase
      .from("estoque_pallets")
      .update({
        quantidade: novoSaldoTotal,
        quantidade_disponivel: novoSaldoDisponivel,
        updated_at: new Date().toISOString(),
      })
      .eq("id", estoqueId);

    if (updError) throw updError;

    // 3. Registrar movimentação em estoque_movimentacoes
    await supabase.from("estoque_movimentacoes").insert([
      {
        cliente_id: item.cliente_id,
        modelo_pallet_id: item.modelo_pallet_id,
        origem: "estoque",
        origem_id: estoqueId,
        tipo: "saida",
        quantidade: quantidadeSaida,
        descricao: observacao || "Saída manual de estoque",
        created_at: new Date().toISOString()
      },
    ]);

    revalidatePath("/admin/estoque");

    return { success: true };
  } catch (err: any) {
    console.error("[registrarSaidaEstoque] Erro:", err);
    return { success: false, error: String(err.message ?? err) };
  }
}
