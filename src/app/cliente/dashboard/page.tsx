"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Package, Recycle, DollarSign, TrendingUp, Wind, Trees, 
  Zap, AlertCircle, ShieldCheck, Activity, BarChart3, Clock, 
  Truck, RotateCw, Hammer, Trash2, Banknote, Scale, Leaf, Globe
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { registrarAcesso } from "@/lib/utils/monitoramento";
import { LoadingPage } from "@/components/ui/loading-screen";
import { fetchDashboardKPIs, DashboardKPIs } from "@/lib/kpis";
import { KpiCard } from "@/components/dashboard/KpiCard";

const SimpleKpiRow = ({ label, value, isWarning = false, isSuccess = false }: { label: string, value: string | number, isWarning?: boolean, isSuccess?: boolean }) => (
  <div className="flex justify-between items-center py-3.5 border-b border-neutral-100 last:border-0">
    <span className="text-sm text-neutral-500 font-medium">{label}</span>
    <span className={`text-sm font-semibold ${isWarning ? 'text-amber-600' : isSuccess ? 'text-emerald-600' : 'text-neutral-900'}`}>
      {value}
    </span>
  </div>
);

const SectionTitle = ({ title, icon: Icon }: { title: string, icon?: any }) => (
  <div className="flex items-center gap-2 mb-6">
    {Icon && <Icon size={18} className="text-neutral-400" />}
    <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
  </div>
);

