"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Package, TrendingUp, CheckCircle2, Clock, Filter, Calendar, 
  Download, BarChart3, PieChart, Activity, ArrowLeft, Loader2, 
  AlertCircle, Leaf, Wind, Trees, Search, LayoutDashboard, 
  ChevronRight, Truck, Wrench, Layers, Recycle, LogOut,
  Target, Zap, Globe, FileText, ArrowUpRight, Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

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
  <div className="space-y-3 p-4 bg-[var(--ivani-bg)]/40 rounded-2xl border border-[var(--ivani-border)] hover:bg-white transition-all group">
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
         <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
         <span className="text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-widest">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-sm font-black text-[var(--ivani-text)]">{value.toLocaleString("pt-BR")}</span>
        <span className="text-[10px] font-bold text-[var(--ivani-muted)] opacity-60">({total > 0 ? ((value / total) * 100).toFixed(0) : 0}%)</span>
      </div>
    </div>
    <div className="h-2 w-full bg-[var(--ivani-border)] rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: total > 0 ? `${(value / total) * 100}%` : '0%' }}
        transition={{ duration: 1.2, ease: "circOut" }}
        className={`h-full ${color} shadow-[0_0_10px_-2px_rgba(0,0,0,0.1)]`}
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
    // Initial fetch handled by page component
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

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-8 border-b border-[var(--ivani-border)] relative">
        <div className="absolute bottom-[-1px] left-0 w-24 h-[2px] bg-[var(--ivani-teal)]" />
        <div className="relative">
          {/* Subtle Bic Pen Decoration */}
          <svg className="absolute -left-6 -top-6 w-12 h-12 text-[var(--ivani-teal)] opacity-40 pointer-events-none" viewBox="0 0 100 100">
             <path d="M5,50 Q45,5 95,50 T185,50" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
             <path d="M10,65 Q50,20 90,65 T170,65" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          </svg>
          
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--ivani-primary)] mb-2 opacity-80">Relatório Executivo</p>
          <h1 className="text-3xl font-black text-[var(--ivani-text)] tracking-tight">Performance Analítica</h1>
          <p className="text-sm text-[var(--ivani-muted)] mt-2 font-medium max-w-lg leading-relaxed">
            Consolidado de eficiência operacional e impacto sustentável gerado através da recuperação de pallets.
          </p>
        </div>
        
        <button className="group relative inline-flex items-center gap-3 px-6 py-3.5 bg-[var(--ivani-primary)] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest overflow-hidden transition-all hover:shadow-xl active:scale-[0.98]">
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Download size={16} />
          Exportar Relatório PDF
        </button>
      </div>

      {/* ── Filter Engine ────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="editorial-card p-6 mb-10 bg-white/50 backdrop-blur-sm border-[var(--ivani-border)]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={14} className="text-[var(--ivani-teal)]" />
              <label className="text-[9px] font-black uppercase text-[var(--ivani-muted)] tracking-widest">Período de Análise</label>
            </div>
            <div className="flex gap-2">
              <input type="date" onChange={(e) => setDateFilter(p => ({ ...p, start: e.target.value }))} className="flex-1 bg-white border border-[var(--ivani-border)] rounded-xl px-4 py-3 text-xs font-bold text-[var(--ivani-text)] outline-none focus:border-[var(--ivani-teal)] transition-all" />
              <input type="date" onChange={(e) => setDateFilter(p => ({ ...p, end: e.target.value }))} className="flex-1 bg-white border border-[var(--ivani-border)] rounded-xl px-4 py-3 text-xs font-bold text-[var(--ivani-text)] outline-none focus:border-[var(--ivani-teal)] transition-all" />
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Target size={14} className="text-[var(--ivani-blue)]" />
              <label className="text-[9px] font-black uppercase text-[var(--ivani-muted)] tracking-widest">Filtrar por Status</label>
            </div>
            <select onChange={(e) => setStatusFilter(e.target.value)} className="w-full bg-white border border-[var(--ivani-border)] rounded-xl px-4 py-3 text-xs font-bold text-[var(--ivani-text)] outline-none focus:border-[var(--ivani-blue)] transition-all appearance-none cursor-pointer">
              <option value="todos">Todos os Status</option>
              <option value="em_triagem">Em Triagem</option>
              <option value="classificada">Classificada</option>
              <option value="finalizada">Finalizada</option>
            </select>
          </div>

          <div className="flex items-end">
            <button onClick={() => fetchData()} className="w-full py-3.5 bg-[var(--ivani-bg)] border border-[var(--ivani-border)] text-[var(--ivani-primary)] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:border-[var(--ivani-primary)] transition-all flex items-center justify-center gap-2 active:scale-95">
              <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
              Sincronizar Inteligência
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── KPI Grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: "Volume Processado", value: stats.totalPallets, icon: <Layers />, color: "var(--ivani-primary)" },
          { label: "Pallets Recuperados", value: stats.reforma + stats.remanufatura, icon: <Recycle />, color: "var(--ivani-teal)" },
          { label: "Taxa de Reforma", value: stats.reforma, icon: <Wrench />, color: "#DD5C36" },
          { label: "Perda de Material", value: stats.sucata, icon: <AlertCircle />, color: "var(--ivani-text)" },
        ].map((kpi, idx) => (
          <motion.div 
            key={kpi.label} 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="editorial-card p-6 group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--ivani-bg)]/20 -mr-8 -mt-8 rounded-full group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10">
               <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ background: kpi.color }}>
                     {React.cloneElement(kpi.icon as React.ReactElement, { size: 18 } as any)}
                  </div>
                  <ArrowUpRight size={14} className="text-[var(--ivani-muted)] opacity-0 group-hover:opacity-40 transition-opacity" />
               </div>
               <p className="text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-widest mb-1">{kpi.label}</p>
               <p className="text-3xl font-black text-[var(--ivani-text)] tracking-tight">{kpi.value.toLocaleString("pt-BR")}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Distribuição Operacional */}
        <div className="lg:col-span-2 space-y-6">
          <div className="editorial-card p-8">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-xl font-black text-[var(--ivani-text)] tracking-tight">Eficiência de Recuperação</h3>
                <p className="text-[10px] text-[var(--ivani-muted)] font-black uppercase tracking-widest mt-1">Classificação por Destinação Pós-Triagem</p>
              </div>
              <div className="w-12 h-12 bg-[var(--ivani-bg)] rounded-2xl flex items-center justify-center text-[var(--ivani-muted)] hand-drawn-border">
                <BarChart3 size={24} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DistributionBar label="Reforma / Oficina" value={stats.reforma} total={stats.totalPallets} color="bg-[#DD5C36]" />
              <DistributionBar label="Remanufatura Direta" value={stats.remanufatura} total={stats.totalPallets} color="bg-[var(--ivani-teal)]" />
              <DistributionBar label="Compra Garantida" value={stats.compra} total={stats.totalPallets} color="bg-[var(--ivani-blue)]" />
              <DistributionBar label="Descarte / Sucata" value={stats.sucata} total={stats.totalPallets} color="bg-[var(--ivani-text)]" />
            </div>
          </div>
        </div>

        {/* ESG Indicator Block */}
        <div className="editorial-card p-8 bg-[var(--ivani-primary)] text-white border-none shadow-2xl shadow-[var(--ivani-primary)]/20 relative overflow-hidden">
          <div className="absolute bottom-0 right-0 p-8 opacity-10">
            <Trees size={120} />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-14 h-14 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-sm">
                <Leaf size={28} className="text-[var(--ivani-secondary)]" />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight">Ecometria</h3>
                <p className="text-[10px] text-white/50 font-black uppercase tracking-widest mt-1">Impacto Ambiental PCE</p>
              </div>
            </div>

            <div className="space-y-10">
              <div className="flex items-center gap-6 group">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-[var(--ivani-secondary)] group-hover:bg-[var(--ivani-secondary)] group-hover:text-[var(--ivani-primary)] transition-all duration-500">
                  <Trees size={28} />
                </div>
                <div>
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] block mb-1">Madeira Poupada</span>
                  <div className="text-3xl font-black flex items-baseline gap-2">
                    {stats.madeiraRecuperada}
                    <span className="text-sm font-bold opacity-40 uppercase">Ton</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 group">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-blue-300 group-hover:bg-blue-300 group-hover:text-[var(--ivani-primary)] transition-all duration-500">
                  <Wind size={28} />
                </div>
                <div>
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] block mb-1">Redução CO2</span>
                  <div className="text-3xl font-black flex items-baseline gap-2">
                    {stats.co2Evitado}
                    <span className="text-sm font-bold opacity-40 uppercase">Ton</span>
                  </div>
                </div>
              </div>

              <div className="pt-10 border-t border-white/10 mt-4">
                <div className="flex items-start gap-3">
                  <Info size={14} className="mt-1 opacity-40 shrink-0" />
                  <p className="text-[9px] text-white/40 font-bold tracking-wide italic leading-relaxed">
                    Estimativa calculada sobre 25kg de madeira e 15kg de CO2 por unidade recuperada.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Empty State ───────────────────────────────────────────────────── */}
      {filteredTriagens.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-24 editorial-card flex flex-col items-center bg-[var(--ivani-bg)]/30 border-dashed border-2">
           <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center text-[var(--ivani-muted)] mb-6 shadow-sm"><BarChart3 size={32} /></div>
           <h3 className="text-lg font-black text-[var(--ivani-text)] mb-2 uppercase tracking-tight">Sem dados analíticos</h3>
           <p className="text-sm text-[var(--ivani-muted)] font-medium">Ajuste os filtros de período para visualizar a performance.</p>
        </motion.div>
      )}
    </div>
  );
}

// ── Icons for helper components (refresh/plus etc) ──
function RefreshCcw({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}
