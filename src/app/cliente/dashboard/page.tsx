"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Package, Recycle, DollarSign, TrendingUp, Wind, Trees, 
  Zap, AlertCircle, ShieldCheck, Activity, BarChart3, Clock, 
  Truck, RotateCw, Hammer, Trash2, Banknote, Scale, Leaf, Globe,
  CheckCircle2, ArrowRight
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { registrarAcesso } from "@/lib/utils/monitoramento";
import { LoadingPage } from "@/components/ui/loading-screen";
import { fetchDashboardKPIs, DashboardKPIs } from "@/lib/kpis";
import { KpiCard } from "@/components/dashboard/KpiCard";

const SimpleKpiRow = ({ label, value, icon: Icon, isWarning = false, isSuccess = false }: { label: string, value: string | number, icon: any, isWarning?: boolean, isSuccess?: boolean }) => (
  <div className="group flex justify-between items-center py-4 border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50 px-2 -mx-2 rounded-xl transition-colors cursor-default">
    <div className="flex items-center gap-3">
      <div className={`p-1.5 rounded-lg border bg-white shadow-sm transition-transform group-hover:scale-105 ${isWarning ? 'border-amber-100 text-amber-500' : isSuccess ? 'border-emerald-100 text-emerald-500' : 'border-neutral-100 text-neutral-400'}`}>
        <Icon size={14} strokeWidth={2.5} />
      </div>
      <span className="text-[13px] text-neutral-500 font-medium tracking-wide">{label}</span>
    </div>
    <span className={`text-xl font-bold tracking-tight ${isWarning ? 'text-amber-600' : isSuccess ? 'text-emerald-600' : 'text-neutral-900'}`}>
      {value}
    </span>
  </div>
);

