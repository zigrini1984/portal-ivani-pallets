"use client";

import React, { useState } from "react";
import { 
  Package, 
  Truck, 
  ClipboardCheck, 
  Hammer, 
  Trash2, 
  DollarSign, 
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  Search,
  LogOut,
  ChevronRight,
  CircleDot,
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  Wallet,
  ShieldCheck,
  Banknote,
  Leaf,
  Recycle,
  Wind,
  Trees,
  RotateCw,
  Settings,
  List
} from "lucide-react";
import { motion } from "framer-motion";

// --- MOCK DATA ---

const MOCK_STATS_OPERACAO = [
  { label: "Total Recebidos", value: "1.250", icon: <Package />, color: "text-brand-cyan", bg: "bg-brand-cyan/10" },
  { label: "Em Triagem", value: "450", icon: <ClipboardCheck />, color: "text-brand-yellow", bg: "bg-brand-yellow/10" },
  { label: "Em Manutenção", value: "380", icon: <Hammer />, color: "text-brand-brown", bg: "bg-brand-brown/10" },
  { label: "Em Remanufatura", value: "120", icon: <Settings />, color: "text-brand-blue", bg: "bg-brand-blue/10" },
  { label: "Descartados", value: "120", icon: <Trash2 />, color: "text-red-500", bg: "bg-red-50" },
  { label: "Comprados pela Ivani", value: "210", icon: <DollarSign />, color: "text-green-500", bg: "bg-green-50" },
  { label: "Finalizados", value: "890", icon: <CheckCircle2 />, color: "text-brand-cyan", bg: "bg-brand-cyan/10" },
  { label: "Lotes em Aberto", value: "4", icon: <List />, color: "text-brand-cyan", bg: "bg-brand-cyan/10" },
];

const MOCK_STATS_PERFORMANCE = [
  { label: "Taxa de Recuperação", value: "82%", icon: <TrendingUp />, color: "text-green-500", bg: "bg-green-50" },
  { label: "Taxa de Descarte", value: "9.6%", icon: <TrendingDown />, color: "text-red-500", bg: "bg-red-50" },
  { label: "Média Triagem", value: "1.2 dias", icon: <Clock />, color: "text-brand-cyan", bg: "bg-brand-cyan/10" },
  { label: "Média Manutenção", value: "2.4 dias", icon: <Clock />, color: "text-brand-cyan", bg: "bg-brand-cyan/10" },
  { label: "Prazo Finalização", value: "4.1 dias", icon: <Target />, color: "text-brand-cyan", bg: "bg-brand-cyan/10" },
  { label: "Lotes Finalizados", value: "94%", icon: <CheckCircle2 />, color: "text-green-500", bg: "bg-green-50" },
  { label: "Média por Lote", value: "312 unid", icon: <Activity />, color: "text-brand-cyan", bg: "bg-brand-cyan/10" },
];

const MOCK_STATS_FINANCEIRO = [
  { label: "Economia Gerada", value: "R$ 42.500", icon: <Wallet />, color: "text-green-600", bg: "bg-green-50" },
  { label: "Valor de Compra", value: "R$ 12.800", icon: <Banknote />, color: "text-brand-cyan", bg: "bg-brand-cyan/10" },
  { label: "Custo Evitado (Descarte)", value: "R$ 3.200", icon: <ShieldCheck />, color: "text-brand-blue", bg: "bg-brand-blue/10" },
  { label: "Recuperado por Pallet", value: "R$ 34,00", icon: <TrendingUp />, color: "text-brand-cyan", bg: "bg-brand-cyan/10" },
];

const MOCK_STATS_AMBIENTAL = [
  { label: "Madeira Reaproveitada", value: "~14.2 ton", icon: <Recycle />, color: "text-green-600", bg: "bg-green-50" },
  { label: "Resíduos Evitados", value: "~850 kg", icon: <Trash2 />, color: "text-brand-cyan", bg: "bg-brand-cyan/10" },
  { label: "CO₂ Evitado Estimado", value: "~4.8 ton", icon: <Wind />, color: "text-brand-blue", bg: "bg-brand-blue/10" },
  { label: "Árvores Preservadas", value: "~72 unid", icon: <Trees />, color: "text-green-500", bg: "bg-green-50" },
  { label: "Índice de Circularidade", value: "0.88", icon: <RotateCw />, color: "text-brand-cyan", bg: "bg-brand-cyan/10" },
];

