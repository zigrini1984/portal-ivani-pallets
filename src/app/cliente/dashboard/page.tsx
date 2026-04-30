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
  LayoutDashboard,
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
  List,
  Calendar,
  Info,
  ExternalLink,
  MoreHorizontal
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- COMPONENTES DE UI ---

const Badge = ({ children, variant = "default" }: { children: React.ReactNode, variant?: "default" | "success" | "warning" | "error" | "info" }) => {
  const styles = {
    default: "bg-gray-100 text-gray-600 border-gray-200",
    success: "bg-green-50 text-green-600 border-green-100",
    warning: "bg-amber-50 text-amber-600 border-amber-100",
    error: "bg-red-50 text-red-600 border-red-100",
    info: "bg-brand-cyan/5 text-brand-cyan border-brand-cyan/10",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[variant]}`}>
      {children}
    </span>
  );
};

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white rounded-3xl border border-brand-pink/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${className}`}>
    {children}
  </div>
);

// --- COMPONENTES DE GRÁFICOS (TAILWIND) ---

const SimpleBarChart = ({ data }: { data: { label: string, value: number, color: string }[] }) => {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div className="flex items-end gap-3 h-40 w-full pt-4">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
          <div className="relative w-full flex flex-col items-center justify-end h-full">
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: `${(d.value / max) * 100}%` }}
              transition={{ duration: 1, delay: i * 0.1 }}
              className={`w-full max-w-[40px] rounded-t-lg ${d.color} opacity-80 group-hover:opacity-100 transition-opacity relative`}
            >
               <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-text-dark/40 opacity-0 group-hover:opacity-100 transition-opacity">
                {d.value}
              </div>
            </motion.div>
          </div>
          <span className="text-[10px] font-bold text-text-dark/30 uppercase tracking-tighter truncate w-full text-center">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
};

