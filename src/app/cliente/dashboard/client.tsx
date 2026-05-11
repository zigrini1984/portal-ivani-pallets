"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, Package2, RefreshCcw,
  Leaf, BadgeDollarSign, Timer, Activity,
  CalendarDays, ShieldCheck, Wind, Sprout,
  Droplets, Layers, ArrowUpRight, Banknote,
  Scale, LayoutGrid, Warehouse
} from "lucide-react";
import { DashboardKPIs } from "@/lib/kpis";

const formatCurrency = (val: number) =>
  val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatNumber = (val: number) =>
  val.toLocaleString("pt-BR");

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
});

/* ─── PRIMARY KPI CARD ─── */
const HeroCard = ({ title, value, subtitle, icon: Icon, accent, trend }: any) => (
  <motion.div {...fadeUp(0.05)} className="bg-white rounded-[1.75rem] border border-neutral-100 p-7 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.07)] relative overflow-hidden group">
    {/* accent glow */}
    <div className={`absolute -top-10 -right-10 w-36 h-36 rounded-full opacity-[0.06] blur-2xl ${accent}`} />

    <div className="flex justify-between items-start mb-5">
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${accent} bg-opacity-10`}>
        <Icon className={accent.replace("bg-", "text-")} size={22} strokeWidth={1.8} />
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full ${trend >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
          {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {Math.abs(trend).toFixed(1)}%
        </div>
      )}
    </div>

    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.22em] mb-1.5">{title}</p>
    <p className="text-[2.1rem] font-black text-neutral-900 tracking-tight leading-none mb-2">{value}</p>
    <p className="text-[11px] font-semibold text-neutral-400 leading-snug">{subtitle}</p>

    {/* subtle animated bar */}
    <div className="mt-5 h-1 bg-neutral-50 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: "72%" }}
        transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
        className={`h-full ${accent} opacity-40 rounded-full`}
      />
    </div>
  </motion.div>
);

/* ─── MINI STAT ─── */
const StatChip = ({ title, value, icon: Icon, accent }: any) => (
  <motion.div {...fadeUp(0.1)} className="bg-white rounded-2xl border border-neutral-100 px-5 py-4 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent} bg-opacity-10 shrink-0`}>
      <Icon className={accent.replace("bg-", "text-")} size={18} strokeWidth={1.8} />
    </div>
    <div>
      <p className="text-[8.5px] font-black text-neutral-400 uppercase tracking-[0.18em] mb-0.5">{title}</p>
      <p className="text-[13px] font-black text-neutral-900 leading-none">{value}</p>
    </div>
  </motion.div>
);

/* ─── NATURE ROW ITEM ─── */
const NatureRow = ({ label, value, icon: Icon, color }: any) => (
  <div className="flex items-center gap-4 py-4 border-b border-white/10 last:border-0">
    <div className={`w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 ${color}`}>
      <Icon size={20} strokeWidth={1.8} />
    </div>
    <div className="flex-1">
      <p className="text-[9px] font-black text-white/50 uppercase tracking-[0.18em]">{label}</p>
      <p className="text-xl font-black text-white leading-tight">{value}</p>
    </div>
    <ArrowUpRight size={16} className="text-white/20" />
  </div>
);

