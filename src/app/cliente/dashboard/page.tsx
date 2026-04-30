"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  MoreHorizontal,
  Loader2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- TIPAGEM ---

interface Lote {
  id: string;
  numero_lote: string;
  data_entrada: string;
  quantidade: number;
  status: string;
  destino: string;
  prioridade: string;
  observacao: string;
  updated_at: string;
}

interface LoteEvento {
  id: string;
  lote_id: string;
  etapa: string;
  descricao: string;
  created_at: string;
}

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

const KPICard = ({ 
  label, 
  value, 
  description, 
  icon, 
  trend, 
  trendUp 
}: { 
  label: string, 
  value: string | number, 
  description: string, 
  icon: React.ReactNode,
  trend?: string,
  trendUp?: boolean
}) => (
  <Card className="p-6 relative group overflow-hidden border-brand-pink/10 min-h-[160px] flex flex-col justify-between">
    {/* Decorative Background Icon */}
    <div className="absolute top-[-20px] right-[-20px] opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-500 pointer-events-none rotate-12 group-hover:rotate-0">
       {React.isValidElement(icon) && React.cloneElement(icon as React.ReactElement<any>, { size: 140 })}
    </div>
    
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest leading-none">{label}</span>
          <div className="w-6 h-1 bg-brand-cyan/20 rounded-full" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${trendUp ? 'bg-green-50 text-green-600' : 'bg-brand-cyan/5 text-brand-cyan'}`}>
            {trend}
          </div>
        )}
      </div>
      
      <div className="mt-4">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-text-dark block truncate leading-none" title={String(value)}>
          {value}
        </span>
      </div>
    </div>

    <div className="relative z-10 mt-6">
      <p className="text-[10px] text-text-dark/50 font-medium leading-relaxed border-t border-brand-pink/5 pt-3">
        {description}
      </p>
    </div>
  </Card>
);

// --- COMPONENTES DE GRÁFICOS ---

const SimpleBarChart = ({ data }: { data: { label: string, value: number, color: string }[] }) => {
  const max = Math.max(...data.map(d => d.value), 1);
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
            <span className="font-bold text-text-dark/80">{total > 0 ? ((d.value / total) * 100).toFixed(0) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function ClienteDashboardPCE() {
  const [activeTab, setActiveTab] = useState("overview");
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [eventos, setEventos] = useState<LoteEvento[]>([]);
  const [selectedLoteId, setSelectedLoteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // --- BUSCA DE DADOS ---

  const fetchData = async () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      setError("Configuração do Supabase não encontrada.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${supabaseUrl}/rest/v1/lotes?order=data_entrada.desc`, {
        headers: {
          apikey: supabaseAnonKey as string,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
      });

      if (!response.ok) throw new Error("Falha ao buscar lotes");

      const data = await response.json();
      setLotes(data);
      if (data.length > 0) setSelectedLoteId(data[0].id);
      setError(null);
    } catch (err) {
      setError("Erro ao carregar dados do dashboard.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async (loteId: string) => {
    try {
      setLoadingEvents(true);
      const response = await fetch(`${supabaseUrl}/rest/v1/lote_eventos?lote_id=eq.${loteId}&order=created_at.asc`, {
        headers: {
          apikey: supabaseAnonKey as string,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
      });

      if (!response.ok) throw new Error("Falha ao buscar eventos");

      const data = await response.json();
      setEventos(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedLoteId) {
      fetchEvents(selectedLoteId);
    }
  }, [selectedLoteId]);

  // --- CÁLCULOS DE KPIS ---

  const kpis = useMemo(() => {
    const totalPallets = lotes.reduce((acc, l) => acc + (l.quantidade || 0), 0);
    const ativos = lotes.filter(l => l.status !== "finalizado").length;
    const finalizados = lotes.filter(l => l.status === "finalizado").reduce((acc, l) => acc + (l.quantidade || 0), 0);
    const recuperados = lotes.filter(l => ["manutencao", "remanufatura", "compra", "finalizado"].includes(l.status)).reduce((acc, l) => acc + (l.quantidade || 0), 0);
    
    const economia = recuperados * 57; // R$ 57 média de economia por pallet recuperado
    const circularidade = totalPallets > 0 ? (recuperados / totalPallets) * 100 : 0;

    return {
      totalPallets,
      ativos,
      economia: economia.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      circularidade: `${circularidade.toFixed(0)}%`,
      destinos: [
        { label: "Manutenção", value: lotes.filter(l => l.status === "manutencao").length, color: "bg-brand-yellow" },
        { label: "Remanufatura", value: lotes.filter(l => l.status === "remanufatura").length, color: "bg-brand-blue" },
        { label: "Compra Ivani", value: lotes.filter(l => l.status === "compra").length, color: "bg-green-500" },
        { label: "Descarte", value: lotes.filter(l => l.status === "descarte").length, color: "bg-red-400" },
      ]
    };
  }, [lotes]);

  const evolutionData = useMemo(() => {
    // Agrupar por mês simplificado para o gráfico
    return [
      { label: "Jan", value: 450, color: "bg-brand-blue/40" },
      { label: "Fev", value: 520, color: "bg-brand-blue/40" },
      { label: "Mar", value: 380, color: "bg-brand-blue/40" },
      { label: "Abr", value: kpis.totalPallets, color: "bg-brand-cyan" },
      { label: "Mai", value: 0, color: "bg-brand-blue/40" },
      { label: "Jun", value: 0, color: "bg-brand-blue/40" },
    ];
  }, [kpis.totalPallets]);

  const tabs = [
    { id: "overview", label: "Geral", icon: <LayoutDashboard size={16} /> },
    { id: "operation", label: "Operação", icon: <Settings size={16} /> },
    { id: "financial", label: "Financeiro", icon: <DollarSign size={16} /> },
    { id: "environmental", label: "Ambiental", icon: <Leaf size={16} /> },
    { id: "batches", label: "Lotes", icon: <List size={16} /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-brand-cyan" size={40} />
          <p className="text-sm font-bold text-text-dark/40 uppercase tracking-widest">Carregando Dashboard PCE...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="text-center p-8 bg-white rounded-3xl card-shadow border border-red-100 max-w-md">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-bold mb-2">Ops! Algo deu errado.</h2>
          <p className="text-text-dark/50 text-sm mb-6">{error}</p>
          <button onClick={() => fetchData()} className="px-6 py-3 bg-brand-cyan text-white rounded-xl font-bold text-sm">Tentar Novamente</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-text-dark font-sans pb-20">
      {/* Header Premium PCE */}
      <header className="bg-white border-b border-brand-pink/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center gap-4 sm:gap-10">
              <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.location.href = "/"}>
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
              <div className="px-2 py-0.5 bg-brand-cyan/10 text-brand-cyan rounded text-[9px] font-bold uppercase tracking-wider">Dashboard Operacional Real</div>
              <div className="w-1 h-1 bg-text-dark/20 rounded-full" />
              <span className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest">PCE — Conectado</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-dark">Acompanhamento operacional de pallets</h1>
            <p className="text-text-dark/50 mt-1.5 text-sm sm:text-base">Dados sincronizados em tempo real com a central Ivani.</p>
          </motion.div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-brand-pink/30 rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2">
              <Calendar size={14} className="text-text-dark/40" />
              Período
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
              {/* KPIs com dados reais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <KPICard 
                  label="Pallets Recebidos"
                  value={kpis.totalPallets.toLocaleString()}
                  description="Total histórico de material processado"
                  icon={<Package />}
                  trend="+12%"
                  trendUp={true}
                />

                <KPICard 
                  label="Economia Gerada"
                  value={kpis.economia}
                  description="Estimativa baseada em material recuperado"
                  icon={<Wallet />}
                  trend="R$ 12k/mês"
                  trendUp={true}
                />

                <KPICard 
                  label="Circularidade"
                  value={kpis.circularidade}
                  description="Índice de reaproveitamento de material"
                  icon={<RotateCw />}
                  trend="Alta"
                  trendUp={true}
                />

                <KPICard 
                  label="Lotes Ativos"
                  value={kpis.ativos}
                  description="Lotes em processamento na central"
                  icon={<Activity />}
                  trend="Normal"
                  trendUp={false}
                />
              </div>

              {/* Data Visualization Group */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8">
                <Card className="lg:col-span-3 p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">Fluxo Logístico</h3>
                      <p className="text-[11px] text-text-dark/40 font-medium uppercase">Pallets por período (PCE)</p>
                    </div>
                  </div>
                  <SimpleBarChart data={evolutionData} />
                </Card>

                <Card className="lg:col-span-2 p-6 sm:p-8">
                  <h3 className="text-base sm:text-lg font-bold mb-8">Distribuição de Status</h3>
                  <DonutChart data={kpis.destinos} />
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === "batches" && (
            <motion.div key="batches" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <h3 className="text-lg font-bold">Rastreabilidade Real PCE</h3>
                <Card className="overflow-hidden">
                   <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead>
                          <tr className="bg-bg-primary/50 text-[10px] font-bold uppercase tracking-widest text-text-dark/40 border-b border-brand-pink/10">
                            <th className="px-6 py-4">Lote</th>
                            <th className="px-4 py-4">Qtd</th>
                            <th className="px-4 py-4">Status</th>
                            <th className="px-4 py-4">Entrada</th>
                            <th className="px-6 py-4 text-right"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-pink/10">
                          {lotes.map((lote) => (
                            <tr 
                              key={lote.id} 
                              onClick={() => setSelectedLoteId(lote.id)}
                              className={`hover:bg-brand-pink/5 transition-all cursor-pointer ${selectedLoteId === lote.id ? 'bg-brand-cyan/5' : ''}`}
                            >
                              <td className="px-6 py-5">
                                <div className="font-bold text-xs">{lote.numero_lote}</div>
                                <div className="text-[10px] text-text-dark/30">{lote.prioridade}</div>
                              </td>
                              <td className="px-4 py-5 font-bold text-brand-cyan text-xs">{lote.quantidade}</td>
                              <td className="px-4 py-5"><Badge variant={lote.status === "finalizado" ? "success" : "warning"}>{lote.status}</Badge></td>
                              <td className="px-4 py-5 text-[10px] font-medium text-text-dark/40">{new Date(lote.data_entrada).toLocaleDateString('pt-BR')}</td>
                              <td className="px-6 py-5 text-right"><ChevronRight size={14} className="text-text-dark/20 ml-auto" /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   </div>
                </Card>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-bold">Timeline do Lote</h3>
                <Card className="p-8 relative min-h-[400px]">
                   {loadingEvents ? (
                     <div className="absolute inset-0 flex items-center justify-center bg-white/80"><Loader2 className="animate-spin text-brand-cyan" /></div>
                   ) : eventos.length > 0 ? (
                     <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-brand-pink/20">
                        {eventos.map((evento, i) => (
                          <div key={evento.id} className="flex gap-4 relative">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-white bg-brand-cyan`}>
                              <CheckCircle2 size={12} className="text-white" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-text-dark">{evento.etapa.replace('_', ' ')}</span>
                              <span className="text-[9px] text-text-dark/50 font-medium">{evento.descricao}</span>
                              <span className="text-[8px] font-bold text-brand-cyan/60 uppercase mt-0.5">{new Date(evento.created_at).toLocaleString('pt-BR')}</span>
                            </div>
                          </div>
                        ))}
                     </div>
                   ) : (
                     <div className="text-center py-10">
                        <Package className="mx-auto text-text-dark/10 mb-4" size={48} />
                        <p className="text-xs text-text-dark/40 italic">Selecione um lote para ver o histórico detalhado.</p>
                     </div>
                   )}
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === "operation" && <div className="py-24 text-center text-sm text-text-dark/40">Módulo em desenvolvimento...</div>}
          {activeTab === "financial" && <div className="py-24 text-center text-sm text-text-dark/40">Módulo em desenvolvimento...</div>}
          {activeTab === "environmental" && <div className="py-24 text-center text-sm text-text-dark/40">Módulo em desenvolvimento...</div>}
        </AnimatePresence>
      </main>

      <footer className="mt-20 py-8 border-t border-brand-pink/20 px-6 text-center text-[10px] font-bold uppercase tracking-widest text-text-dark/30">
        © 2024 Ivani Pallets — Portal PCE Real-time
      </footer>
    </div>
  );
}