const MOCK_LOTES = [
  { id: "LOTE-2024-001", data: "2024-04-25", qtd: 250, status: "Em Manutenção", destino: "Reforma", obs: "Pallets PBR1", atualizado: "Há 2 horas" },
  { id: "LOTE-2024-002", data: "2024-04-26", qtd: 400, status: "Triagem", destino: "A definir", obs: "Material misto", atualizado: "Há 5 horas" },
  { id: "LOTE-2024-003", data: "2024-04-28", qtd: 150, status: "Finalizado", destino: "Compra Ivani", obs: "Qualidade A", atualizado: "Ontem" },
  { id: "LOTE-2024-004", data: "2024-04-29", qtd: 320, status: "Aguardando Coleta", destino: "A definir", obs: "Unidade Industrial", atualizado: "Hoje" },
];

const PROCESS_STEPS = [
  { id: 1, label: "Coleta Solicitada", status: "complete", date: "25/04 - 10:30" },
  { id: 2, label: "Coleta Realizada", status: "complete", date: "25/04 - 15:45" },
  { id: 3, label: "Material Recebido", status: "complete", date: "26/04 - 08:20" },
  { id: 4, label: "Em Triagem", status: "active", date: "Em curso" },
  { id: 5, label: "Manutenção / Destino", status: "pending", date: "-" },
  { id: 6, label: "Finalizado", status: "pending", date: "-" },
];

// Componente de Card de KPI
const KPICard = ({ label, value, icon, color, bg }: { label: string, value: string, icon: React.ReactNode, color: string, bg: string }) => (
  <motion.div
    whileHover={{ y: -2 }}
    className="bg-white p-5 rounded-2xl card-shadow border border-brand-pink/20 transition-all flex flex-col justify-between"
  >
    <div className="flex justify-between items-start mb-3">
      <div className={`p-2 rounded-lg ${bg} ${color}`}>
        {React.isValidElement(icon) && React.cloneElement(icon as React.ReactElement<any>, { size: 18 })}
      </div>
      <div className="text-xs font-bold text-text-dark/30 tracking-tight text-right leading-tight">
        {label}
      </div>
    </div>
    <div className="text-xl font-bold tracking-tight text-text-dark">{value}</div>
  </motion.div>
);

