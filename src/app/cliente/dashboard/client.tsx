"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, TrendingDown, Minus, Package, Recycle, 
  Leaf, Wallet, Clock, ArrowRight, BarChart3,
  Calendar, CheckCircle2, AlertCircle, Ship,
  Droplets, Globe, Zap, TreePine, Coins, Briefcase
} from "lucide-react";
import { DashboardKPIs } from "@/lib/kpis";

const formatCurrency = (val: number) => 
  val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatNumber = (val: number) => 
  val.toLocaleString("pt-BR");

const MainKpiCard = ({ title, value, subtitle, icon: Icon, color, trend, chartData }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-8 rounded-[1.5rem] border border-neutral-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] relative overflow-hidden group"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} bg-opacity-10`}>
        <Icon className={color.replace("bg-", "text-")} size={24} />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-[10px] font-black ${trend > 0 ? "text-emerald-600" : "text-amber-600"} bg-neutral-50 px-2 py-1 rounded-full`}>
          {trend > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(trend).toFixed(1)}%
        </div>
      )}
    </div>
    <div className="relative z-10">
      <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1">{title}</h3>
      <p className="text-4xl font-black text-neutral-900 tracking-tighter mb-1">{value}</p>
      <p className="text-xs font-bold text-neutral-400">{subtitle}</p>
    </div>
    
    {/* Mini Sparkline Mockup */}
    <div className="mt-6 h-12 flex items-end gap-1 opacity-20 group-hover:opacity-40 transition-opacity">
      {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
        <div key={i} className={`flex-1 ${color} rounded-t-sm`} style={{ height: `${h}%` }} />
      ))}
    </div>
  </motion.div>
);

const MiniKpi = ({ title, value, icon: Icon, colorClass }: any) => (
  <div className="bg-white px-5 py-4 rounded-2xl border border-neutral-100 flex items-center gap-4 hover:border-neutral-200 transition-all">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass} bg-opacity-10 shrink-0`}>
      <Icon className={colorClass.replace("bg-", "text-")} size={18} />
    </div>
    <div>
      <h4 className="text-[9px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-1">{title}</h4>
      <p className="text-sm font-black text-neutral-900">{value}</p>
    </div>
  </div>
);

const ProgressBar = ({ label, value, target, color }: any) => {
  const percentage = Math.min((value / target) * 100, 100);
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{label}</span>
        <span className="text-[10px] font-black text-neutral-900">{percentage.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className={`h-full ${color}`}
        />
      </div>
      <div className="flex justify-between text-[8px] font-bold text-neutral-300 uppercase">
        <span>0</span>
        <span>Meta: {target}</span>
      </div>
    </div>
  );
};

