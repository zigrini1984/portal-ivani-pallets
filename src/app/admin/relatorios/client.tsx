"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Package, TrendingUp, CheckCircle2, Clock, Filter, Calendar, 
  Download, BarChart3, PieChart, Activity, ArrowLeft, Loader2, 
  AlertCircle, Leaf, Wind, Trees, Search, LayoutDashboard, 
  ChevronRight, Truck, Wrench, Layers, Recycle, LogOut,
  Target, Zap, Globe, FileText, ArrowUpRight, Info, RefreshCcw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { 
  BicPenBanner, 
  PremiumCard, 
  PremiumButton, 
  PremiumBadge 
} from "@/components/ui/editorial";

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
  <div className="space-y-3 p-6 bg-[var(--ivani-bg)]/40 rounded-[2rem] border border-[var(--ivani-border)]/50 hover:bg-white hover:shadow-lg transition-all group duration-500">
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
         <div className={`w-2 h-2 rounded-full ${color} shadow-sm`} />
         <span className="text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.2em] opacity-60">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-base font-black text-[var(--ivani-text)] tracking-tight">{value.toLocaleString("pt-BR")}</span>
        <span className="text-[10px] font-black text-[var(--ivani-muted)] opacity-30 uppercase tracking-widest">({total > 0 ? ((value / total) * 100).toFixed(0) : 0}%)</span>
      </div>
    </div>
    <div className="h-3 w-full bg-[var(--ivani-bg)] rounded-full overflow-hidden border border-[var(--ivani-border)]/20 p-0.5">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: total > 0 ? `${(value / total) * 100}%` : '0%' }}
        transition={{ duration: 1.5, ease: [0.34, 1.56, 0.64, 1] }}
        className={`h-full rounded-full ${color} shadow-inner opacity-80`}
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
  
  const [dateFilter, setDateFilter] = useState({ start: "", end: "" });
  const [statusFilter, setStatusFilter] = useState("todos");

  const supabase = createClient();

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("triagens")
        .select("id, coleta_id, cliente_id, nf_saida_pce, motorista, caminhao, data_coleta, quantidade_total, quantidade_sucata, quantidade_manutencao, quantidade_remanufatura, quantidade_compra_ivani, status, observacao, created_at")
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

  const stats = useMemo(() => {
    const totalCargas = filteredTriagens.length;
    const totalPallets = filteredTriagens.reduce((acc, t) => acc + (t.quantidade_total || 0), 0);
    const reforma = filteredTriagens.reduce((acc, t) => acc + (t.quantidade_manutencao || 0), 0);
    const remanufatura = filteredTriagens.reduce((acc, t) => acc + (t.quantidade_remanufatura || 0), 0);
    const compra = filteredTriagens.reduce((acc, t) => acc + (t.quantidade_compra_ivani || 0), 0);
    const sucata = filteredTriagens.reduce((acc, t) => acc + (t.quantidade_sucata || 0), 0);

    const totalRecuperado = reforma + remanufatura;
    const madeiraRecuperada = (totalRecuperado * 25) / 1000;
    const co2Evitado = (totalRecuperado * 15) / 1000;

    return {
      totalCargas,
      totalPallets,
      reforma,
      remanufatura,
      compra,
      sucata,
      madeiraRecuperada: madeiraRecuperada.toFixed(1),
      co2Evitado: co2Evitado.toFixed(1)
    };
  }, [filteredTriagens]);

  return (
    <div className="max-w-[1200px] mx-auto pb-20">
      <BicPenBanner 
        title="Relatórios Analíticos" 
        subtitle="Inteligência operacional e indicadores ESG transformados em decisões estratégicas."
        image="/branding/banner-relatorios.png"
        hueRotate="60deg"
      />

      <div className="flex justify-end mb-12">
        <PremiumButton 
          icon={<Download size={18} />}
          className="shadow-xl"
        >
          Exportar Inteligência PDF
        </PremiumButton>
      </div>

      <PremiumCard className="p-8 mb-12 bg-white/40 backdrop-blur-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-1">
              <Calendar size={16} className="text-[var(--ivani-teal)]" />
              <label className="text-[10px] font-black uppercase text-[var(--ivani-muted)] tracking-[0.2em] opacity-60">Período de Análise</label>
            </div>
            <div className="flex gap-3">
              <input type="date" onChange={(e) => setDateFilter(p => ({ ...p, start: e.target.value }))} className="input-premium py-3 text-[10px]" />
              <input type="date" onChange={(e) => setDateFilter(p => ({ ...p, end: e.target.value }))} className="input-premium py-3 text-[10px]" />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-1">
              <Target size={16} className="text-[var(--ivani-blue)]" />
              <label className="text-[10px] font-black uppercase text-[var(--ivani-muted)] tracking-[0.2em] opacity-60">Status de Operação</label>
            </div>
            <select onChange={(e) => setStatusFilter(e.target.value)} className="w-full bg-white border-2 border-[var(--ivani-border)]/50 rounded-2xl px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-[var(--ivani-text)] outline-none focus:border-[var(--ivani-primary)]/40 transition-all appearance-none cursor-pointer shadow-sm">
              <option value="todos">Todos os Registros</option>
              <option value="em_triagem">Em Triagem</option>
              <option value="classificada">Classificada</option>
              <option value="finalizada">Finalizada</option>
            </select>
          </div>

          <div className="flex items-end">
            <PremiumButton 
              variant="secondary"
              onClick={() => fetchData()} 
              loading={loading}
              icon={<RefreshCcw size={16} />}
              className="w-full"
            >
              Atualizar Dados
            </PremiumButton>
          </div>
        </div>
      </PremiumCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {[
          { label: "Volume Total", value: stats.totalPallets, icon: <Layers />, color: "var(--ivani-primary)" },
          { label: "Recuperados", value: stats.reforma + stats.remanufatura, icon: <Recycle />, color: "var(--ivani-teal)" },
          { label: "Oficina (Reforma)", value: stats.reforma, icon: <Wrench />, color: "#DD5C36" },
          { label: "Perda Técnica", value: stats.sucata, icon: <AlertCircle />, color: "var(--ivani-text)" },
        ].map((kpi, idx) => (
          <PremiumCard 
            key={kpi.label} 
            className="p-8 group relative overflow-hidden transition-all duration-500 hover:shadow-2xl"
          >
            <div className="relative z-10">
               <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-500" style={{ background: kpi.color }}>
                     {React.cloneElement(kpi.icon as React.ReactElement, { size: 20 } as any)}
                  </div>
                  <ArrowUpRight size={14} className="text-[var(--ivani-muted)] opacity-20 group-hover:opacity-60 transition-opacity" />
               </div>
               <p className="text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.2em] mb-2 opacity-60">{kpi.label}</p>
               <p className="text-4xl font-black text-[var(--ivani-text)] tracking-tighter">{kpi.value.toLocaleString("pt-BR")}</p>
            </div>
            <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-[var(--ivani-bg)] rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-700" />
          </PremiumCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12">
        <div className="lg:col-span-2 space-y-8">
          <PremiumCard className="p-10">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h3 className="text-2xl font-black text-[var(--ivani-text)] tracking-tighter">Eficiência de Ciclo</h3>
                <p className="text-[10px] text-[var(--ivani-muted)] font-black uppercase tracking-[0.3em] mt-2 opacity-50">Classificação Pós-Processamento</p>
              </div>
              <div className="w-14 h-14 bg-[var(--ivani-bg)] rounded-2xl flex items-center justify-center text-[var(--ivani-muted)] hand-drawn-border opacity-40">
                <BarChart3 size={28} strokeWidth={1.5} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <DistributionBar label="Reforma Técnica" value={stats.reforma} total={stats.totalPallets} color="bg-[#DD5C36]" />
              <DistributionBar label="Remanufatura" value={stats.remanufatura} total={stats.totalPallets} color="bg-[var(--ivani-teal)]" />
              <DistributionBar label="Compra Direta" value={stats.compra} total={stats.totalPallets} color="bg-[var(--ivani-blue)]" />
              <DistributionBar label="Perda / Sucata" value={stats.sucata} total={stats.totalPallets} color="bg-[var(--ivani-text)]" />
            </div>
          </PremiumCard>
        </div>

        <PremiumCard className="p-10 bg-[var(--ivani-primary)] text-white border-none shadow-3xl shadow-[var(--ivani-primary)]/30 relative overflow-hidden">
          <div className="absolute -bottom-10 -right-10 p-10 opacity-10">
            <Trees size={240} />
          </div>
          
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-5 mb-14">
              <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md shadow-inner">
                <Leaf size={32} className="text-[var(--ivani-secondary)]" />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight">Ecometria</h3>
                <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] mt-1">Impacto Ambiental PCE</p>
              </div>
            </div>

            <div className="space-y-12 flex-1">
              <div className="flex items-center gap-8 group">
                <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center text-[var(--ivani-secondary)] group-hover:bg-[var(--ivani-secondary)] group-hover:text-[var(--ivani-primary)] transition-all duration-700 shadow-sm border border-white/5">
                  <Trees size={32} />
                </div>
                <div>
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] block mb-2">Madeira Poupada</span>
                  <div className="text-4xl font-black flex items-baseline gap-2 tracking-tighter">
                    {stats.madeiraRecuperada}
                    <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">Tons</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8 group">
                <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center text-blue-300 group-hover:bg-blue-300 group-hover:text-[var(--ivani-primary)] transition-all duration-700 shadow-sm border border-white/5">
                  <Wind size={32} />
                </div>
                <div>
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] block mb-2">Carbono Evitado</span>
                  <div className="text-4xl font-black flex items-baseline gap-2 tracking-tighter">
                    {stats.co2Evitado}
                    <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">Tons</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-12 border-t border-white/10 mt-12">
              <div className="flex items-start gap-4">
                <Info size={16} className="mt-1 opacity-20 shrink-0" />
                <p className="text-[10px] text-white/30 font-bold tracking-wide italic leading-relaxed">
                  Cálculos normatizados baseados em 25kg de madeira e 15kg de CO2 compensado por unidade recuperada.
                </p>
              </div>
            </div>
          </div>
        </PremiumCard>
      </div>

      <AnimatePresence>
        {filteredTriagens.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-32 editorial-card flex flex-col items-center bg-[var(--ivani-bg)]/20 border-dashed border-2 opacity-50">
             <div className="w-24 h-24 rounded-[2.5rem] bg-white flex items-center justify-center text-[var(--ivani-muted)] mb-8 shadow-sm opacity-40">
                <BarChart3 size={40} strokeWidth={1.5} />
             </div>
             <h3 className="text-xl font-black text-[var(--ivani-text)] mb-3 tracking-tighter">Massa de dados insuficiente</h3>
             <p className="text-sm text-[var(--ivani-muted)] font-medium max-w-sm text-center">Tente expandir o intervalo de datas nos filtros para consolidar os indicadores operacionais.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