const DonutChart = ({ data }: { data: { label: string, value: number, color: string }[] }) => {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  let accumulated = 0;
  
  return (
    <div className="flex items-center gap-8">
      <div className="relative w-32 h-32 rounded-full border-[12px] border-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-bold text-text-dark">{total}</div>
          <div className="text-[8px] font-bold text-text-dark/30 uppercase tracking-widest">Total</div>
        </div>
        {/* Gráfico simplificado com gradientes ou múltiplos círculos seria complexo só com CSS puro, 
            então usaremos uma representação visual de barras horizontais ao lado */}
      </div>
      <div className="flex-1 space-y-3">
        {data.map((d, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${d.color}`} />
              <span className="text-text-dark/60 font-medium">{d.label}</span>
            </div>
            <span className="font-bold">{((d.value / total) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- MOCK DATA ---

const MOCK_STATS_OVERVIEW = [
  { label: "Pallets em Circulação", value: "2.480", icon: <Package />, trend: "+12%", trendUp: true },
  { label: "Economia Total", value: "R$ 142.800", icon: <Wallet />, trend: "Este ano", trendUp: true },
  { label: "Impacto Ambiental", value: "88/100", icon: <Leaf />, trend: "Excelente", trendUp: true },
  { label: "Lotes Ativos", value: "4", icon: <Activity />, trend: "2 urgentes", trendUp: false },
];

const MOCK_EVOLUTION_DATA = [
  { label: "Jan", value: 450, color: "bg-brand-blue" },
  { label: "Fev", value: 520, color: "bg-brand-blue" },
  { label: "Mar", value: 380, color: "bg-brand-blue" },
  { label: "Abr", value: 610, color: "bg-brand-cyan" },
  { label: "Mai", value: 580, color: "bg-brand-blue" },
  { label: "Jun", value: 720, color: "bg-brand-blue" },
];

const MOCK_DESTINATION_DATA = [
  { label: "Manutenção", value: 450, color: "bg-brand-yellow" },
  { label: "Remanufatura", value: 280, color: "bg-brand-blue" },
  { label: "Compra Ivani", value: 210, color: "bg-green-500" },
  { label: "Descarte", value: 120, color: "bg-red-400" },
];

const MOCK_LOTES = [
  { id: "LOTE-2024-002", data: "2024-04-26", qtd: 400, status: "Triagem", destino: "A definir", prioridade: "Alta", atualizado: "Há 5 horas" },
  { id: "LOTE-2024-001", data: "2024-04-25", qtd: 250, status: "Manutenção", destino: "Reforma", prioridade: "Normal", atualizado: "Há 2 horas" },
  { id: "LOTE-2024-003", data: "2024-04-28", qtd: 150, status: "Finalizado", destino: "Compra Ivani", prioridade: "Baixa", atualizado: "Ontem" },
  { id: "LOTE-2024-004", data: "2024-04-29", qtd: 320, status: "Aguardando", destino: "A definir", prioridade: "Alta", atualizado: "Hoje" },
];

export default function ClienteDashboardPremium() {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Visão Geral", icon: <LayoutDashboard size={18} /> },
    { id: "operation", label: "Operação", icon: <Settings size={18} /> },
    { id: "financial", label: "Financeiro", icon: <DollarSign size={18} /> },
    { id: "environmental", label: "Ambiental", icon: <Leaf size={18} /> },
    { id: "batches", label: "Lotes & Rastreio", icon: <List size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-text-dark font-sans pb-20">
      {/* Header Premium */}
      <header className="bg-white/80 backdrop-blur-md border-b border-brand-pink/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-10">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-brand-cyan rounded-xl flex items-center justify-center shadow-lg shadow-brand-cyan/20">
                  <Package className="text-white" size={18} />
                </div>
                <span className="font-display font-bold text-lg tracking-tight text-brand-cyan">Ivani Portal</span>
              </div>
              
              <nav className="hidden lg:flex items-center gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      activeTab === tab.id 
                      ? "bg-brand-cyan/5 text-brand-cyan" 
                      : "text-text-dark/40 hover:text-text-dark/60"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end mr-2">
                <span className="text-xs font-bold text-text-dark">TCE Logística</span>
                <span className="text-[10px] text-text-dark/40 font-medium italic">Premium Partner</span>
              </div>
              <div className="w-10 h-10 bg-brand-pink/30 rounded-full border-2 border-white overflow-hidden">
                <div className="w-full h-full bg-brand-cyan/10 flex items-center justify-center text-brand-cyan font-bold text-xs">TCE</div>
              </div>
              <button className="p-2 text-text-dark/40 hover:text-red-500 transition-colors">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-10">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="info">Abril 2024</Badge>
              <div className="w-1 h-1 bg-text-dark/20 rounded-full" />
              <span className="text-xs font-bold text-text-dark/40 uppercase tracking-widest">Atualizado agora</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Olá, TCE Logística</h1>
            <p className="text-text-dark/50 mt-1">Sua operação de pallets está rodando com 94% de eficiência este mês.</p>
          </motion.div>
          
          <div className="flex gap-3">
            <button className="px-5 py-3 bg-white border border-brand-pink/40 rounded-2xl text-sm font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2">
              <Calendar size={16} className="text-text-dark/40" />
              Últimos 30 dias
            </button>
            <button className="px-5 py-3 bg-brand-cyan text-white rounded-2xl text-sm font-bold shadow-lg shadow-brand-cyan/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2">
              <Truck size={16} />
              Nova Coleta
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Top KPIs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {MOCK_STATS_OVERVIEW.map((stat, i) => (
                  <Card key={i} className="p-6 group cursor-default">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-brand-cyan/5 text-brand-cyan rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
                        {React.isValidElement(stat.icon) && React.cloneElement(stat.icon as React.ReactElement<any>, { size: 24 })}
                      </div>
                      <div className={`flex items-center gap-1 text-xs font-bold ${stat.trendUp ? 'text-green-500' : 'text-amber-500'}`}>
                        {stat.trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {stat.trend}
                      </div>
                    </div>
                    <div className="text-[10px] font-bold text-text-dark/30 uppercase tracking-widest mb-1">{stat.label}</div>
                    <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
                  </Card>
                ))}
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 p-8">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h3 className="text-lg font-bold">Fluxo Mensal de Pallets</h3>
                      <p className="text-xs text-text-dark/40 font-medium">Quantidade processada por mês</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-text-dark/40">
                        <div className="w-2 h-2 rounded-full bg-brand-cyan" /> Atual
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-text-dark/40">
                        <div className="w-2 h-2 rounded-full bg-brand-blue opacity-50" /> Anterior
                      </div>
                    </div>
                  </div>
                  <SimpleBarChart data={MOCK_EVOLUTION_DATA} />
                </Card>

                <Card className="p-8">
                  <h3 className="text-lg font-bold mb-2">Destino do Material</h3>
                  <p className="text-xs text-text-dark/40 font-medium mb-8">Distribuição do lote atual</p>
                  <DonutChart data={MOCK_DESTINATION_DATA} />
                  <div className="mt-8 pt-8 border-t border-brand-pink/20">
                    <button className="w-full py-3 bg-bg-primary hover:bg-brand-pink/20 text-text-dark/60 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
                      Relatório Completo <ExternalLink size={14} />
                    </button>
                  </div>
                </Card>
              </div>

              {/* Active Batches Preview */}
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">Lotes Recentes</h3>
                  <button onClick={() => setActiveTab("batches")} className="text-sm font-bold text-brand-cyan hover:underline flex items-center gap-1">
                    Ver todos <ChevronRight size={16} />
                  </button>
                </div>
                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-bg-primary/50 text-[10px] font-bold uppercase tracking-widest text-text-dark/40">
                          <th className="px-8 py-5">Identificador</th>
                          <th className="px-6 py-5">Volume</th>
                          <th className="px-6 py-5">Status</th>
                          <th className="px-6 py-5">Prioridade</th>
                          <th className="px-8 py-5 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-pink/10">
                        {MOCK_LOTES.slice(0, 3).map((lote, i) => (
                          <tr key={i} className="hover:bg-brand-pink/5 transition-colors group">
                            <td className="px-8 py-5">
                              <div className="flex flex-col">
                                <span className="font-bold text-sm">{lote.id}</span>
                                <span className="text-[10px] text-text-dark/40">{new Date(lote.data).toLocaleDateString('pt-BR')}</span>
                              </div>
                            </td>
                            <td className="px-6 py-5 font-bold text-sm text-brand-cyan">{lote.qtd} unid.</td>
                            <td className="px-6 py-5">
                              <Badge variant={lote.status === "Finalizado" ? "success" : "warning"}>{lote.status}</Badge>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${lote.prioridade === 'Alta' ? 'bg-red-500' : 'bg-gray-300'}`} />
                                <span className="text-xs font-medium text-text-dark/60">{lote.prioridade}</span>
                              </div>
                            </td>
                            <td className="px-8 py-5 text-right">
                              <button className="text-brand-cyan p-2 hover:bg-brand-cyan/5 rounded-lg transition-all">
                                <ArrowRight size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === "batches" && (
            <motion.div 
              key="batches"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-10"
            >
              {/* Tabela Completa */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">Rastreabilidade de Lotes</h3>
                  <div className="flex gap-2">
                    <button className="p-2 border border-brand-pink/40 rounded-xl hover:bg-white"><Filter size={18} /></button>
                    <button className="p-2 border border-brand-pink/40 rounded-xl hover:bg-white"><Search size={18} /></button>
                  </div>
                </div>
                <Card className="overflow-hidden">
                   <table className="w-full text-left">
                      <thead>
                        <tr className="bg-bg-primary/50 text-[10px] font-bold uppercase tracking-widest text-text-dark/40">
                          <th className="px-8 py-5">Lote</th>
                          <th className="px-6 py-5">Qtd</th>
                          <th className="px-6 py-5">Status</th>
                          <th className="px-6 py-5">Destino</th>
                          <th className="px-8 py-5"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-pink/10">
                        {MOCK_LOTES.map((lote, i) => (
                          <tr key={i} className="hover:bg-brand-pink/5 transition-all cursor-pointer">
                            <td className="px-8 py-6 font-bold text-sm">{lote.id}</td>
                            <td className="px-6 py-6 font-bold text-brand-cyan text-sm">{lote.qtd}</td>
                            <td className="px-6 py-6"><Badge variant={lote.status === "Finalizado" ? "success" : "info"}>{lote.status}</Badge></td>
                            <td className="px-6 py-6 font-medium text-xs text-text-dark/50">{lote.destino}</td>
                            <td className="px-8 py-6 text-right"><MoreHorizontal size={18} className="text-text-dark/20" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </Card>
              </div>

              {/* Timeline Detalhada */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold">Timeline do Lote</h3>
                <Card className="p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4">
                    <Badge variant="warning">Prioridade Alta</Badge>
                  </div>
                  <div className="mb-10">
                    <h4 className="text-lg font-bold">LOTE-2024-002</h4>
                    <p className="text-xs text-text-dark/40 italic">Última atualização: hoje, 14:30</p>
                  </div>

                  <div className="space-y-10 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-brand-pink/30">
                    {[
                      { label: "Coleta Realizada", desc: "Equipe Ivani retirou material", date: "26/04 - 15:45", done: true },
                      { label: "Material Recebido", desc: "Central Ivani - Unidade 1", date: "27/04 - 08:20", done: true },
                      { label: "Em Triagem", desc: "Aguardando definição técnica", date: "Em curso", active: true },
                      { label: "Manutenção", desc: "-", date: "Pendente", done: false },
                    ].map((step, i) => (
                      <div key={i} className="flex gap-6 relative">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 border-4 border-white ${
                          step.done ? 'bg-brand-cyan' : step.active ? 'bg-brand-yellow scale-125' : 'bg-gray-200'
                        }`}>
                          {step.done && <CheckCircle2 size={10} className="text-white" />}
                          {step.active && <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />}
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-sm font-bold ${!step.done && !step.active ? 'text-text-dark/30' : 'text-text-dark'}`}>
                            {step.label}
                          </span>
                          <span className="text-[10px] text-text-dark/50 font-medium mb-1">{step.desc}</span>
                          <span className="text-[9px] font-bold text-brand-cyan/60 uppercase tracking-tighter">{step.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button className="w-full mt-10 py-4 bg-brand-cyan text-white rounded-2xl text-xs font-bold shadow-lg shadow-brand-cyan/10">
                    Download do Relatório Técnico
                  </button>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === "operation" && (
            <motion.div key="operation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
              <div className="w-20 h-20 bg-brand-cyan/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Settings className="text-brand-cyan" size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Módulo de Operação Detalhada</h3>
              <p className="text-text-dark/40 max-w-sm mx-auto">Em breve: Acompanhe cada etapa da triagem e manutenção com fotos em tempo real.</p>
            </motion.div>
          )}

          {activeTab === "financial" && (
            <motion.div key="financial" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
               <div className="w-20 h-20 bg-brand-cyan/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <DollarSign className="text-brand-cyan" size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Módulo Financeiro & ROI</h3>
              <p className="text-text-dark/40 max-w-sm mx-auto">Em breve: Relatórios de economia gerada e faturamento automático por lote.</p>
            </motion.div>
          )}

          {activeTab === "environmental" && (
            <motion.div key="environmental" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
               <div className="w-20 h-20 bg-brand-cyan/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Leaf className="text-brand-cyan" size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Relatórios de Impacto Ambiental</h3>
              <p className="text-text-dark/40 max-w-sm mx-auto">Em breve: Certificados de sustentabilidade e compensação de CO₂ detalhados.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Support Info */}
      <div className="fixed bottom-8 right-8 flex items-center gap-3">
        <button className="bg-white border border-brand-pink/30 p-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all group">
          <Info size={20} className="text-text-dark/30 group-hover:text-brand-cyan transition-colors" />
        </button>
      </div>
    </div>
  );
}
