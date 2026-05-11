"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, Magnet, Infinity,
  Feather, PiggyBank, Hourglass, Ghost,
  CalendarCheck, Target, CloudRain, Trees,
  GlassWater, Eraser, Ruler, ArrowUpRight, Ticket,
  Umbrella, Gem, Landmark,
  LineChart, BoxSelect, Send, HeartHandshake,
  Wrench, Scissors, Ship, Orbit, Radar, Sprout
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

// Estilo "Caneta BIC" para os ícones
const bicProps = {
  color: "#0020C2", // Azul BIC clássico
  strokeWidth: 1.2,
  className: "opacity-90 mix-blend-multiply",
};

// Wrapper para dar um toque "desenhado à mão"
const BicIcon = ({ icon: Icon, size = 24, rotate = 0 }: any) => (
  <motion.div
    whileHover={{ rotate: rotate + 5, scale: 1.1 }}
    style={{ transform: `rotate(${rotate}deg)` }}
    className="relative flex items-center justify-center"
  >
    <Icon size={size} {...bicProps} />
    {/* Efeito sutil de traço duplo (sketch) */}
    <Icon size={size} {...bicProps} className="absolute inset-0 opacity-30 -translate-x-[0.5px] translate-y-[0.5px]" strokeWidth={0.5} />
  </motion.div>
);

/* ─── PRIMARY KPI CARD ─── */
const HeroCard = ({ title, value, subtitle, icon: Icon, rotate }: any) => (
  <motion.div {...fadeUp(0.05)} className="bg-[#FAFAFA] rounded-[1.75rem] border border-neutral-200/60 p-7 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.04)] relative overflow-hidden group flex flex-col justify-between">
    {/* Textura de papel sutil */}
    <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiAvPgo8cGF0aCBkPSJNMCAwdjhINHYtOGgtdi04eiIgZmlsbD0iIzAwMCIgZmlsbC1vcGFjaXR5PSIwLjAyIiAvPgo8L3N2Zz4=')]" />

    <div className="flex justify-between items-start mb-6 relative z-10">
      <div className="w-12 h-12 flex items-center justify-center">
        <BicIcon icon={Icon} size={32} rotate={rotate} />
      </div>
      <p className="text-[10px] font-black text-neutral-800 uppercase tracking-[0.25em] text-right leading-tight max-w-[120px]">{title}</p>
    </div>

    <div className="relative z-10 mt-auto">
      <p className="text-[2.75rem] font-black text-[#0020C2] tracking-[-0.04em] leading-none mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{value}</p>
      <p className="text-[12px] font-bold text-neutral-500 tracking-tight leading-snug">{subtitle}</p>
    </div>

    {/* Risco de caneta animado */}
    <div className="absolute bottom-0 left-0 h-1 bg-transparent w-full">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ duration: 1.5, delay: 0.3, ease: "easeInOut" }}
        className="h-[2px] bg-[#0020C2]/20 relative top-[2px]"
      />
    </div>
  </motion.div>
);

/* ─── MINI STAT ─── */
const StatChip = ({ title, value, icon: Icon, rotate }: any) => (
  <motion.div {...fadeUp(0.1)} className="bg-white rounded-2xl border border-neutral-200/60 px-5 py-4 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
    <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiAvPgo8cGF0aCBkPSJNMCAwdjhINHYtOGgtdi04eiIgZmlsbD0iIzAwMCIgZmlsbC1vcGFjaXR5PSIwLjAyIiAvPgo8L3N2Zz4=')]" />
    <div className="w-8 h-8 flex items-center justify-center shrink-0 relative z-10">
      <BicIcon icon={Icon} size={22} rotate={rotate} />
    </div>
    <div className="relative z-10 flex flex-col justify-center">
      <p className="text-[9px] font-extrabold text-neutral-500 uppercase tracking-[0.2em] mb-0.5">{title}</p>
      <p className="text-[16px] font-black text-[#0020C2] leading-none tracking-tight group-hover:scale-105 origin-left transition-transform" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{value}</p>
    </div>
  </motion.div>
);

/* ─── NATURE ROW ITEM ─── */
const NatureRow = ({ label, value, icon: Icon, rotate }: any) => (
  <div className="flex items-center gap-4 py-4 border-b border-neutral-200/40 last:border-0 group">
    <div className="w-10 h-10 flex items-center justify-center shrink-0">
      <BicIcon icon={Icon} size={26} rotate={rotate} />
    </div>
    <div className="flex-1">
      <p className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-[0.25em] mb-1">{label}</p>
      <p className="text-[1.35rem] font-black text-neutral-900 leading-tight tracking-tight group-hover:text-[#0020C2] transition-colors" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{value}</p>
    </div>
    <ArrowUpRight size={18} className="text-[#0020C2]/30 group-hover:text-[#0020C2] transition-colors" strokeWidth={1.5} />
  </div>
);

