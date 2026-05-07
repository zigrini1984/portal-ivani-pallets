import React from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import ClientOperacoes from "./client";

export const dynamic = "force-dynamic";

export default async function CentralOperacoesPage() {
  const supabase = createAdminClient();
  const clienteId = "pce";

  let data: {
    coletas: any[],
    triagens: any[],
    estoque: any[],
    movimentacoes: any[],
    faturamentos: any[],
    modelos: any[]
  } = {
    coletas: [],
    triagens: [],
    estoque: [],
    movimentacoes: [],
    faturamentos: [],
    modelos: []
  };

  try {
    const [
      { data: coletas },
      { data: triagens },
      { data: estoque },
      { data: movimentacoes },
      { data: faturamentos },
      { data: modelos }
    ] = await Promise.all([
      supabase.from("coletas").select("id, cliente_id, data_coleta, quantidade_material_bruto, status, numero_lote, updated_at, created_at").eq("cliente_id", clienteId).order("data_coleta", { ascending: false }),
      supabase.from("triagens").select("id, cliente_id, coleta_id, quantidade_total, quantidade_manutencao, quantidade_remanufatura, quantidade_compra_ivani, created_at, modelo_pallet_id, modelo:modelos_pallets(nome)").eq("cliente_id", clienteId),
      supabase.from("estoque_pallets").select("id, cliente_id, quantidade_disponivel, modelo_pallet_id, modelo:modelos_pallets(nome)").eq("cliente_id", clienteId),
      supabase.from("estoque_movimentacoes").select("id, cliente_id, tipo, quantidade, created_at, modelo_pallet_id, modelo:modelos_pallets(nome)").eq("cliente_id", clienteId).order("created_at", { ascending: false }),
      supabase.from("faturamentos").select("id, cliente_id, valor_total_estimado, estoque_movimentacao_id, created_at, modelo:modelos_pallets(nome), parcelas:faturamento_parcelas(id, faturamento_id, numero_parcela, data_vencimento, status)").eq("cliente_id", clienteId),
      supabase.from("modelos_pallets").select("id, cliente_id, nome, codigo").eq("cliente_id", clienteId)
    ]);

    data = {
      coletas: coletas || [],
      triagens: triagens || [],
      estoque: estoque || [],
      movimentacoes: movimentacoes || [],
      faturamentos: faturamentos || [],
      modelos: modelos || []
    };
  } catch (err) {
    console.error("Operacoes Server Error:", err);
  }

  return <ClientOperacoes initialData={data} />;
}