export default function ClienteDashboard() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-dark font-sans pb-20">
      {/* Header / Navbar */}
      <nav className="bg-white border-b border-brand-pink/50 sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-brand-cyan rounded-xl flex items-center justify-center shadow-lg shadow-brand-cyan/20">
              <Package className="text-white" size={20} />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-brand-cyan">Portal Ivani Pallets</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 text-sm font-medium text-text-dark/60 bg-brand-pink/20 px-4 py-2 rounded-full border border-brand-pink/50">
              <CircleDot className="text-brand-cyan" size={14} />
              <span><strong>TCE Logística</strong></span>
            </div>
            <button className="p-2 text-text-dark/40 hover:text-red-500 transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-10">
        {/* Título e Ações Rápidas */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-bold mb-2">Painel de Controle</h1>
            <p className="text-text-dark/50">Indicadores operacionais e impacto da sua logística de pallets.</p>
          </div>
          <button className="bg-brand-cyan hover:bg-[#1a6e74] text-white px-6 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-xl shadow-brand-cyan/20">
            <Truck size={20} />
            Solicitar Coleta
          </button>
        </div>

        {/* --- SEÇÃO 1: RESUMO GERAL (OPERAÇÃO) --- */}
        <div className="mb-12">
          <h2 className="text-sm font-bold uppercase tracking-widest text-text-dark/40 mb-6 flex items-center gap-2">
            <Activity size={16} className="text-brand-cyan" />
            Resumo Geral Operacional
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {MOCK_STATS_OPERACAO.map((kpi, i) => (
              <KPICard key={i} {...kpi} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* --- SEÇÃO 2: PERFORMANCE OPERACIONAL --- */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-text-dark/40 mb-6 flex items-center gap-2">
              <TrendingUp size={16} className="text-brand-cyan" />
              Performance Operacional
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {MOCK_STATS_PERFORMANCE.map((kpi, i) => (
                <KPICard key={i} {...kpi} />
              ))}
            </div>
          </div>

          {/* --- SEÇÃO 3: IMPACTO FINANCEIRO --- */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-text-dark/40 mb-6 flex items-center gap-2">
              <DollarSign size={16} className="text-brand-cyan" />
              Impacto Financeiro
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {MOCK_STATS_FINANCEIRO.map((kpi, i) => (
                <KPICard key={i} {...kpi} />
              ))}
            </div>
          </div>
        </div>

        {/* --- SEÇÃO 4: IMPACTO AMBIENTAL ESTIMADO --- */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-text-dark/40 flex items-center gap-2">
              <Leaf size={16} className="text-green-600" />
              Impacto Ambiental Estimado
            </h2>
            <span className="text-[10px] font-bold text-text-dark/30 italic uppercase">* Valores calculados com base em médias operacionais</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {MOCK_STATS_AMBIENTAL.map((kpi, i) => (
              <KPICard key={i} {...kpi} />
            ))}
          </div>
        </div>

        {/* --- TABELA E TIMELINE (MANTIDOS) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2.5rem] card-shadow border border-brand-pink/20 overflow-hidden">
              <div className="p-8 border-b border-brand-pink/20 flex justify-between items-center bg-white">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <Clock className="text-brand-cyan" size={20} />
                  Lotes em Andamento
                </h2>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dark/30" size={16} />
                    <input 
                      type="text" 
                      placeholder="Buscar..." 
                      className="pl-10 pr-4 py-2 bg-bg-primary border border-brand-pink/30 rounded-xl text-sm focus:outline-none focus:border-brand-cyan/50"
                    />
                  </div>
                  <button className="p-2 bg-bg-primary border border-brand-pink/30 rounded-xl text-text-dark/50 hover:text-brand-cyan">
                    <Filter size={18} />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-bg-primary/50 text-[10px] font-bold uppercase tracking-widest text-text-dark/40">
                      <th className="px-8 py-4">Lote / Data</th>
                      <th className="px-6 py-4">Quantidade</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Destino</th>
                      <th className="px-8 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-pink/10">
                    {MOCK_LOTES.map((lote, i) => (
                      <tr key={i} className="hover:bg-brand-pink/5 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="font-bold text-sm mb-1">{lote.id}</div>
                          <div className="text-xs text-text-dark/40">{new Date(lote.data).toLocaleDateString('pt-BR')}</div>
                        </td>
                        <td className="px-6 py-6 font-bold text-brand-cyan">{lote.qtd} unid.</td>
                        <td className="px-6 py-6 text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${lote.status === 'Finalizado' ? 'bg-green-500' : 'bg-brand-yellow'} animate-pulse`} />
                            {lote.status}
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase border border-brand-cyan/20 text-brand-cyan bg-brand-cyan/5">
                            {lote.destino}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button className="p-2 text-text-dark/20 group-hover:text-brand-cyan transition-all">
                            <ChevronRight size={20} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-[2.5rem] card-shadow border border-brand-pink/20 p-8 h-full">
              <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
                <CircleDot className="text-brand-cyan" size={20} />
                Tracking do Lote
              </h2>
              
              <div className="mb-8 p-4 bg-brand-cyan/5 rounded-2xl border border-brand-cyan/10">
                <div className="text-lg font-bold">LOTE-2024-002</div>
                <div className="text-xs text-text-dark/40 italic">Atu: Há 5 horas</div>
              </div>

              <div className="space-y-8 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-brand-pink/30">
                {PROCESS_STEPS.map((step, i) => (
                  <div key={i} className="flex gap-6 relative">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      step.status === 'complete' ? 'bg-brand-cyan text-white' : 
                      step.status === 'active' ? 'bg-brand-yellow text-white scale-125 shadow-lg' : 
                      'bg-bg-primary border-2 border-brand-pink/30'
                    }`}>
                      {step.status === 'complete' && <CheckCircle2 size={14} />}
                      {step.status === 'active' && <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold ${step.status === 'pending' ? 'text-text-dark/30' : 'text-text-dark'}`}>
                        {step.label}
                      </span>
                      <span className="text-[10px] text-text-dark/40">{step.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-20 py-10 border-t border-brand-pink/30 px-6 text-center text-xs font-bold tracking-widest uppercase text-text-dark/30">
        © 2024 Ivani Pallets — Gestão de Logística Reversa
      </footer>
    </div>
  );
}