export default function ClientDashboard({ initialKPIs }: { initialKPIs: DashboardKPIs, initialTimeline: any[] }) {
  const mesAtual = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="mt-8 space-y-8 font-sans">

      {/* ── STATUS BAR ── */}
      <motion.div {...fadeUp(0)} className="bg-white rounded-2xl px-6 py-4 flex flex-wrap items-center gap-x-8 gap-y-3 border border-neutral-200/60 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiAvPgo8cGF0aCBkPSJNMCAwdjhINHYtOGgtdi04eiIgZmlsbD0iIzAwMCIgZmlsbC1vcGFjaXR5PSIwLjAyIiAvPgo8L3N2Zz4=')]" />
        
        <div className="flex items-center gap-2.5 relative z-10">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0020C2] opacity-40" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0020C2]" />
          </span>
          <span className="text-[11px] font-black text-[#0020C2] uppercase tracking-[0.2em]">Operação Ativa</span>
        </div>
        <div className="h-3 w-px bg-neutral-200 hidden md:block relative z-10" />
        <div className="flex items-center gap-2 relative z-10">
          <CalendarCheck size={14} {...bicProps} className="opacity-50" />
          <span className="text-[11px] font-bold text-neutral-600 uppercase tracking-widest">{mesAtual}</span>
        </div>
        <div className="h-3 w-px bg-neutral-200 hidden md:block relative z-10" />
        <div className="flex items-center gap-2 relative z-10">
          <Target size={14} {...bicProps} className="opacity-50" />
          <span className="text-[11px] font-bold text-neutral-600 uppercase tracking-widest">
            <strong className="font-black text-neutral-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{formatNumber(initialKPIs.operacao.cargas_processadas)}</strong> Cargas Triadas
          </span>
        </div>
      </motion.div>

      {/* ── ROW 1: 4 HERO KPIS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <HeroCard
          title="Economia Acumulada"
          value={formatCurrency(initialKPIs.financeiro.economia_total)}
          subtitle="Valor retido vs. aquisição"
          icon={PiggyBank}
          rotate={-3}
        />
        <HeroCard
          title="Ativos Circulantes"
          value={formatNumber(initialKPIs.operacao.total_processado)}
          subtitle="Pallets reintegrados"
          icon={Infinity}
          rotate={5}
        />
        <HeroCard
          title="Emissões Evitadas"
          value={`${(initialKPIs.esg.co2_evitado / 1000).toFixed(1)} t`}
          subtitle="Pegada de carbono reduzida"
          icon={Feather}
          rotate={-8}
        />
        <HeroCard
          title="Índice de Retorno"
          value={`${initialKPIs.financeiro.roi_operacao.toFixed(0)}%`}
          subtitle="Desempenho financeiro"
          icon={LineChart}
          rotate={2}
        />
      </div>

      {/* ── ROW 2: MAIN PANEL + NATURE SIDEBAR ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* OPERATIONAL METRICS PANEL */}
        <motion.div {...fadeUp(0.12)} className="lg:col-span-8 bg-white rounded-[2rem] border border-neutral-200/60 shadow-sm overflow-hidden relative flex flex-col">
          <div className="absolute inset-0 opacity-[0.015] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/notebook.png')]" />
          
          <div className="px-10 pt-10 pb-6 border-b border-neutral-100 relative z-10 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[1.5rem] font-black text-[#0020C2] tracking-tighter flex items-center gap-3">
                  <BicIcon icon={Radar} size={26} /> Visão de Ciclo
                </h2>
                <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-[0.2em] mt-2 pl-[38px]">Métricas de fluxo e recuperação</p>
              </div>
            </div>
          </div>

          {/* METRICS GRID */}
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y divide-neutral-100 relative z-10 bg-white/50 flex-1">
            {[
              { label: "Coletado", value: formatNumber(initialKPIs.operacao.total_coletado), icon: Magnet, rotate: -5 },
              { label: "Em Estoque", value: formatNumber(initialKPIs.operacao.total_estoque), icon: BoxSelect, rotate: 0 },
              { label: "Expedido", value: formatNumber(initialKPIs.operacao.total_entregue), icon: Send, rotate: 10 },
              { label: "Tempo de Ciclo", value: initialKPIs.operacao.tempo_medio_ciclo, icon: Hourglass, rotate: -15 },
              { label: "Recuperados", value: `${initialKPIs.eficiencia.taxa_reaproveitamento}%`, icon: HeartHandshake, rotate: 0 },
              { label: "Reformados", value: `${initialKPIs.eficiencia.taxa_reforma}%`, icon: Wrench, rotate: 15 },
              { label: "Remanufaturados", value: `${initialKPIs.eficiencia.taxa_remanufatura}%`, icon: Scissors, rotate: -20 },
              { label: "Perda Natural", value: `${initialKPIs.eficiencia.perda_operacional}%`, icon: Ghost, rotate: 5 },
            ].map(({ label, value, icon: Icon, rotate }) => (
              <div key={label} className="px-6 py-8 group hover:bg-[#0020C2]/[0.02] transition-colors flex flex-col justify-center items-center text-center h-full">
                <div className="mb-4">
                  <BicIcon icon={Icon} size={28} rotate={rotate} />
                </div>
                <p className="text-[1.75rem] font-black text-neutral-900 leading-none mb-2 tracking-tighter" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{value}</p>
                <p className="text-[9.5px] font-extrabold text-neutral-500 uppercase tracking-[0.2em]">{label}</p>
              </div>
            ))}
          </div>

          {/* FINANCIAL ROW */}
          <div className="px-10 py-8 bg-[#FAFAFA] border-t border-neutral-200/60 grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10 flex-shrink-0">
            {[
              { label: "Economia/Und", value: formatCurrency(initialKPIs.financeiro.economia_por_pallet), icon: Ticket },
              { label: "Custo Evitado", value: formatCurrency(initialKPIs.financeiro.custo_evitar_novo), icon: Umbrella },
              { label: "Valor Gerado", value: formatCurrency(initialKPIs.financeiro.valor_recuperado), icon: Gem },
              { label: "Patrimônio Físico", value: formatCurrency(initialKPIs.financeiro.patrimonio_estoque), icon: Landmark },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="space-y-2">
                <div className="flex items-center gap-2">
                  <BicIcon icon={Icon} size={16} />
                  <p className="text-[9px] font-extrabold text-neutral-600 uppercase tracking-[0.2em]">{label}</p>
                </div>
                <p className="text-[1.1rem] font-black text-[#0020C2] leading-none pl-6 tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* NATURE SIDEBAR */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <motion.div {...fadeUp(0.16)} className="flex-1 bg-white rounded-[2rem] border border-neutral-200/60 p-8 relative overflow-hidden shadow-sm flex flex-col justify-between">
            {/* Linhas de caderno ao fundo */}
            <div className="absolute inset-0 bg-[linear-gradient(transparent_95%,_#0020C210_95%)] bg-[length:100%_2rem] pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-neutral-200/60">
                <BicIcon icon={Trees} size={30} rotate={-5} />
                <div>
                  <h3 className="text-[12px] font-black uppercase tracking-[0.25em] text-[#0020C2]">Impacto Positivo</h3>
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-1">Contribuição ambiental</p>
                </div>
              </div>

              <NatureRow label="Árvores Salvas" value={`${formatNumber(Math.round(initialKPIs.esg.arvores_preservadas))} un`} icon={Trees} rotate={5} />
              <NatureRow label="Água Poupada" value={`${formatNumber(Math.round(initialKPIs.esg.agua_economizada))} L`} icon={GlassWater} rotate={-10} />
              <NatureRow label="Resíduos Desviados" value={`${formatNumber(Math.round(initialKPIs.esg.residuos_evitar))} kg`} icon={Eraser} rotate={15} />
              <NatureRow label="Madeira Útil" value={`${initialKPIs.esg.madeira_reutilizada.toFixed(2)} m³`} icon={Ruler} rotate={0} />
            </div>
          </motion.div>

          {/* SAVINGS CARD */}
          <motion.div {...fadeUp(0.2)} className="bg-white rounded-[2rem] border border-[#0020C2]/40 p-8 relative overflow-hidden shadow-sm group">
            {/* Efeito de rabisco azul no fundo */}
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[#0020C2]/10 rounded-full blur-3xl group-hover:bg-[#0020C2]/15 transition-colors duration-700" />
            <div className="absolute top-0 left-0 w-full h-[6px] bg-[#0020C2]/20" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <BicIcon icon={Landmark} size={20} />
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#0020C2]">Geração de Valor</p>
              </div>
              <p className="text-[3.25rem] font-black leading-none mb-2 text-neutral-900 tracking-tighter" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {formatCurrency(initialKPIs.financeiro.poupanca_projetada)}
              </p>
              <p className="text-[11px] font-extrabold text-neutral-500 uppercase tracking-[0.2em]">Estimativa de poupança no ciclo</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── ROW 3: BOTTOM MINI STATS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatChip title="Fluxo Mês" value={formatNumber(initialKPIs.operacao.volume_mensal)} icon={CloudRain} rotate={-5} />
        <StatChip title="Missões" value={formatNumber(initialKPIs.operacao.numero_coletas)} icon={Ship} rotate={5} />
        <StatChip title="Circular" value={`${initialKPIs.esg.circularidade_indice}%`} icon={Orbit} rotate={-15} />
        <StatChip title="Vigor" value={`${initialKPIs.performance.indice_performance.toFixed(1)}`} icon={Sprout} rotate={10} />
        <StatChip title="Precisão" value={`${initialKPIs.eficiencia.eficiencia_recuperacao}%`} icon={Target} rotate={0} />
        <StatChip title="Avanço" value={`+${initialKPIs.performance.crescimento_mensal.toFixed(1)}%`} icon={TrendingUp} rotate={-10} />
      </div>

    </div>
  );
}

