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
import { LoadingPage } from "@/components/ui/loading-screen";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

import { PageShell, KPIGrid, KPICard, AppCard, AppButton, StatusBadge, EmptyState } from "@/components/ui/tropical";

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

// --- COMPONENTES DE UI LOCAIS ---

const DistributionBar = ({ label, value, total, color }: any) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center text-[11px] font-bold">
      <span className="text-brand-indigo/60 uppercase">{label}</span>
      <span className="text-brand-indigo">{value} <span className="text-brand-indigo/30">({total > 0 ? ((value / total) * 100).toFixed(0) : 0}%)</span></span>
    </div>
    <div className="h-2 w-full bg-brand-indigo/5 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: total > 0 ? `${(value / total) * 100}%` : '0%' }}
        transition={{ duration: 1 }}
        className={`h-full ${color}`}
      />
    </div>
  </div>
);

interface AdminRelatoriosClientProps {
  initialTriagens: Triagem[];
}

export function AdminRelatoriosClient({ initialTriagens }: AdminRelatoriosClientProps) {
  const [triagens, setTriagens] = useState<Triagem[]>(initialTriagens);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [dateFilter, setDateFilter] = useState({ start: "", end: "" });
  const [statusFilter, setStatusFilter] = useState("todos");

  const supabase = createClient();

  const fetchData = async () => {
    try {
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
    }
  };

  useEffect(() => {
    // Initial fetch done by Server Component
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
    return <LoadingPage />;
  }

  return (
    <PageShell
      title="Dashboard de Performance"
      subtitle="Visão holística da operação e impacto ambiental."
      actions={
        <AppButton icon={<Download size={16} />}>
          Exportar Dados Completos
        </AppButton>
      }
    >
      {/* Filtros */}
      <AppCard className="mb-10 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-brand-indigo/50 flex items-center gap-2 tracking-widest">
              <Calendar size={14} className="text-brand-aqua" /> Período
            </label>
            <div className="flex gap-3">
              <input type="date" onChange={(e) => setDateFilter(p => ({ ...p, start: e.target.value }))} className="flex-1 bg-white border border-brand-indigo/10 rounded-xl px-4 py-3 text-xs font-bold text-brand-indigo outline-none focus:ring-2 focus:ring-brand-aqua/30 transition-all shadow-sm" />
              <input type="date" onChange={(e) => setDateFilter(p => ({ ...p, end: e.target.value }))} className="flex-1 bg-white border border-brand-indigo/10 rounded-xl px-4 py-3 text-xs font-bold text-brand-indigo outline-none focus:ring-2 focus:ring-brand-aqua/30 transition-all shadow-sm" />
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-brand-indigo/50 flex items-center gap-2 tracking-widest">
              <Activity size={14} className="text-brand-orange" /> Status da Triagem
            </label>
            <select onChange={(e) => setStatusFilter(e.target.value)} className="w-full bg-white border border-brand-indigo/10 rounded-xl px-4 py-3 text-xs font-bold text-brand-indigo outline-none focus:ring-2 focus:ring-brand-aqua/30 transition-all shadow-sm">
              <option value="todos">Todos os Status</option>
              <option value="em_triagem">Em Triagem</option>
              <option value="classificada">Classificada</option>
              <option value="finalizada">Finalizada</option>
            </select>
          </div>
          <div className="flex items-end">
            <AppButton onClick={() => fetchData()} variant="secondary" className="w-full" icon={<Recycle size={14} />}>
              Atualizar Inteligência
            </AppButton>
          </div>
        </div>
      </AppCard>

      {/* KPIs Principais */}
      <div className="mb-10">
        <KPIGrid>
          <KPICard title="Total de Pallets" value={stats.totalPallets} icon={<Layers size={20} />} description="Volume total processado" colorVariant="primary" />
          <KPICard title="Recuperação (Reforma)" value={stats.reforma} icon={<Wrench size={20} />} description="Pallets enviados para oficina" colorVariant="orange" />
          <KPICard title="Remanufatura" value={stats.remanufatura} icon={<Recycle size={20} />} description="Pallets reincorporados" colorVariant="floral" />
          <KPICard title="Taxa de Sucata" value={stats.sucata} icon={<AlertCircle size={20} />} description="Material descartado" colorVariant="indigo" />
        </KPIGrid>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Distribuição Operacional */}
        <AppCard className="lg:col-span-2">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-black text-brand-indigo">Eficiência de Triagem</h3>
              <p className="text-[10px] text-brand-indigo/40 font-bold uppercase tracking-widest mt-1">Distribuição por Categoria de Recuperação</p>
            </div>
            <div className="w-12 h-12 bg-brand-aqua/10 rounded-2xl flex items-center justify-center text-brand-aqua">
              <PieChart size={24} />
            </div>
          </div>
          <div className="space-y-6">
            <DistributionBar label="Reforma / Manutenção" value={stats.reforma} total={stats.totalPallets} color="bg-brand-orange" />
            <DistributionBar label="Remanufatura Direta" value={stats.remanufatura} total={stats.totalPallets} color="bg-brand-aqua" />
            <DistributionBar label="Compra pela Ivani" value={stats.compra} total={stats.totalPallets} color="bg-emerald-400" />
            <DistributionBar label="Sucata / Descarte" value={stats.sucata} total={stats.totalPallets} color="bg-brand-indigo" />
          </div>
        </AppCard>

        {/* Impacto Ambiental */}
        <AppCard className="bg-brand-floral/40 border-brand-floral">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
              <Leaf size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-brand-indigo">Eco-Impacto</h3>
              <p className="text-[10px] text-brand-indigo/40 font-bold uppercase tracking-widest mt-1">Contribuição Ambiental PCE</p>
            </div>
          </div>
          
          <div className="space-y-8">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-emerald-500 border border-emerald-50">
                <Trees size={24} />
              </div>
              <div>
                <span className="text-[10px] font-black text-brand-indigo/40 uppercase tracking-widest block mb-1">Madeira Recuperada</span>
                <div className="text-2xl font-black text-brand-indigo">{stats.madeiraRecuperada} <span className="text-sm font-bold text-brand-indigo/40 ml-1">Toneladas</span></div>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-blue-400 border border-blue-50">
                <Wind size={24} />
              </div>
              <div>
                <span className="text-[10px] font-black text-brand-indigo/40 uppercase tracking-widest block mb-1">CO2 Evitado</span>
                <div className="text-2xl font-black text-brand-indigo">{stats.co2Evitado} <span className="text-sm font-bold text-brand-indigo/40 ml-1">Toneladas</span></div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-brand-indigo/5">
              <p className="text-[10px] text-brand-indigo/40 font-bold tracking-wide italic leading-relaxed">
                * Cálculos baseados na economia média de 25kg de madeira virgem e 15kg de emissão de CO2 por pallet recuperado.
              </p>
            </div>
          </div>
        </AppCard>
      </div>
    </PageShell>
  );
}
