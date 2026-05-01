"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Package, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Calendar, 
  Download,
  BarChart3,
  PieChart,
  Activity,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Leaf,
  Wind,
  Trees,
  Search,
  LayoutDashboard,
  ChevronRight,
  Truck,
  Wrench,
  Layers,
  Recycle,
  LogOut
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { logout } from "@/app/actions/auth";

// --- TIPAGEM ---

interface Triagem {
  id: string;
  quantidade_total: number;
  quantidade_manutencao: number;
  quantidade_remanufatura: number;
  quantidade_compra_ivani: number;
  quantidade_sucata: number;
  status: string;
  data_coleta: string;
}

// --- COMPONENTES DE UI ---

const Badge = ({ children, variant = "default" }: { children: React.ReactNode, variant?: string }) => {
  const styles: Record<string, string> = {
    classificada: "bg-green-50 text-green-600 border-green-100",
    em_triagem: "bg-amber-50 text-amber-600 border-amber-100",
    finalizada: "bg-brand-cyan/5 text-brand-cyan border-brand-cyan/10",
    default: "bg-gray-100 text-gray-600 border-gray-200"
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${styles[variant] || styles.default}`}>
      {children}
    </span>
  );
};

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white rounded-3xl border border-brand-pink/20 shadow-sm ${className}`}>
    {children}
  </div>
);

