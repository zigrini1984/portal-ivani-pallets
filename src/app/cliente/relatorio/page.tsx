"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useMemo } from "react";
import { 
  FileText, 
  Download, 
  Printer,
  Calendar, 
  TrendingUp, 
  Leaf, 
  Recycle, 
  Wind, 
  Trees, 
  Wallet, 
  ArrowLeft,
  AlertCircle,
  Package,
  Target,
  Award,
  Zap,
  Truck,
  Clock,
  ShieldCheck,
  Activity,
  Box,
  MapPin,
  Scale,
  Info
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LoadingPage } from "@/components/ui/loading-screen";
import { registrarAcesso } from "@/lib/utils/monitoramento";
import { fetchDashboardKPIs, DashboardKPIs } from "@/lib/kpis";
import { ClientNav } from "@/components/dashboard/client-nav";

const PrintSectionTitle = ({ title, icon: Icon }: { title: string, icon: any }) => (
  <div className="flex items-center gap-3 mb-6 border-b border-neutral-100 pb-2 print:border-neutral-300">
    <Icon size={20} className="text-neutral-500 print:text-neutral-900" />
    <h3 className="text-xl font-bold text-neutral-800 print:text-neutral-900 tracking-tight">{title}</h3>
  </div>
);

const PrintStatRow = ({ label, value, icon: Icon, colorClass = "text-neutral-900" }: { label: string, value: string | number, icon?: any, colorClass?: string }) => (
  <div className="flex justify-between items-center py-3 border-b border-neutral-50 last:border-0 print:border-neutral-100">
    <div className="flex items-center gap-2.5">
      {Icon && <Icon size={14} className="text-neutral-400 print:text-neutral-600" />}
      <span className="text-sm text-neutral-500 print:text-neutral-700 font-medium">{label}</span>
    </div>
    <span className={`text-base font-bold tracking-tight ${colorClass} print:text-neutral-900`}>{value}</span>
  </div>
);