export default function ClientDashboard({ initialKPIs, initialTimeline }: { initialKPIs: DashboardKPIs, initialTimeline: any[] }) {
  return (
    <div className="mt-8 space-y-12">
      {/* Header Info Bar */}
      <div className="bg-[#133020] text-white/70 p-4 rounded-2xl flex flex-wrap gap-8 items-center text-[10px] font-black uppercase tracking-[0.2em] border border-white/5 shadow-2xl">
        <div className="flex items-center gap-2">
          <span className="text-white/40">Status do Sistema:</span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Operacional
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/40">Meta Mensal:</span>
          <span className="text-white">R$ 100k economia</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/40">Ciclo Atual:</span>
          <span className="text-white">{new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Row 1: Primary Strategic KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MainKpiCard 
          title="Economia Total Acumulada"
          value={formatCurrency(initialKPIs.financeiro.economia_total)}
          subtitle="Capital poupado vs compra de novos"
          icon={Coins}
          color="bg-emerald-500"
          trend={18.1}
        />
        <MainKpiCard 
          title="Eficiência de Triage"
          value={`${initialKPIs.eficiencia.taxa_reaproveitamento}%`}
          subtitle="Índice de ativos recuperados"
          icon={Recycle}
          color="bg-blue-500"
          trend={7.5}
        />
        <MainKpiCard 
          title="Impacto Ambiental (ESG)"
          value={`${(initialKPIs.esg.co2_evitado / 1000).toFixed(1)}t`}
          subtitle="Redução de emissões CO₂"
          icon={Globe}
          color="bg-[#327039]"
          trend={12.4}
        />
        <MainKpiCard 
          title="Giro de Ativos"
          value={formatNumber(initialKPIs.operacao.total_processado)}
          subtitle="Unidades processadas no ciclo"
          icon={Zap}
          color="bg-amber-500"
          trend={-2.1}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Section: Analysis against targets */}
        <div className="lg:col-span-8 bg-white rounded-[2rem] border border-neutral-100 p-10 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-2xl font-black text-neutral-900 tracking-tight">Performance e Metas</h2>
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1">Comparativo operacional vs objetivos estratégicos</p>
            </div>
            <BarChart3 className="text-neutral-200" size={32} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <ProgressBar label="Reaproveitamento de Madeira" value={initialKPIs.eficiencia.taxa_reaproveitamento} target={95} color="bg-blue-500" />
            <ProgressBar label="ROI Operacional" value={initialKPIs.financeiro.roi_operacao} target={250} color="bg-emerald-500" />
            <ProgressBar label="Preservação Florestal" value={initialKPIs.esg.arvores_preservadas} target={500} color="bg-[#327039]" />
            <ProgressBar label="Circularidade de Ativos" value={initialKPIs.esg.circularidade_indice} target={100} color="bg-amber-500" />
          </div>

          <div className="mt-12 pt-10 border-t border-neutral-50 grid grid-cols-2 md:grid-cols-4 gap-4">
            <MiniKpi title="Economia/Pallet" value={formatCurrency(initialKPIs.financeiro.economia_por_pallet)} icon={Wallet} colorClass="bg-emerald-500" />
            <MiniKpi title="Cargas Processadas" value={initialKPIs.operacao.cargas_processadas} icon={Package} colorClass="bg-blue-500" />
            <MiniKpi title="Ciclo Médio" value={initialKPIs.operacao.tempo_medio_ciclo} icon={Clock} colorClass="bg-amber-500" />
            <MiniKpi title="Patrimônio" value={formatCurrency(initialKPIs.financeiro.patrimonio_estoque)} icon={Briefcase} colorClass="bg-neutral-900" />
          </div>
        </div>

        {/* Right Section: Nature & Savings Focus */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#133020] rounded-[2rem] p-8 text-white relative overflow-hidden">
            <TreePine className="absolute -bottom-8 -right-8 text-white/5 w-48 h-48" />
            <div className="relative z-10">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-emerald-400 mb-6">Benefícios da Natureza</h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <TreePine className="text-emerald-400" size={24} />
                  </div>
                  <div>
                    <p className="text-2xl font-black">{Math.round(initialKPIs.esg.arvores_preservadas)}</p>
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Árvores Preservadas</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Droplets className="text-blue-400" size={24} />
                  </div>
                  <div>
                    <p className="text-2xl font-black">{formatNumber(Math.round(initialKPIs.esg.agua_economizada))}L</p>
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Água Economizada</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Recycle className="text-amber-400" size={24} />
                  </div>
                  <div>
                    <p className="text-2xl font-black">{formatNumber(Math.round(initialKPIs.esg.residuos_evitar))}kg</p>
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Resíduos Desviados</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 rounded-[2rem] p-8 border border-emerald-100">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-emerald-900 mb-4">Vantagem Financeira</h3>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-emerald-700/60 uppercase tracking-wider">Poupança Total Projetada</p>
              <p className="text-3xl font-black text-emerald-900">{formatCurrency(initialKPIs.financeiro.poupanca_projetada)}</p>
            </div>
            <div className="mt-6 pt-6 border-t border-emerald-200/50">
              <div className="flex justify-between items-center text-[10px] font-black text-emerald-800 uppercase tracking-widest">
                <span>Custo Evitado (Novos)</span>
                <span>{formatCurrency(initialKPIs.financeiro.custo_evitar_novo)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Remaining KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MiniKpi title="Estoque Disponível" value={formatNumber(initialKPIs.operacao.total_estoque)} icon={Package} colorClass="bg-blue-500" />
        <MiniKpi title="Volume Mensal" value={formatNumber(initialKPIs.operacao.volume_mensal)} icon={Calendar} colorClass="bg-neutral-900" />
        <MiniKpi title="Perda Operacional" value={`${initialKPIs.eficiencia.perda_operacional}%`} icon={AlertCircle} colorClass="bg-amber-500" />
        <MiniKpi title="Recuperação" value={`${initialKPIs.eficiencia.eficiencia_recuperacao}%`} icon={CheckCircle2} colorClass="bg-emerald-500" />
        <MiniKpi title="Madeira (m³)" value={initialKPIs.esg.madeira_reutilizada.toFixed(2)} icon={Recycle} colorClass="bg-[#327039]" />
        <MiniKpi title="Investimento" value={formatCurrency(initialKPIs.financeiro.custo_medio_pallet)} icon={Coins} colorClass="bg-neutral-900" />
      </div>
    </div>
  );
}
