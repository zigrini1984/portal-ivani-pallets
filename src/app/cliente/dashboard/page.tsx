import React from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchDashboardKPIs, DashboardKPIs } from "@/lib/kpis";
import { ClientNav } from "@/components/dashboard/client-nav";
import { BicPenBanner } from "@/components/ui/editorial";
import ClientDashboard from "./client";

export const dynamic = "force-dynamic";

async function safeQuery(label: string, queryPromise: any) {
  try {
    const { data, error } = await queryPromise;
    if (error) {
      console.error(`[ClienteDashboard] ${label}:`, {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return [];
    }
    return JSON.parse(JSON.stringify(data || []));
  } catch (error) {
    console.error(`[ClienteDashboard] ${label} exception:`, error);
    return [];
  }
}

export default async function ClienteDashboardPCE() {
  const clienteId = "pce";
  let supabase: any = null;
  
  try {
    supabase = createAdminClient();
  } catch (err) {
    console.error("[Dashboard] Failed to create admin client:", err);
  }

  let kpis: DashboardKPIs = {
    operacao: { total_coletado: 0, total_processado: 0, total_estoque: 0, total_entregue: 0, volume_mensal: 0, numero_coletas: 0, tempo_medio_ciclo: "---", cargas_processadas: 0 },
    eficiencia: { taxa_reaproveitamento: 0, taxa_sucata: 0, taxa_reforma: 0, taxa_remanufatura: 0, eficiencia_recuperacao: 0, perda_operacional: 0 },
    financeiro: { economia_total: 0, custo_evitar_novo: 0, valor_recuperado: 0, custo_medio_pallet: 0, economia_por_pallet: 0, roi_operacao: 0, patrimonio_estoque: 0, poupanca_projetada: 0 },
    esg: { arvores_preservadas: 0, co2_evitado: 0, madeira_reutilizada: 0, residuos_evitar: 0, agua_economizada: 0, circularidade_indice: 0 },
    performance: { crescimento_mensal: 0, tendencia_volume: "stable" as const, indice_performance: 0 }
  };
  
  let timeline: any[] = [];
  let error = null;

  if (supabase) {
    try {
      const kpisData = await fetchDashboardKPIs(clienteId, supabase);
      kpis = JSON.parse(JSON.stringify(kpisData));
      
      // Timeline recente segura
      const rawTimeline = await safeQuery("timeline", 
        supabase
          .from("estoque_movimentacoes")
          .select("id, tipo, quantidade, created_at")
          .eq("cliente_id", clienteId)
          .order("created_at", { ascending: false })
          .limit(30)
      );
      
      // Formata a timeline para o Recharts (agrupa por mês)
      if (rawTimeline && rawTimeline.length > 0) {
        const grouped = rawTimeline.reduce((acc: any, curr: any) => {
          const date = new Date(curr.created_at);
          const month = date.toLocaleDateString("pt-BR", { month: "short" });
          if (!acc[month]) acc[month] = { name: month, volume: 0, expedido: 0 };
          
          if (curr.tipo === 'entrada') acc[month].volume += curr.quantidade;
          if (curr.tipo === 'saida') acc[month].expedido += curr.quantidade;
          return acc;
        }, {});
        
        timeline = Object.values(grouped).reverse();
      }
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
      error = "Falha ao processar visão estratégica.";
    }
  } else {
    error = "Serviço de dados temporariamente indisponível.";
  }

  // Gera a string do mês atual no server para evitar hydration mismatch
  const mesAtual = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-neutral-900 pb-20">
      <div className="max-w-[1600px] mx-auto px-6 pt-10">
        <div className="flex justify-between items-center mb-8">
          <div className="flex flex-col">
            <h1 className="text-3xl font-black tracking-tight text-neutral-900">Visão Geral PCE</h1>
            <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Painel de Controle de Ativos</p>
          </div>
          <ClientNav />
        </div>

        <BicPenBanner 
          title="Inteligência Logística"
          subtitle="Acompanhamento em tempo real da sua operação de pallets e impacto ambiental."
          image="/branding/banner-dashboard.png"
        />

        {error && (
          <div className="mt-8 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3 text-amber-800 text-sm font-medium">
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            {error}
          </div>
        )}

        <ClientDashboard initialKPIs={kpis} initialTimeline={timeline} mesAtual={mesAtual} />
      </div>
    </div>
  );
}