export default function ClientDashboard({ initialKPIs }: { initialKPIs: DashboardKPIs, initialTimeline: any[] }) {
  const mesAtual = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="mt-8 space-y-8">

      {/* ── STATUS BAR ── */}
      <motion.div {...fadeUp(0)} className="bg-[#0f2218] rounded-2xl px-6 py-4 flex flex-wrap items-center gap-x-8 gap-y-3 border border-white/5">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Sistema Operacional</span>
        </div>
        <div className="h-3 w-px bg-white/10 hidden md:block" />
        <div className="flex items-center gap-2">
          <CalendarDays size={13} className="text-white/30" />
          <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">{mesAtual}</span>
        </div>
        <div className="h-3 w-px bg-white/10 hidden md:block" />
        <div className="flex items-center gap-2">
          <Activity size={13} className="text-white/30" />
          <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
            {formatNumber(initialKPIs.operacao.cargas_processadas)} cargas processadas
          </span>
        </div>
      </motion.div>

      {/* ── ROW 1: 4 HERO KPIS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <HeroCard
          title="Economia Total Acumulada"
          value={formatCurrency(initialKPIs.financeiro.economia_total)}
          subtitle="Capital poupado em relação à compra de pallets novos"
          icon={BadgeDollarSign}
          accent="bg-emerald-500"
          trend={18.1}
        />
        <HeroCard
          title="Pallets Recuperados"
          value={formatNumber(initialKPIs.operacao.total_processado)}
          subtitle="Ativos coletados e devolvidos à operação"
          icon={RefreshCcw}
          accent="bg-sky-500"
          trend={7.5}
        />
        <HeroCard
          title="CO₂ Não Emitido"
          value={`${(initialKPIs.esg.co2_evitado / 1000).toFixed(1)} t`}
          subtitle="Redução de emissões pelo reaproveitamento"
          icon={Wind}
          accent="bg-teal-600"
          trend={12.4}
        />
        <HeroCard
          title="ROI da Operação"
          value={`${initialKPIs.financeiro.roi_operacao.toFixed(0)}%`}
          subtitle="Retorno sobre o investimento operacional"
          icon={TrendingUp}
          accent="bg-violet-500"
        />
      </div>

      {/* ── ROW 2: MAIN PANEL + NATURE SIDEBAR ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* OPERATIONAL METRICS PANEL */}
        <motion.div {...fadeUp(0.12)} className="lg:col-span-8 bg-white rounded-[2rem] border border-neutral-100 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="px-10 pt-10 pb-6 border-b border-neutral-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-neutral-900 tracking-tight">Visão Operacional</h2>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Desempenho do ciclo completo de ativos</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-neutral-50 flex items-center justify-center">
                <LayoutGrid size={18} className="text-neutral-400" strokeWidth={1.8} />
              </div>
            </div>
          </div>

          {/* METRICS GRID */}
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y divide-neutral-50">
            {[
              { label: "Coletado", value: formatNumber(initialKPIs.operacao.total_coletado), icon: Package2, color: "text-sky-600" },
              { label: "Em Estoque", value: formatNumber(initialKPIs.operacao.total_estoque), icon: Warehouse, color: "text-indigo-600" },
              { label: "Entregue", value: formatNumber(initialKPIs.operacao.total_entregue), icon: Layers, color: "text-emerald-600" },
              { label: "Ciclo Médio", value: initialKPIs.operacao.tempo_medio_ciclo, icon: Timer, color: "text-amber-600" },
              { label: "Taxa Recuperação", value: `${initialKPIs.eficiencia.taxa_reaproveitamento}%`, icon: ShieldCheck, color: "text-teal-600" },
              { label: "Taxa Reforma", value: `${initialKPIs.eficiencia.taxa_reforma}%`, icon: RefreshCcw, color: "text-blue-600" },
              { label: "Taxa Remanufatura", value: `${initialKPIs.eficiencia.taxa_remanufatura}%`, icon: Scale, color: "text-violet-600" },
              { label: "Perda Operacional", value: `${initialKPIs.eficiencia.perda_operacional}%`, icon: Activity, color: "text-red-400" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="px-6 py-6 group hover:bg-neutral-50/70 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={14} className={`${color} opacity-80`} strokeWidth={2} />
                  <p className="text-[8.5px] font-black text-neutral-400 uppercase tracking-[0.18em]">{label}</p>
                </div>
                <p className="text-[1.35rem] font-black text-neutral-900 leading-none">{value}</p>
              </div>
            ))}
          </div>

          {/* FINANCIAL ROW */}
          <div className="px-10 py-8 bg-neutral-900 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Economia / Pallet", value: formatCurrency(initialKPIs.financeiro.economia_por_pallet), icon: Banknote },
              { label: "Custo Evitado", value: formatCurrency(initialKPIs.financeiro.custo_evitar_novo), icon: ShieldCheck },
              { label: "Valor Recuperado", value: formatCurrency(initialKPIs.financeiro.valor_recuperado), icon: BadgeDollarSign },
              { label: "Patrimônio Estoque", value: formatCurrency(initialKPIs.financeiro.patrimonio_estoque), icon: Warehouse },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Icon size={11} className="text-white/30" />
                  <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.18em]">{label}</p>
                </div>
                <p className="text-sm font-black text-white leading-none">{value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* NATURE SIDEBAR */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <motion.div {...fadeUp(0.16)} className="flex-1 bg-gradient-to-br from-[#133020] to-[#0c1f14] rounded-[2rem] p-8 text-white relative overflow-hidden">
            {/* decorative circles */}
            <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-teal-400/5 blur-2xl" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-8">
                <div className="w-8 h-8 rounded-xl bg-emerald-400/20 flex items-center justify-center">
                  <Leaf size={16} className="text-emerald-400" strokeWidth={2} />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400">Benefícios da Natureza</h3>
              </div>

              <NatureRow label="Árvores Preservadas" value={`${formatNumber(Math.round(initialKPIs.esg.arvores_preservadas))} árvores`} icon={Sprout} color="text-emerald-400" />
              <NatureRow label="Água Economizada" value={`${formatNumber(Math.round(initialKPIs.esg.agua_economizada))} litros`} icon={Droplets} color="text-sky-400" />
              <NatureRow label="Resíduos Desviados" value={`${formatNumber(Math.round(initialKPIs.esg.residuos_evitar))} kg`} icon={RefreshCcw} color="text-amber-400" />
              <NatureRow label="Madeira Reaproveitada" value={`${initialKPIs.esg.madeira_reutilizada.toFixed(2)} m³`} icon={Leaf} color="text-teal-400" />
            </div>
          </motion.div>

          {/* SAVINGS CARD */}
          <motion.div {...fadeUp(0.2)} className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2rem] p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuMDQiPjxwYXRoIGQ9Ik0wIDBoNDBINDB2NDBIMHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
            <div className="relative z-10">
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/70 mb-2">Vantagem Financeira</p>
              <p className="text-3xl font-black leading-none mb-1">{formatCurrency(initialKPIs.financeiro.poupanca_projetada)}</p>
              <p className="text-[11px] font-semibold text-white/70">poupança projetada no ciclo</p>
              <div className="mt-5 pt-5 border-t border-white/20 flex justify-between items-center">
                <div>
                  <p className="text-[8.5px] font-black text-white/50 uppercase tracking-wider">Custo Médio / Pallet</p>
                  <p className="text-base font-black">{formatCurrency(initialKPIs.financeiro.custo_medio_pallet)}</p>
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                  <BadgeDollarSign size={20} className="text-white" strokeWidth={1.8} />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── ROW 3: BOTTOM MINI STATS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatChip title="Volume Mensal" value={formatNumber(initialKPIs.operacao.volume_mensal)} icon={CalendarDays} accent="bg-neutral-800" />
        <StatChip title="Nº de Coletas" value={formatNumber(initialKPIs.operacao.numero_coletas)} icon={Package2} accent="bg-sky-500" />
        <StatChip title="Circularidade" value={`${initialKPIs.esg.circularidade_indice}%`} icon={RefreshCcw} accent="bg-teal-600" />
        <StatChip title="Performance" value={`${initialKPIs.performance.indice_performance.toFixed(1)}`} icon={Activity} accent="bg-violet-500" />
        <StatChip title="Eficiência" value={`${initialKPIs.eficiencia.eficiencia_recuperacao}%`} icon={ShieldCheck} accent="bg-emerald-500" />
        <StatChip title="Crescimento" value={`+${initialKPIs.performance.crescimento_mensal.toFixed(1)}%`} icon={TrendingUp} accent="bg-amber-500" />
      </div>

    </div>
  );
}
