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
  <div className={`bg-white rounded-2xl border border-brand-pink/20 shadow-[0_4px_20px_rgb(0,0,0,0.03)] ${className}`}>
    {children}
  </div>
);

// --- COMPONENTES DE GRÁFICOS (TAILWIND) ---

const SimpleBarChart = ({ data }: { data: { label: string, value: number, color: string }[] }) => {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div className="flex items-end gap-2 sm:gap-3 h-32 sm:h-40 w-full pt-4">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
          <div className="relative w-full flex flex-col items-center justify-end h-full">
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: `${(d.value / max) * 100}%` }}
              transition={{ duration: 1, delay: i * 0.1 }}
              className={`w-full max-w-[32px] rounded-t-md ${d.color} opacity-80 group-hover:opacity-100 transition-opacity relative`}
            >
               <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-text-dark/40 opacity-0 group-hover:opacity-100 transition-opacity">
                {d.value}
              </div>
            </motion.div>
          </div>
          <span className="text-[9px] font-bold text-text-dark/30 uppercase tracking-tighter truncate w-full text-center">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
};

const DonutChart = ({ data }: { data: { label: string, value: number, color: string }[] }) => {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
      <div className="relative w-28 h-28 rounded-full border-[10px] border-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-bold text-text-dark">{total}</div>
          <div className="text-[7px] font-bold text-text-dark/30 uppercase tracking-widest leading-none">Pallets</div>
        </div>
      </div>
      <div className="flex-1 space-y-2.5 w-full">
        {data.map((d, i) => (
          <div key={i} className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${d.color}`} />
              <span className="text-text-dark/60 font-semibold">{d.label}</span>
            </div>
            <span className="font-bold text-text-dark/80">{((d.value / total) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- MOCK DATA ---

const MOCK_STATS_OVERVIEW = [
  { label: "Pallets em Circulação", value: "2.480", icon: <Package />, trend: "+12%", trendUp: true, desc: "Volume total sob gestão" },
  { label: "Economia Gerada", value: "R$ 142.800", icon: <Wallet />, trend: "+R$ 12k", trendUp: true, desc: "Comparado a material novo" },
  { label: "Circularidade", value: "88%", icon: <RotateCw />, trend: "Ótima", trendUp: true, desc: "Índice de reaproveitamento" },
  { label: "Lotes Ativos", value: "4", icon: <Activity />, trend: "Normal", trendUp: true, desc: "Em processo de triagem" },
];

const MOCK_EVOLUTION_DATA = [
  { label: "Jan", value: 450, color: "bg-brand-blue/40" },
  { label: "Fev", value: 520, color: "bg-brand-blue/40" },
  { label: "Mar", value: 380, color: "bg-brand-blue/40" },
  { label: "Abr", value: 610, color: "bg-brand-cyan" },
  { label: "Mai", value: 580, color: "bg-brand-blue/40" },
  { label: "Jun", value: 720, color: "bg-brand-blue/40" },
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

export default function ClienteDashboardPCE() {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Geral", icon: <LayoutDashboard size={16} /> },
    { id: "operation", label: "Operação", icon: <Settings size={16} /> },
    { id: "financial", label: "Financeiro", icon: <DollarSign size={16} /> },
    { id: "environmental", label: "Ambiental", icon: <Leaf size={16} /> },
    { id: "batches", label: "Lotes", icon: <List size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-text-dark font-sans pb-20">
      {/* Header Premium PCE */}
      <header className="bg-white border-b border-brand-pink/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center gap-4 sm:gap-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-brand-cyan rounded-lg flex items-center justify-center shadow-lg shadow-brand-cyan/20">
                  <Package className="text-white" size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-bold text-base sm:text-lg leading-none text-brand-cyan">Portal PCE</span>
                  <span className="text-[9px] font-bold text-text-dark/30 uppercase tracking-tighter mt-0.5">Ivani Pallets</span>
                </div>
              </div>
              
              <nav className="hidden lg:flex items-center gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      activeTab === tab.id 
                      ? "bg-brand-cyan/5 text-brand-cyan" 
                      : "text-text-dark/40 hover:text-text-dark/60 hover:bg-gray-50"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold text-text-dark">PCE Logística</span>
                <span className="text-[10px] text-brand-cyan font-bold tracking-tighter uppercase">Parceiro Estratégico</span>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-brand-pink/30 rounded-full border border-brand-pink/50 flex items-center justify-center text-brand-cyan font-bold text-xs">
                PCE
              </div>
              <button className="p-2 text-text-dark/40 hover:text-red-500 transition-colors">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
        {/* Mobile Navigation */}
        <div className="lg:hidden flex overflow-x-auto px-4 py-2 gap-1 border-t border-brand-pink/10 bg-white">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                activeTab === tab.id 
                ? "bg-brand-cyan/5 text-brand-cyan" 
                : "text-text-dark/40"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 sm:mb-12">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="px-2 py-0.5 bg-brand-cyan/10 text-brand-cyan rounded text-[9px] font-bold uppercase tracking-wider">Dashboard Operacional</div>
              <div className="w-1 h-1 bg-text-dark/20 rounded-full" />
              <span className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest">PCE — Unidade Central</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-dark">Acompanhamento operacional de pallets</h1>
            <p className="text-text-dark/50 mt-1.5 text-sm sm:text-base">Bem-vindo, PCE. Veja o status real dos seus ativos logísticos.</p>
          </motion.div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-brand-pink/30 rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2">
              <Calendar size={14} className="text-text-dark/40" />
              Filtrar Período
            </button>
            <button className="flex-1 sm:flex-none px-4 py-2.5 bg-brand-cyan text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-cyan/20 hover:bg-[#1a6e74] transition-all flex items-center justify-center gap-2">
              <Truck size={14} />
              Solicitar Coleta
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">
              {/* Higher Hierarchy KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {MOCK_STATS_OVERVIEW.map((stat, i) => (
                  <Card key={i} className="p-6 relative group overflow-hidden border-brand-pink/10">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                       {React.isValidElement(stat.icon) && React.cloneElement(stat.icon as React.ReactElement<any>, { size: 64 })}
                    </div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 bg-brand-cyan/5 text-brand-cyan rounded-lg flex items-center justify-center">
                        {React.isValidElement(stat.icon) && React.cloneElement(stat.icon as React.ReactElement<any>, { size: 20 })}
                      </div>
                      <div className={`flex items-center gap-1 text-[10px] font-bold ${stat.trendUp ? 'text-green-500' : 'text-brand-cyan'}`}>
                        {stat.trend}
                        {stat.trendUp ? <TrendingUp size={10} /> : <Activity size={10} />}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest mb-1">{stat.label}</span>
                      <span className="text-2xl sm:text-3xl font-bold tracking-tight text-text-dark">{stat.value}</span>
                      <span className="text-[10px] text-text-dark/40 font-medium mt-1">{stat.desc}</span>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Data Visualization Group */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8">
                <Card className="lg:col-span-3 p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                        <Activity size={18} className="text-brand-cyan" />
                        Fluxo Logístico Mensal
                      </h3>
                      <p className="text-[11px] text-text-dark/40 font-medium mt-0.5">Processamento histórico de pallets (PCE)</p>
                    </div>
                    <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-widest text-text-dark/30">
                      <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-brand-cyan" /> Mês Atual</div>
                      <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-brand-blue/30" /> Média</div>
                    </div>
                  </div>
                  <SimpleBarChart data={MOCK_EVOLUTION_DATA} />
                </Card>

                <Card className="lg:col-span-2 p-6 sm:p-8">
                  <h3 className="text-base sm:text-lg font-bold mb-1 flex items-center gap-2">
                    <Target size={18} className="text-brand-cyan" />
                    Destino do Lote Atual
                  </h3>
                  <p className="text-[11px] text-text-dark/40 font-medium mb-8 uppercase tracking-tighter italic">Status da última triagem realizada</p>
                  <DonutChart data={MOCK_DESTINATION_DATA} />
                </Card>
              </div>

              {/* General Material Status Highlight */}
              <Card className="bg-brand-cyan/5 border-brand-cyan/10 p-6 sm:p-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg text-brand-cyan">
                      <CheckCircle2 size={32} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Status Geral da Operação</h3>
                      <p className="text-sm text-text-dark/60">A sua logística está operando com **eficiência máxima**.</p>
                      <div className="flex items-center gap-3 mt-3">
                        <Badge variant="success">94% Eficiência</Badge>
                        <Badge variant="info">4 Lotes Ativos</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-10">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-text-dark">4.1 dias</div>
                      <div className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest">Lead Time Médio</div>
                    </div>
                    <div className="w-px h-10 bg-brand-cyan/20" />
                    <div className="text-center">
                      <div className="text-2xl font-bold text-text-dark">82%</div>
                      <div className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest">Recuperação</div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === "batches" && (
            <motion.div key="batches" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                 <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">Rastreabilidade PCE</h3>
                  <div className="flex gap-2">
                    <div className="relative hidden sm:block">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dark/20" size={14} />
                      <input type="text" placeholder="Buscar lote..." className="pl-9 pr-4 py-2 bg-white border border-brand-pink/30 rounded-lg text-xs focus:outline-none" />
                    </div>
                  </div>
                </div>
                <Card className="overflow-hidden">
                   <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead>
                          <tr className="bg-bg-primary/50 text-[10px] font-bold uppercase tracking-widest text-text-dark/40 border-b border-brand-pink/10">
                            <th className="px-6 py-4">ID Lote</th>
                            <th className="px-4 py-4">Vol.</th>
                            <th className="px-4 py-4">Status</th>
                            <th className="px-4 py-4">Prioridade</th>
                            <th className="px-6 py-4 text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-pink/10">
                          {MOCK_LOTES.map((lote, i) => (
                            <tr key={i} className="hover:bg-brand-pink/5 transition-all group">
                              <td className="px-6 py-5">
                                <div className="font-bold text-xs">{lote.id}</div>
                                <div className="text-[10px] text-text-dark/30">{new Date(lote.data).toLocaleDateString('pt-BR')}</div>
                              </td>
                              <td className="px-4 py-5 font-bold text-brand-cyan text-xs">{lote.qtd}</td>
                              <td className="px-4 py-5"><Badge variant={lote.status === "Finalizado" ? "success" : "warning"}>{lote.status}</Badge></td>
                              <td className="px-4 py-5">
                                <div className="flex items-center gap-1.5">
                                  <div className={`w-1.5 h-1.5 rounded-full ${lote.prioridade === 'Alta' ? 'bg-red-500' : 'bg-gray-300'}`} />
                                  <span className="text-[10px] font-medium text-text-dark/50">{lote.prioridade}</span>
                                </div>
                              </td>
                              <td className="px-6 py-5 text-right">
                                <button className="text-[10px] font-bold text-brand-cyan uppercase tracking-wider hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Detalhes</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   </div>
                </Card>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-bold">Timeline do Lote Selecionado</h3>
                <Card className="p-8 relative">
                   <div className="absolute top-4 right-4">
                     <Badge variant="warning">Ativo</Badge>
                   </div>
                   <div className="mb-8">
                     <h4 className="text-base font-bold text-text-dark">LOTE-2024-002</h4>
                     <p className="text-[10px] text-text-dark/40 italic">Unidade de Triagem PCE</p>
                   </div>

                   <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-brand-pink/20">
                      {[
                        { label: "Coleta Efetuada", desc: "Transporte Ivani", date: "26/04 - 15h", done: true },
                        { label: "Recebido na Central", desc: "Conferência física", date: "27/04 - 08h", done: true },
                        { label: "Triagem em Curso", desc: "Análise técnica", date: "Em curso", active: true },
                        { label: "Destino Definido", desc: "-", date: "Pendente", done: false },
                      ].map((step, i) => (
                        <div key={i} className="flex gap-4 relative">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-white ${
                            step.done ? 'bg-brand-cyan' : step.active ? 'bg-brand-yellow scale-110 shadow-lg' : 'bg-gray-100'
                          }`}>
                            {step.done && <CheckCircle2 size={12} className="text-white" />}
                            {step.active && <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />}
                          </div>
                          <div className="flex flex-col">
                            <span className={`text-xs font-bold ${!step.done && !step.active ? 'text-text-dark/30' : 'text-text-dark'}`}>{step.label}</span>
                            <span className="text-[9px] text-text-dark/50 font-medium">{step.desc}</span>
                            <span className="text-[8px] font-bold text-brand-cyan/60 uppercase mt-0.5">{step.date}</span>
                          </div>
                        </div>
                      ))}
                   </div>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === "operation" && (
            <motion.div key="operation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-24 text-center">
              <div className="w-16 h-16 bg-brand-cyan/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Settings className="text-brand-cyan" size={24} />
              </div>
              <h3 className="text-lg font-bold mb-2">Monitoramento Operacional Detalhado</h3>
              <p className="text-text-dark/40 text-sm max-w-sm mx-auto italic">Este módulo apresentará fotos reais da triagem e laudos técnicos de manutenção por lote PCE.</p>
            </motion.div>
          )}

          {activeTab === "financial" && (
            <motion.div key="financial" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-24 text-center">
               <div className="w-16 h-16 bg-brand-cyan/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <DollarSign className="text-brand-cyan" size={24} />
              </div>
              <h3 className="text-lg font-bold mb-2">Inteligência Financeira (ROI)</h3>
              <p className="text-text-dark/40 text-sm max-w-sm mx-auto italic">Acompanhe a economia real gerada pela logística reversa comparada ao custo de aquisição de pallets novos.</p>
            </motion.div>
          )}

          {activeTab === "environmental" && (
            <motion.div key="environmental" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-24 text-center">
               <div className="w-16 h-16 bg-brand-cyan/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Leaf className="text-brand-cyan" size={24} />
              </div>
              <h3 className="text-lg font-bold mb-2">Impacto Ambiental Estimado</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto">
                 {[
                   { label: "Madeira Estimada", value: "14.2 ton", icon: <Recycle /> },
                   { label: "Resíduos Evitados", value: "850 kg", icon: <Trash2 /> },
                   { label: "CO₂ Estimado", value: "4.8 ton", icon: <Wind /> },
                   { label: "Árvores Estimadas", value: "72 unid", icon: <Trees /> },
                 ].map((kpi, i) => (
                   <Card key={i} className="p-6">
                      <div className="flex justify-center mb-4 text-brand-cyan opacity-40">{kpi.icon}</div>
                      <div className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest mb-1">{kpi.label}</div>
                      <div className="text-2xl font-bold">{kpi.value}</div>
                   </Card>
                 ))}
              </div>
              <p className="text-text-dark/40 text-[10px] mt-10 italic uppercase font-bold tracking-widest leading-loose">
                * Todas as métricas acima são baseadas em cálculos de estimativa técnica.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Quick Access Sidebar / Footer Info */}
      <footer className="mt-20 py-8 border-t border-brand-pink/20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-text-dark/30">
            <Package size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">© 2024 Ivani Pallets — Portal PCE</span>
          </div>
          <div className="flex gap-6 text-[10px] font-bold text-text-dark/40 uppercase tracking-widest">
            <button className="hover:text-brand-cyan transition-colors">Termos de Uso</button>
            <button className="hover:text-brand-cyan transition-colors">Privacidade</button>
            <button className="hover:text-brand-cyan transition-colors">Suporte PCE</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