export default function ClienteDashboardPCE() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    setMounted(true);
    fetchData();
    registrarAcesso("cliente/dashboard");
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const kpiData = await fetchDashboardKPIs("pce", supabase);
      if (kpiData) setKpis(kpiData);
    } catch (err: any) {
      console.error("Dashboard Error:", err);
      setError("Não foi possível carregar os dados. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number | undefined | null) => 
    (val ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  
  const formatPercent = (val: number | undefined | null) => 
    `${(val ?? 0).toFixed(1)}%`;
  
  const formatNumber = (val: number | undefined | null) => 
    (val ?? 0).toLocaleString("pt-BR");

  const formatKgToTon = (val: number | undefined | null) => {
    const kg = val ?? 0;
    return (kg / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  };

  // --- LÓGICA DE INSIGHTS ---
  const insight = useMemo(() => {
    if (!kpis) return null;
    const { eficiencia, financeiro } = kpis;
    
    if ((eficiencia?.taxa_reaproveitamento || 0) > 85) {
      return {
        type: "success",
        title: "Excelência em Circularidade",
        message: "A operação mantém um índice excepcional de reaproveitamento, demonstrando maturidade na gestão de logística reversa e alto impacto ESG.",
        icon: ShieldCheck,
        colorClass: "text-emerald-600 bg-emerald-50 border-emerald-100"
      };
    }
    if ((eficiencia?.taxa_sucata || 0) > 15) {
      return {
        type: "warning",
        title: "Oportunidade de Melhoria",
        message: "O volume de sucata está acima do ideal. Uma revisão nos processos de manuseio interno na planta pode reduzir perdas e otimizar custos.",
        icon: AlertCircle,
        colorClass: "text-amber-600 bg-amber-50 border-amber-100"
      };
    }
    if ((financeiro?.roi_operacao || 0) > 150) {
      return {
        type: "info",
        title: "Alto Retorno Operacional",
        message: "A recuperação de ativos está gerando um ROI altamente positivo. O orçamento logístico está sendo preservado com eficiência.",
        icon: TrendingUp,
        colorClass: "text-brand-cyan bg-brand-cyan/10 border-brand-cyan/20"
      };
    }
    return {
      type: "neutral",
      title: "Operação Estabilizada",
      message: "O fluxo de triagem e manutenção segue com índices estáveis. O monitoramento contínuo garante a previsibilidade do estoque.",
      icon: Activity,
      colorClass: "text-neutral-600 bg-white border-neutral-200"
    };
  }, [kpis]);

  if (!mounted) return <div className="min-h-screen bg-neutral-50" />;
  if (loading) return <LoadingPage />;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-6 text-center">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm">
          <AlertCircle size={40} className="text-rose-500 mx-auto mb-4" strokeWidth={1.5} />
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">Falha no Carregamento</h2>
          <p className="text-sm text-neutral-500 mb-6">{error}</p>
          <button onClick={() => fetchData()} className="w-full py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors">
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const mesAno = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const totalRecuperado = (kpis?.operacao?.total_processado ?? 0) - ((kpis?.operacao?.total_processado ?? 0) * ((kpis?.eficiencia?.taxa_sucata ?? 0) / 100));

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-neutral-900 font-sans selection:bg-neutral-200 selection:text-neutral-900 pb-20">
      
      {/* 1. HEADER MINIMALISTA */}
      <header className="bg-white border-b border-neutral-200/80 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">Operação Ativa</span>
                <span className="text-neutral-300 text-xs">•</span>
                <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">{mesAno}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900 tracking-tight">Painel Executivo PCE</h1>
              <p className="text-sm text-neutral-500 mt-1">Economia, eficiência e sustentabilidade da operação de pallets.</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-10 space-y-10">
        
        {/* 2. HERO PRINCIPAL */}
        <section className="bg-white border border-neutral-200/80 rounded-2xl p-8 md:p-10 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none">
             <DollarSign size={200} />
          </div>
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs font-semibold mb-6 border border-emerald-100">
               <TrendingUp size={14} /> Retorno Operacional
            </div>
            <h2 className="text-5xl md:text-6xl font-semibold text-neutral-900 tracking-tighter mb-4">
              {formatCurrency(kpis?.financeiro?.economia_total)}
            </h2>
            <p className="text-base text-neutral-500 font-medium leading-relaxed max-w-md">
              Valor estimado preservado pela recuperação e reaproveitamento de pallets.
            </p>
          </div>
        </section>

        {/* 3. LINHA DE 4 KPIs PRINCIPAIS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <KpiCard 
            titulo="Pallets Processados" 
            valor={formatNumber(kpis?.operacao?.total_processado)} 
            icone={Package} 
            cor="neutral" 
          />
          <KpiCard 
            titulo="Eficiência Reaprov." 
            valor={formatPercent(kpis?.eficiencia?.taxa_reaproveitamento)} 
            icone={Recycle} 
            cor="brand" 
          />
          <KpiCard 
            titulo="CO₂ Evitado" 
            valor={`${formatKgToTon(kpis?.esg?.co2_evitado)} t`} 
            icone={Wind} 
            cor="success" 
          />
          <KpiCard 
            titulo="Madeira Poupada" 
            valor={`${formatKgToTon(kpis?.esg?.madeira_reutilizada)} t`} 
            icone={Trees} 
            cor="success" 
          />
        </section>

        {/* 4. LEITURA EXECUTIVA */}
        <section className="bg-neutral-900 text-white rounded-2xl p-8 md:p-12 shadow-lg">
          <div className="flex items-center gap-2 mb-8">
            <Zap size={18} className="text-neutral-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Leitura Executiva</span>
          </div>
          <div className="space-y-6 max-w-4xl">
            <p className="text-xl md:text-2xl font-medium leading-tight text-neutral-300">
              A operação recuperou <span className="text-white font-semibold">{formatNumber(totalRecuperado)}</span> pallets e reduziu a necessidade de compra de novos ativos.
            </p>
            <p className="text-xl md:text-2xl font-medium leading-tight text-neutral-300">
              A eficiência de reaproveitamento atingiu <span className="text-white font-semibold">{formatPercent(kpis?.eficiencia?.taxa_reaproveitamento)}</span>, fortalecendo a circularidade da operação.
            </p>
            <p className="text-xl md:text-2xl font-medium leading-tight text-neutral-300">
              Foram evitados aproximadamente <span className="text-emerald-400 font-semibold">{formatKgToTon(kpis?.esg?.co2_evitado)} toneladas</span> de CO₂ no período.
            </p>
          </div>
        </section>

        {/* 5. BLOCOS SECUNDÁRIOS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          
          {/* Operação */}
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-sm">
            <SectionTitle title="Operação & Fluxo" icon={Truck} />
            <div className="flex flex-col">
              <SimpleKpiRow label="Volume Coletado" value={formatNumber(kpis?.operacao?.total_coletado)} />
              <SimpleKpiRow label="Volume Entregue" value={formatNumber(kpis?.operacao?.total_entregue)} />
              <SimpleKpiRow label="Saldo em Estoque" value={formatNumber(kpis?.operacao?.total_estoque)} />
              <SimpleKpiRow label="Tempo Médio Ciclo" value={kpis?.operacao?.tempo_medio_ciclo || "---"} />
              <SimpleKpiRow label="Taxa de Reforma" value={formatPercent(kpis?.eficiencia?.taxa_reforma)} />
              <SimpleKpiRow label="Taxa de Sucata" value={formatPercent(kpis?.eficiencia?.taxa_sucata)} isWarning={(kpis?.eficiencia?.taxa_sucata ?? 0) > 15} />
            </div>
          </div>

          {/* Financeiro */}
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-sm">
            <SectionTitle title="Métricas Financeiras" icon={Banknote} />
            <div className="flex flex-col">
              <SimpleKpiRow label="Custo Evitado Novo" value={formatCurrency(kpis?.financeiro?.custo_evitar_novo)} isSuccess />
              <SimpleKpiRow label="Investimento Reparo" value={formatCurrency(kpis?.financeiro?.valor_recuperado)} />
              <SimpleKpiRow label="Economia por Pallet" value={formatCurrency(kpis?.financeiro?.economia_por_pallet)} />
              <SimpleKpiRow label="Custo Médio Pallet" value={formatCurrency(kpis?.financeiro?.custo_medio_pallet)} />
              <SimpleKpiRow label="ROI da Operação" value={formatPercent(kpis?.financeiro?.roi_operacao)} />
              <SimpleKpiRow label="Índice Crescimento" value={formatPercent(kpis?.performance?.crescimento_mensal)} />
            </div>
          </div>

          {/* ESG */}
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-sm">
            <SectionTitle title="Sustentabilidade" icon={Leaf} />
            <div className="flex flex-col">
              <SimpleKpiRow label="Árvores Preservadas" value={formatNumber(kpis?.esg?.arvores_preservadas)} isSuccess />
              <SimpleKpiRow label="Madeira Reutilizada" value={`${formatKgToTon(kpis?.esg?.madeira_reutilizada)} t`} />
              <SimpleKpiRow label="CO₂ Evitado" value={`${formatKgToTon(kpis?.esg?.co2_evitado)} t`} />
              <SimpleKpiRow label="Resíduos Desviados" value={`${formatKgToTon(kpis?.esg?.residuos_evitar)} t`} />
              <SimpleKpiRow label="Score Operacional" value={(kpis?.performance?.indice_performance ?? 0).toFixed(1)} />
              <SimpleKpiRow label="Rating Circular" value="AAA" />
            </div>
          </div>

        </section>

        {/* 6. RESUMO IVANI */}
        {insight && (
          <section className={`rounded-2xl border p-6 md:p-8 flex items-start gap-5 ${insight.colorClass}`}>
            <div className="bg-white p-3 rounded-xl shadow-sm border border-neutral-100/50 shrink-0">
               <insight.icon size={24} strokeWidth={2} />
            </div>
            <div>
               <h3 className="text-base font-semibold mb-1.5">{insight.title}</h3>
               <p className="text-sm font-medium leading-relaxed opacity-90">{insight.message}</p>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