const KPICard = ({ label, value, icon, description, color = "brand-cyan" }: any) => (
  <Card className="p-6 relative overflow-hidden group">
    <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${color}/5 rounded-full blur-2xl group-hover:bg-${color}/10 transition-all`} />
    <div className="relative z-10">
      <div className={`w-10 h-10 bg-${color}/10 rounded-xl flex items-center justify-center text-${color} mb-4`}>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest">{label}</span>
        <span className="text-2xl font-bold text-text-dark mt-1">{value}</span>
        <p className="text-[10px] text-text-dark/50 font-medium mt-2">{description}</p>
      </div>
    </div>
  </Card>
);

const DistributionBar = ({ label, value, total, color }: any) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center text-[11px] font-bold">
      <span className="text-text-dark/60 uppercase">{label}</span>
      <span className="text-text-dark">{value} <span className="text-text-dark/30">({total > 0 ? ((value / total) * 100).toFixed(0) : 0}%)</span></span>
    </div>
    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: total > 0 ? `${(value / total) * 100}%` : '0%' }}
        transition={{ duration: 1 }}
        className={`h-full ${color}`}
      />
    </div>
  </div>
);

export default function AdminRelatoriosPage() {
  const [triagens, setTriagens] = useState<Triagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [dateFilter, setDateFilter] = useState({ start: "", end: "" });
  const [statusFilter, setStatusFilter] = useState("todos");

  const supabase = createClient();

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("triagens")
        .select("*")
        .eq("cliente_id", "pce")
        .order("data_coleta", { ascending: false });

      if (fetchError) throw fetchError;
      setTriagens(data || []);
      setError(null);
    } catch (err) {
      setError("Falha ao carregar dados analíticos.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- FILTRAGEM ---

  const filteredTriagens = useMemo(() => {
    return triagens.filter(t => {
      const matchStatus = statusFilter === "todos" || t.status === statusFilter;
      
      const date = new Date(t.data_coleta);
      const start = dateFilter.start ? new Date(dateFilter.start) : null;
      const end = dateFilter.end ? new Date(dateFilter.end) : null;
      
      const matchStart = !start || date >= start;
      const matchEnd = !end || date <= end;

      return matchStatus && matchStart && matchEnd;
    });
  }, [triagens, statusFilter, dateFilter]);

  // --- CÁLCULOS ANALÍTICOS ---

  const stats = useMemo(() => {
    const totalCargas = filteredTriagens.length;
    const totalPallets = filteredTriagens.reduce((acc, t) => acc + (t.quantidade_total || 0), 0);
    
    // Classificações
    const reforma = filteredTriagens.reduce((acc, t) => acc + (t.quantidade_manutencao || 0), 0);
    const remanufatura = filteredTriagens.reduce((acc, t) => acc + (t.quantidade_remanufatura || 0), 0);
    const compra = filteredTriagens.reduce((acc, t) => acc + (t.quantidade_compra_ivani || 0), 0);
    const sucata = filteredTriagens.reduce((acc, t) => acc + (t.quantidade_sucata || 0), 0);

    // Status Distribuição
    const statusDist = filteredTriagens.reduce((acc: any, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {});

    // Indicadores Ambientais
    // Estimativas: 25kg madeira/pallet, 15kg CO2 evitado/pallet
    const totalRecuperado = reforma + remanufatura;
    const madeiraRecuperada = (totalRecuperado * 25) / 1000; // Toneladas
    const co2Evitado = (totalRecuperado * 15) / 1000; // Toneladas

    return {
      totalCargas,
      totalPallets,
      reforma,
      remanufatura,
      compra,
      sucata,
      statusDist,
      madeiraRecuperada: madeiraRecuperada.toFixed(1),
      co2Evitado: co2Evitado.toFixed(1)
    };
  }, [filteredTriagens]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-brand-cyan" size={40} />
          <p className="text-xs font-bold text-text-dark/40 uppercase tracking-widest">Processando Inteligência...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-text-dark font-sans pb-20">
      {/* Header */}
      <header className="bg-white border-b border-brand-pink/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center gap-4">
              <button onClick={() => window.history.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft size={18} className="text-text-dark/40" />
              </button>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-brand-cyan rounded-lg flex items-center justify-center">
                  <BarChart3 className="text-white" size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm leading-none text-brand-cyan">Relatórios Analíticos</span>
                  <span className="text-[10px] font-bold text-text-dark/30 uppercase tracking-tighter mt-0.5">Ivani Pallets — Admin Hub</span>
                </div>
              </div>

              {/* Menu de Navegação Admin */}
              <nav className="hidden md:flex items-center gap-1 ml-6">
                <Link href="/admin/coleta" className="px-4 py-2 text-text-dark/40 hover:text-text-dark/60 hover:bg-gray-50 rounded-lg text-xs font-bold transition-all">Coletas</Link>
                <Link href="/admin/triagem" className="px-4 py-2 text-text-dark/40 hover:text-text-dark/60 hover:bg-gray-50 rounded-lg text-xs font-bold transition-all">Triagem</Link>
                <Link href="/admin/manutencao" className="px-4 py-2 text-text-dark/40 hover:text-text-dark/60 hover:bg-gray-50 rounded-lg text-xs font-bold transition-all">Manutenção</Link>
                <Link href="/admin/estoque" className="px-4 py-2 text-text-dark/40 hover:text-text-dark/60 hover:bg-gray-50 rounded-lg text-xs font-bold transition-all">Estoque</Link>
                <Link href="/admin/faturamento" className="px-4 py-2 text-text-dark/40 hover:text-text-dark/60 hover:bg-gray-50 rounded-lg text-xs font-bold transition-all">Faturamento</Link>
                <Link href="/admin/configuracao" className="px-4 py-2 text-text-dark/40 hover:text-text-dark/60 hover:bg-gray-50 rounded-lg text-xs font-bold transition-all">Configuração</Link>
                <Link href="/admin/relatorios" className="px-4 py-2 bg-brand-cyan/5 text-brand-cyan rounded-lg text-xs font-bold transition-all">Relatórios</Link>
              </nav>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => logout()} className="p-2 text-text-dark/40 hover:text-red-500 transition-colors" title="Sair"><LogOut size={18} /></button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
           <div>
             <h1 className="text-2xl font-bold tracking-tight">Dashboard de Performance</h1>
             <p className="text-text-dark/50 text-sm mt-1">Visão holística da operação e impacto ambiental.</p>
           </div>
           <button className="flex items-center gap-2 px-6 py-3 bg-brand-cyan text-white rounded-2xl text-xs font-bold shadow-lg shadow-brand-cyan/20 hover:scale-[1.02] transition-all active:scale-95">
             <Download size={16} /> Exportar Dados Completos
           </button>
        </div>

        {/* Filtros */}
        <Card className="p-6 mb-10 bg-white/50 backdrop-blur-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-text-dark/40 flex items-center gap-2">
                <Calendar size={12} /> Período
              </label>
              <div className="flex gap-2">
                <input type="date" onChange={(e) => setDateFilter(p => ({ ...p, start: e.target.value }))} className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs" />
                <input type="date" onChange={(e) => setDateFilter(p => ({ ...p, end: e.target.value }))} className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-text-dark/40 flex items-center gap-2">
                <Activity size={12} /> Status da Triagem
              </label>
              <select onChange={(e) => setStatusFilter(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-brand-cyan/10">
                <option value="todos">Todos os Status</option>
                <option value="em_triagem">Em Triagem</option>
                <option value="classificada">Classificada</option>
                <option value="finalizada">Finalizada</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={() => fetchData()} className="w-full bg-gray-50 hover:bg-gray-100 text-text-dark/60 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-gray-100">
                <Recycle size={14} /> Atualizar Inteligência
              </button>
            </div>
          </div>
        </Card>

        {/* KPIs Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <KPICard label="Total de Pallets" value={stats.totalPallets} icon={<Layers size={20} />} description="Volume total processado" />
          <KPICard label="Recuperação (Reforma)" value={stats.reforma} icon={<Wrench size={20} />} description="Pallets enviados para oficina" color="amber-500" />
          <KPICard label="Remanufatura" value={stats.remanufatura} icon={<Recycle size={20} />} description="Pallets reincorporados" color="purple-500" />
          <KPICard label="Taxa de Sucata" value={stats.sucata} icon={<Recycle size={20} />} description="Material descartado" color="red-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Distribuição Operacional */}
          <Card className="p-8 lg:col-span-2">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-lg font-bold text-text-dark">Eficiência de Triagem</h3>
                <p className="text-[10px] text-text-dark/40 font-bold uppercase tracking-widest mt-1">Distribuição por Categoria de Recuperação</p>
              </div>
              <PieChart size={24} className="text-text-dark/10" />
            </div>
            <div className="space-y-6">
              <DistributionBar label="Reforma / Manutenção" value={stats.reforma} total={stats.totalPallets} color="bg-amber-400" />
              <DistributionBar label="Remanufatura Direta" value={stats.remanufatura} total={stats.totalPallets} color="bg-purple-400" />
              <DistributionBar label="Compra pela Ivani" value={stats.compra} total={stats.totalPallets} color="bg-brand-cyan" />
              <DistributionBar label="Sucata / Descarte" value={stats.sucata} total={stats.totalPallets} color="bg-red-400" />
            </div>
          </Card>

          {/* Impacto Ambiental */}
          <Card className="p-8 bg-brand-cyan/[0.02] border-brand-cyan/20">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-brand-cyan/10 rounded-2xl flex items-center justify-center text-brand-cyan">
                <Leaf size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-dark">Eco-Impacto</h3>
                <p className="text-[10px] text-text-dark/40 font-bold uppercase tracking-widest">Contribuição Ambiental PCE</p>
              </div>
            </div>
            
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-green-500 border border-green-50">
                  <Trees size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest block">Madeira Recuperada</span>
                  <div className="text-xl font-bold text-text-dark">{stats.madeiraRecuperada} <span className="text-xs font-medium opacity-40">Toneladas</span></div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-400 border border-blue-50">
                  <Wind size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest block">CO2 Evitado</span>
                  <div className="text-xl font-bold text-text-dark">{stats.co2Evitado} <span className="text-xs font-medium opacity-40">Toneladas</span></div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-brand-pink/10">
                <p className="text-[10px] text-text-dark/40 font-medium italic leading-relaxed">
                  * Cálculos baseados na economia média de 25kg de madeira virgem e 15kg de emissão de CO2 por pallet recuperado.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