const SectionTitle = ({ title, icon: Icon }: { title: string, icon?: any }) => (
  <div className="flex items-center gap-2.5 mb-8">
    {Icon && (
      <div className="w-8 h-8 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center">
        <Icon size={16} className="text-neutral-600" />
      </div>
    )}
    <h3 className="text-lg font-semibold text-neutral-900 tracking-tight">{title}</h3>
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
        colorClass: "text-emerald-700 bg-emerald-50 border-emerald-200"
      };
    }
    if ((eficiencia?.taxa_sucata || 0) > 15) {
      return {
        type: "warning",
        title: "Oportunidade de Melhoria",
        message: "O volume de sucata está acima do ideal. Uma revisão nos processos de manuseio interno na planta pode reduzir perdas e otimizar custos.",
        icon: AlertCircle,
        colorClass: "text-amber-700 bg-amber-50 border-amber-200"
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
      colorClass: "text-neutral-700 bg-white border-neutral-200"
    };
  }, [kpis]);

  if (!mounted) return <div className="min-h-screen bg-[#FAFAFA]" />;
  if (loading) return <LoadingPage />;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-6 text-center">
        <div className="max-w-md w-full bg-white p-10 rounded-3xl border border-neutral-200 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <AlertCircle size={48} className="text-rose-500 mx-auto mb-6" strokeWidth={1.5} />
          <h2 className="text-2xl font-bold text-neutral-900 tracking-tight mb-3">Falha no Carregamento</h2>
          <p className="text-sm text-neutral-500 leading-relaxed mb-8">{error}</p>
          <button onClick={() => fetchData()} className="w-full py-3.5 bg-neutral-900 text-white rounded-xl text-sm font-semibold hover:bg-neutral-800 transition-colors">
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const mesAno = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const totalRecuperado = (kpis?.operacao?.total_processado ?? 0) - ((kpis?.operacao?.total_processado ?? 0) * ((kpis?.eficiencia?.taxa_sucata ?? 0) / 100));

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-neutral-900 font-sans selection:bg-neutral-200 selection:text-neutral-900 pb-24">
      
      {/* 1. HEADER LIMPO */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40 shadow-[0_1px_4px_rgba(0,0,0,0.01)]">
        <div className="max-w-6xl mx-auto px-6 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Operação Ativa</span>
                </div>
                <span className="text-neutral-300 text-xs">•</span>
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">{mesAno}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight">Painel Executivo PCE</h1>
              <p className="text-sm md:text-base text-neutral-500 mt-1.5 font-medium">Acompanhamento estratégico: economia, eficiência e impacto sustentável.</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-10 md:pt-12 space-y-10 md:space-y-12">
        
        {/* 2. CARD PRINCIPAL DE DESTAQUE (HERO) */}
        <section className="bg-white rounded-3xl border border-neutral-200 shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
          {/* Detalhe lateral verde discreto */}
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
                <DollarSign size={20} className="text-emerald-600" strokeWidth={2.5} />
              </div>
              <span className="text-sm font-bold text-emerald-700 uppercase tracking-widest">Economia Gerada</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-bold text-neutral-900 tracking-tighter mb-4">
              {formatCurrency(kpis?.financeiro?.economia_total)}
            </h2>
            <p className="text-base text-neutral-500 font-medium max-w-md leading-relaxed">
              Valor estimado preservado pela recuperação e reaproveitamento logístico.
            </p>
          </div>
          
          <div className="hidden lg:block opacity-5">
            <DollarSign size={240} strokeWidth={1} />
          </div>
        </section>

        {/* 3. LINHA DE 4 MINI CARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          <KpiCard 
            titulo="Pallets Processados" 
            valor={formatNumber(kpis?.operacao?.total_processado)} 
            icone={Package} 
            cor="neutral" 
          />
          <KpiCard 
            titulo="Eficiência Operacional" 
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

        {/* 4. LEITURA EXECUTIVA (CARD BRANCO COM LISTA) */}
        <section className="bg-white rounded-3xl border border-neutral-200 shadow-[0_2px_12px_rgba(0,0,0,0.01)] p-8 md:p-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-neutral-100 rounded-2xl flex items-center justify-center border border-neutral-200">
              <Zap size={18} className="text-neutral-600" strokeWidth={2.5} />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 tracking-tight">Leitura Executiva</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-neutral-400 mb-2">
                <Banknote size={16} />
                <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Economia</span>
              </div>
              <p className="text-sm font-medium text-neutral-500 leading-relaxed">
                A operação recuperou <span className="font-bold text-neutral-900">{formatNumber(totalRecuperado)}</span> pallets, reduzindo drasticamente a necessidade de compra de novos ativos na planta.
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-brand-cyan mb-2">
                <RotateCw size={16} />
                <span className="text-[11px] font-bold uppercase tracking-widest text-brand-cyan">Eficiência</span>
              </div>
              <p className="text-sm font-medium text-neutral-500 leading-relaxed">
                A eficiência de reaproveitamento atingiu sólidos <span className="font-bold text-neutral-900">{formatPercent(kpis?.eficiencia?.taxa_reaproveitamento)}</span>, fortalecendo a circularidade logística.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-500 mb-2">
                <Globe size={16} />
                <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600">ESG</span>
              </div>
              <p className="text-sm font-medium text-neutral-500 leading-relaxed">
                Foram evitados aproximadamente <span className="font-bold text-neutral-900">{formatKgToTon(kpis?.esg?.co2_evitado)} toneladas</span> de CO₂ no período através do reuso da madeira.
              </p>
            </div>
          </div>
        </section>

        {/* 5. BLOCOS SECUNDÁRIOS EM LISTA */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          
          {/* Operação */}
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-[0_2px_12px_rgba(0,0,0,0.01)] p-8">
            <SectionTitle title="Operação & Fluxo" icon={Truck} />
            <div className="flex flex-col">
              <SimpleKpiRow label="Volume Coletado" value={formatNumber(kpis?.operacao?.total_coletado)} icon={Package} />
              <SimpleKpiRow label="Volume Entregue" value={formatNumber(kpis?.operacao?.total_entregue)} icon={RotateCw} />
              <SimpleKpiRow label="Saldo em Estoque" value={formatNumber(kpis?.operacao?.total_estoque)} icon={BarChart3} />
              <SimpleKpiRow label="Tempo Médio Ciclo" value={kpis?.operacao?.tempo_medio_ciclo || "---"} icon={Clock} />
              <SimpleKpiRow label="Taxa de Reforma" value={formatPercent(kpis?.eficiencia?.taxa_reforma)} icon={Hammer} />
              <SimpleKpiRow label="Taxa de Sucata" value={formatPercent(kpis?.eficiencia?.taxa_sucata)} icon={Trash2} isWarning={(kpis?.eficiencia?.taxa_sucata ?? 0) > 15} />
            </div>
          </div>

          {/* Financeiro */}
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-[0_2px_12px_rgba(0,0,0,0.01)] p-8">
            <SectionTitle title="Métricas Financeiras" icon={Banknote} />
            <div className="flex flex-col">
              <SimpleKpiRow label="Custo Evitado Novo" value={formatCurrency(kpis?.financeiro?.custo_evitar_novo)} icon={DollarSign} isSuccess />
              <SimpleKpiRow label="Investimento Reparo" value={formatCurrency(kpis?.financeiro?.valor_recuperado)} icon={TrendingUp} />
              <SimpleKpiRow label="Economia por Pallet" value={formatCurrency(kpis?.financeiro?.economia_por_pallet)} icon={Scale} />
              <SimpleKpiRow label="Custo Médio Pallet" value={formatCurrency(kpis?.financeiro?.custo_medio_pallet)} icon={Banknote} />
              <SimpleKpiRow label="ROI da Operação" value={formatPercent(kpis?.financeiro?.roi_operacao)} icon={BarChart3} />
              <SimpleKpiRow label="Índice Crescimento" value={formatPercent(kpis?.performance?.crescimento_mensal)} icon={Activity} />
            </div>
          </div>

          {/* ESG */}
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-[0_2px_12px_rgba(0,0,0,0.01)] p-8">
            <SectionTitle title="Sustentabilidade" icon={Leaf} />
            <div className="flex flex-col">
              <SimpleKpiRow label="Árvores Preservadas" value={formatNumber(kpis?.esg?.arvores_preservadas)} icon={Trees} isSuccess />
              <SimpleKpiRow label="Madeira Reutilizada" value={`${formatKgToTon(kpis?.esg?.madeira_reutilizada)} t`} icon={Leaf} />
              <SimpleKpiRow label="CO₂ Evitado" value={`${formatKgToTon(kpis?.esg?.co2_evitado)} t`} icon={Wind} />
              <SimpleKpiRow label="Resíduos Desviados" value={`${formatKgToTon(kpis?.esg?.residuos_evitar)} t`} icon={Trash2} />
              <SimpleKpiRow label="Score Operacional" value={(kpis?.performance?.indice_performance ?? 0).toFixed(1)} icon={ShieldCheck} />
              <SimpleKpiRow label="Rating Circular" value="AAA" icon={CheckCircle2} />
            </div>
          </div>

        </section>

        {/* 6. CARD RESUMO IVANI */}
        {insight && (
          <section className={`rounded-3xl border p-8 flex flex-col md:flex-row items-start gap-6 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.02)] ${insight.colorClass}`}>
            <div className="p-4 rounded-2xl bg-white border shadow-sm shrink-0">
               <insight.icon size={28} strokeWidth={2} />
            </div>
            <div>
               <div className="flex items-center gap-3 mb-2">
                 <h3 className="text-lg font-bold tracking-tight">{insight.title}</h3>
                 <span className="px-2.5 py-0.5 rounded-full bg-white border text-[10px] font-bold uppercase tracking-widest opacity-80">
                   Resumo Ivani
                 </span>
               </div>
               <p className="text-sm font-medium leading-relaxed opacity-90">{insight.message}</p>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