export default function RelatorioExecutivoPCE() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDashboardKPIs("pce", supabase);
      if (data) setKpis(data);
    } catch (err: any) {
      console.error("Relatório: Erro no carregamento:", err);
      setError("Falha ao consolidar relatório estratégico.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchData();
    registrarAcesso("cliente/relatorio");
  }, []);

  const handlePrint = () => {
    window.print();
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

  if (!mounted) return <div className="min-h-screen bg-[#FAFAFA]" />;
  if (loading) return <LoadingPage />;

  if (error || !kpis) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-6 text-center no-print">
        <div className="max-w-md w-full bg-white p-10 rounded-3xl border border-neutral-200 shadow-sm">
          <AlertCircle className="text-rose-500 mx-auto mb-6" size={48} strokeWidth={1.5} />
          <h2 className="text-2xl font-bold text-neutral-900 tracking-tight mb-3">Relatório Indisponível</h2>
          <p className="text-sm text-neutral-500 leading-relaxed mb-8">{error || "Não foi possível gerar a visão executiva no momento."}</p>
          <button onClick={() => fetchData()} className="w-full py-3.5 bg-neutral-900 text-white rounded-xl text-sm font-semibold hover:bg-neutral-800 transition-colors">
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const emissao = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const periodo = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-neutral-900 print:bg-white print:text-black">
      
      {/* 1. NAVEGAÇÃO & HEADER (OCULTO NA IMPRESSÃO) */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <div className="flex flex-col">
               <h1 className="text-lg font-bold tracking-tight">Relatório Estratégico</h1>
               <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">Visão Executiva PCE</span>
             </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-2xl text-xs font-bold hover:bg-neutral-800 transition-all shadow-lg shadow-neutral-200"
            >
              <Printer size={16} /> Imprimir Relatório
            </button>
            <ClientNav />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-12 pb-24 print:p-0 print:max-w-full">
        
        {/* ÁREA DO RELATÓRIO (FORMATO A4) */}
        <div className="bg-white rounded-[2rem] border border-neutral-200 shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-10 md:p-16 print:border-0 print:shadow-none print:p-0">
          
          {/* CABEÇALHO DO DOCUMENTO */}
          <div className="flex flex-col md:flex-row justify-between items-start border-b-2 border-neutral-900 pb-10 mb-12 print:mb-10">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-neutral-900 rounded-2xl flex items-center justify-center text-white">
                  <Package size={24} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black tracking-tighter">Ivani Pallets</span>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] -mt-1">Intelligence Suite</span>
                </div>
              </div>
              <h2 className="text-4xl font-bold tracking-tight text-neutral-900">Relatório Executivo PCE</h2>
              <div className="flex items-center gap-2 mt-4">
                <div className="px-2.5 py-0.5 bg-neutral-100 border border-neutral-200 rounded text-[10px] font-bold uppercase tracking-widest text-neutral-600">
                  Operação de pallets usados
                </div>
              </div>
            </div>
            
            <div className="mt-8 md:mt-0 text-left md:text-right space-y-1">
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Período de Referência</p>
              <p className="text-sm font-bold text-neutral-900 uppercase">{periodo}</p>
              <div className="h-4" />
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Data de Emissão</p>
              <p className="text-sm font-bold text-neutral-700">{emissao}</p>
            </div>
          </div>

          <div className="space-y-12">
            
            {/* 2. RESUMO EXECUTIVO (KPIs de destaque) */}
            <section className="break-inside-avoid">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-neutral-50 border border-neutral-100 p-6 rounded-3xl print:border-neutral-200">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Economia Total</p>
                  <p className="text-3xl font-black text-neutral-900 tracking-tighter">{formatCurrency(kpis.financeiro.economia_total)}</p>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase mt-2">Retorno Direto</p>
                </div>
                <div className="bg-neutral-50 border border-neutral-100 p-6 rounded-3xl print:border-neutral-200">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Volume Processado</p>
                  <p className="text-3xl font-black text-neutral-900 tracking-tighter">{formatNumber(kpis.operacao.total_processado)}</p>
                  <p className="text-[10px] font-bold text-neutral-500 uppercase mt-2">Unidades</p>
                </div>
                <div className="bg-neutral-50 border border-neutral-100 p-6 rounded-3xl print:border-neutral-200">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Circularidade</p>
                  <p className="text-3xl font-black text-neutral-900 tracking-tighter">{formatPercent(kpis.eficiencia.taxa_reaproveitamento)}</p>
                  <p className="text-[10px] font-bold text-brand-cyan uppercase mt-2">Taxa de Reuso</p>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              
              {/* 3. SEÇÃO OPERACIONAL */}
              <section className="break-inside-avoid">
                <PrintSectionTitle title="Indicadores Operacionais" icon={Truck} />
                <div className="flex flex-col">
                  <PrintStatRow label="Total de Cargas Coletadas" value={kpis.operacao.numero_coletas} icon={Package} />
                  <PrintStatRow label="Volume Bruto Coletado" value={formatNumber(kpis.operacao.total_coletado)} icon={Box} />
                  <PrintStatRow label="Volume Triado / Classificado" value={formatNumber(kpis.operacao.total_processado)} icon={Recycle} />
                  <PrintStatRow label="Volume Entregue (Reuso)" value={formatNumber(kpis.operacao.total_entregue)} icon={TrendingUp} />
                  <PrintStatRow label="Saldo Atual em Estoque" value={formatNumber(kpis.operacao.total_estoque)} icon={Activity} />
                  <PrintStatRow label="Tempo Médio de Ciclo" value={kpis.operacao.tempo_medio_ciclo} icon={Clock} />
                </div>
              </section>

              {/* 4. SEÇÃO FINANCEIRA OPERACIONAL */}
              <section className="break-inside-avoid">
                <PrintSectionTitle title="Performance Financeira" icon={Wallet} />
                <div className="flex flex-col">
                  <PrintStatRow label="Economia Direta Acumulada" value={formatCurrency(kpis.financeiro.economia_total)} icon={Target} colorClass="text-emerald-600" />
                  <PrintStatRow label="Custo Evitado (Material Novo)" value={formatCurrency(kpis.financeiro.custo_evitar_novo)} icon={Zap} />
                  <PrintStatRow label="Investimento em Manutenção" value={formatCurrency(kpis.financeiro.valor_recuperado)} icon={Clock} />
                  <PrintStatRow label="Economia Média por Pallet" value={formatCurrency(kpis.financeiro.economia_por_pallet)} icon={Scale} />
                  <PrintStatRow label="Custo Médio de Recuperação" value={formatCurrency(kpis.financeiro.custo_medio_pallet)} icon={TrendingUp} />
                  <PrintStatRow label="ROI Operacional Bruto" value={formatPercent(kpis.financeiro.roi_operacao)} icon={BarChart3} colorClass="text-brand-cyan" />
                </div>
              </section>

            </div>

            {/* 5. SEÇÃO ESG */}
            <section className="break-inside-avoid">
              <PrintSectionTitle title="Impacto Ambiental (ESG)" icon={Leaf} />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-5 border border-neutral-100 rounded-2xl print:border-neutral-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Wind size={16} className="text-blue-500" />
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">CO₂ Evitado</span>
                  </div>
                  <p className="text-xl font-bold">{formatKgToTon(kpis.esg.co2_evitado)} <span className="text-xs text-neutral-400">ton</span></p>
                </div>
                <div className="p-5 border border-neutral-100 rounded-2xl print:border-neutral-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Trees size={16} className="text-emerald-500" />
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Árvores Preservadas</span>
                  </div>
                  <p className="text-xl font-bold">{formatNumber(kpis.esg.arvores_preservadas)} <span className="text-xs text-neutral-400">un</span></p>
                </div>
                <div className="p-5 border border-neutral-100 rounded-2xl print:border-neutral-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Recycle size={16} className="text-brand-cyan" />
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Madeira Reutilizada</span>
                  </div>
                  <p className="text-xl font-bold">{formatKgToTon(kpis.esg.madeira_reutilizada)} <span className="text-xs text-neutral-400">ton</span></p>
                </div>
                <div className="p-5 border border-neutral-100 rounded-2xl print:border-neutral-200">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck size={16} className="text-amber-500" />
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Resíduos Desviados</span>
                  </div>
                  <p className="text-xl font-bold">{formatKgToTon(kpis.esg.residuos_evitar)} <span className="text-xs text-neutral-400">ton</span></p>
                </div>
              </div>
            </section>

            {/* 6. OBSERVAÇÃO INSTITUCIONAL */}
            <section className="bg-neutral-50 p-8 rounded-3xl border border-neutral-100 break-inside-avoid print:bg-white print:border-neutral-300">
              <div className="flex items-center gap-3 mb-4">
                <Info size={20} className="text-neutral-400" />
                <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-widest">Notas Técnicas</h4>
              </div>
              <p className="text-sm text-neutral-600 leading-relaxed font-medium">
                Este relatório consolida os indicadores operacionais da gestão de pallets da PCE, demonstrando economia, reaproveitamento de ativos e impacto ambiental positivo através da logística reversa. Os dados são processados em tempo real pela plataforma Ivani Intelligence Suite.
              </p>
            </section>

            {/* 7. ASSINATURA & RODAPÉ */}
            <footer className="pt-12 border-t-2 border-neutral-100 mt-12 flex flex-col md:flex-row justify-between items-end gap-8 print:border-neutral-300 print:mt-10">
              <div className="space-y-1">
                <p className="text-lg font-black text-neutral-900 tracking-tight">Ivani Pallets</p>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Gestão inteligente de pallets usados</p>
                <p className="text-xs text-neutral-500 font-medium">www.ivanipallets.com.br</p>
              </div>
              <div className="text-right">
                <div className="w-48 h-px bg-neutral-900 mb-2" />
                <p className="text-[10px] font-bold text-neutral-900 uppercase tracking-[0.2em]">Selo de Autenticidade Digital</p>
                <p className="text-[9px] text-neutral-400 font-medium mt-1">ID do Relatório: {Math.random().toString(36).substring(7).toUpperCase()}</p>
              </div>
            </footer>

          </div>
        </div>
      </main>

      {/* ESTILOS DE IMPRESSÃO */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 20mm;
          }
          
          body {
            background-color: white !important;
            color: black !important;
          }

          .no-print {
            display: none !important;
          }

          main {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }

          .print-section {
            break-inside: avoid;
          }
        }
      `}</style>

    </div>
  );
}

const BarChart3 = ({ size, className }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M3 3v18h18" />
    <path d="M18 17V9" />
    <path d="M13 17V5" />
    <path d="M8 17v-3" />
  </svg>
);
