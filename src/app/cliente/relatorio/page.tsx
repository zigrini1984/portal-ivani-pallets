import React from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchDashboardKPIs, DashboardKPIs } from "@/lib/kpis";
import ClientRelatorio from "./client";

export const dynamic = "force-dynamic";

export default async function RelatorioExecutivoPage() {
  const clienteId = "pce";
  let supabase: any = null;

  try {
    supabase = createAdminClient();
  } catch (err) {
    console.error("[Relatorio] Failed to create admin client:", err);
  }

  let kpis: DashboardKPIs = {
    operacao: { total_coletado: 0, total_processado: 0, total_estoque: 0, total_entregue: 0, volume_mensal: 0, numero_coletas: 0, tempo_medio_ciclo: "---" },
    eficiencia: { taxa_reaproveitamento: 0, taxa_sucata: 0, taxa_reforma: 0, taxa_remanufatura: 0, eficiencia_recuperacao: 0, perda_operacional: 0 },
    financeiro: { economia_total: 0, custo_evitar_novo: 0, valor_recuperado: 0, custo_medio_pallet: 0, economia_por_pallet: 0, roi_operacao: 0 },
    esg: { arvores_preservadas: 0, co2_evitado: 0, madeira_reutilizada: 0, residuos_evitar: 0 },
    performance: { crescimento_mensal: 0, tendencia_volume: "stable" as const, indice_performance: 0 }
  };

  if (supabase) {
    try {
      const kpisData = await fetchDashboardKPIs(clienteId, supabase);
      kpis = JSON.parse(JSON.stringify(kpisData));
    } catch (err) {
      console.error("Relatorio Server Error:", err);
    }
  }

  return <ClientRelatorio kpis={kpis} />;
}
