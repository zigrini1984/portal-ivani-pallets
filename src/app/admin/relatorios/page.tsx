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
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

// --- TIPAGEM ---

interface Lote {
  id: string;
  numero_lote: string;
  data_entrada: string;
  quantidade: number;
  status: string;
  destino: string;
  observacao: string;
  cliente_id: string;
}

// --- COMPONENTES DE UI ---

const Badge = ({ children, variant = "default" }: { children: React.ReactNode, variant?: string }) => {
  const styles: Record<string, string> = {
    triagem: "bg-blue-50 text-blue-600 border-blue-100",
    manutencao: "bg-amber-50 text-amber-600 border-amber-100",
    remanufatura: "bg-purple-50 text-purple-600 border-purple-100",
    descarte: "bg-red-50 text-red-600 border-red-100",
    compra: "bg-green-50 text-green-600 border-green-100",
    finalizado: "bg-brand-cyan/5 text-brand-cyan border-brand-cyan/10",
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
      <span className="text-text-dark">{value} <span className="text-text-dark/30">({((value / total) * 100).toFixed(0)}%)</span></span>
    </div>
    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${(value / total) * 100}%` }}
        transition={{ duration: 1 }}
        className={`h-full ${color}`}
      />
    </div>
  </div>
);

export default function AdminRelatoriosPage() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [dateFilter, setDateFilter] = useState({ start: "", end: "" });
  const [statusFilter, setStatusFilter] = useState("todos");
  const [destinoFilter, setDestinoFilter] = useState("todos");

  const supabase = createClient();

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("lotes")
        .select("*")
        .order("data_entrada", { ascending: false });

      if (fetchError) throw fetchError;
      setLotes(data || []);
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

  const filteredLotes = useMemo(() => {
    return lotes.filter(lote => {
      const matchStatus = statusFilter === "todos" || lote.status === statusFilter;
      const matchDestino = destinoFilter === "todos" || lote.destino === destinoFilter;
      
      const date = new Date(lote.data_entrada);
      const start = dateFilter.start ? new Date(dateFilter.start) : null;
      const end = dateFilter.end ? new Date(dateFilter.end) : null;
      
      const matchStart = !start || date >= start;
      const matchEnd = !end || date <= end;

      return matchStatus && matchDestino && matchStart && matchEnd;
    });
  }, [lotes, statusFilter, destinoFilter, dateFilter]);

  // --- CÁLCULOS ANALÍTICOS ---

  const stats = useMemo(() => {
    const totalLotes = filteredLotes.length;
    const totalPallets = filteredLotes.reduce((acc, l) => acc + (l.quantidade || 0), 0);
    const ativos = filteredLotes.filter(l => l.status !== "finalizado").length;
    const finalizados = filteredLotes.filter(l => l.status === "finalizado").length;

    // Distribuição Status
    const statusDist = filteredLotes.reduce((acc: any, l) => {
      acc[l.status] = (acc[l.status] || 0) + 1;
      return acc;
    }, {});

    // Distribuição Destino
    const destinoDist = filteredLotes.reduce((acc: any, l) => {
      acc[l.destino] = (acc[l.destino] || 0) + 1;
      return acc;
    }, {});

    // Pallets por Destino
    const palletsPorDestino = filteredLotes.reduce((acc: any, l) => {
      acc[l.destino] = (acc[l.destino] || 0) + l.quantidade;
      return acc;
    }, {});

    // Indicadores Ambientais
    // Estimativas: 25kg madeira/pallet, 15kg CO2 evitado/pallet
    const madeiraRecuperada = (totalPallets * 25) / 1000; // Toneladas
    const co2Evitado = (totalPallets * 15) / 1000; // Toneladas

    return {
      totalLotes,
      totalPallets,
      ativos,
      finalizados,
      statusDist,
      destinoDist,
      palletsPorDestino,
      madeiraRecuperada: madeiraRecuperada.toFixed(1),
      co2Evitado: co2Evitado.toFixed(1)
    };
  }, [filteredLotes]);

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
              <Link href="/admin/lotes" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft size={18} className="text-text-dark/40" />
              </Link>
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
                <Link href="/admin/lotes" className="px-4 py-2 text-text-dark/40 hover:text-text-dark/60 hover:bg-gray-50 rounded-lg text-xs font-bold transition-all">Lotes</Link>
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
              <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white border border-brand-pink/30 rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all">
                <Download size={14} className="text-text-dark/40" />
                Exportar CSV
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
        {/* Filtros */}
        <div className="bg-white p-6 rounded-3xl border border-brand-pink/20 shadow-sm mb-10">
          <div className="flex items-center gap-2 mb-6">
            <Filter size={16} className="text-brand-cyan" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-text-dark/60">Filtros Avançados</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-text-dark/40 ml-1">Período (Início)</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dark/30" size={14} />
                <input 
                  type="date"
                  onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan transition-all outline-none"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-text-dark/40 ml-1">Período (Fim)</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dark/30" size={14} />
                <input 
                  type="date"
                  onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan transition-all outline-none"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-text-dark/40 ml-1">Status</label>
              <select 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan transition-all outline-none appearance-none"
              >
                <option value="todos">Todos os Status</option>
                <option value="triagem">Triagem</option>
                <option value="manutencao">Manutenção</option>
                <option value="remanufatura">Remanufatura</option>
                <option value="compra">Compra</option>
                <option value="descarte">Descarte</option>
                <option value="finalizado">Finalizado</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-text-dark/40 ml-1">Destino</label>
              <select 
                onChange={(e) => setDestinoFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan transition-all outline-none appearance-none"
              >
                <option value="todos">Todos os Destinos</option>
                <option value="A definir">A definir</option>
                <option value="manutencao">Manutenção</option>
                <option value="remanufatura">Remanufatura</option>
                <option value="compra">Compra</option>
                <option value="descarte">Descarte</option>
              </select>
            </div>
          </div>
        </div>

        {/* KPIs Analíticos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <KPICard 
            label="Volume de Lotes"
            value={stats.totalLotes}
            description="Total processado no período"
            icon={<BarChart3 size={20} />}
            color="brand-cyan"
          />
          <KPICard 
            label="Total de Pallets"
            value={stats.totalPallets.toLocaleString()}
            description="Unidades físicas movimentadas"
            icon={<Package size={20} />}
            color="brand-blue"
          />
          <KPICard 
            label="Processamento Ativo"
            value={stats.ativos}
            description="Lotes pendentes de finalização"
            icon={<Activity size={20} />}
            color="brand-yellow"
          />
          <KPICard 
            label="Ciclos Finalizados"
            value={stats.finalizados}
            description="Eficiência operacional (concluídos)"
            icon={<CheckCircle2 size={20} />}
            color="green-500"
          />
        </div>

        {/* Gráficos e Distribuições */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
          <Card className="p-8">
            <h3 className="text-base font-bold mb-8 flex items-center gap-2">
              <PieChart size={18} className="text-brand-cyan" />
              Distribuição por Status
            </h3>
            <div className="space-y-6">
              {Object.entries(stats.statusDist).map(([label, value]: any) => (
                <DistributionBar 
                  key={label}
                  label={label}
                  value={value}
                  total={stats.totalLotes}
                  color={label === 'finalizado' ? 'bg-green-500' : 'bg-brand-cyan'}
                />
              ))}
              {Object.keys(stats.statusDist).length === 0 && (
                <p className="text-center py-10 text-xs text-text-dark/30 italic">Nenhum dado disponível.</p>
              )}
            </div>
          </Card>

          <Card className="p-8">
            <h3 className="text-base font-bold mb-8 flex items-center gap-2">
              <TrendingUp size={18} className="text-brand-cyan" />
              Pallets por Destino
            </h3>
            <div className="space-y-6">
              {Object.entries(stats.palletsPorDestino).map(([label, value]: any) => (
                <DistributionBar 
                  key={label}
                  label={label}
                  value={value}
                  total={stats.totalPallets}
                  color="bg-brand-blue"
                />
              ))}
              {Object.keys(stats.palletsPorDestino).length === 0 && (
                <p className="text-center py-10 text-xs text-text-dark/30 italic">Nenhum dado disponível.</p>
              )}
            </div>
          </Card>
        </div>

        {/* Indicadores Ambientais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mb-10">
          <Card className="p-8 bg-green-50/30 border-green-100 flex items-center gap-6 group hover:bg-green-50 transition-all">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 shadow-sm">
              <Trees size={32} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-green-600/60 uppercase tracking-widest">Madeira Recuperada</span>
              <div className="text-3xl font-bold text-green-700">{stats.madeiraRecuperada}t</div>
              <p className="text-[10px] text-green-600/40 font-medium mt-1">Recursos naturais preservados (estimativa)</p>
            </div>
          </Card>

          <Card className="p-8 bg-blue-50/30 border-blue-100 flex items-center gap-6 group hover:bg-blue-50 transition-all">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
              <Wind size={32} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-blue-600/60 uppercase tracking-widest">CO₂ Evitado</span>
              <div className="text-3xl font-bold text-blue-700">{stats.co2Evitado}t</div>
              <p className="text-[10px] text-blue-600/40 font-medium mt-1">Redução na pegada de carbono (estimativa)</p>
            </div>
          </Card>
        </div>

        {/* Tabela Resumida */}
        <Card className="overflow-hidden">
          <div className="px-8 py-6 border-b border-brand-pink/10 flex justify-between items-center bg-white">
            <h3 className="font-bold text-base">Resumo de Atividades</h3>
            <span className="px-3 py-1 bg-gray-50 text-[10px] font-bold text-text-dark/40 rounded-full">
              {filteredLotes.length} registros encontrados
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-bg-primary/50 text-[10px] font-bold uppercase tracking-widest text-text-dark/40 border-b border-brand-pink/10">
                  <th className="px-8 py-4">Lote</th>
                  <th className="px-6 py-4 text-center">Entrada</th>
                  <th className="px-6 py-4 text-center">Qtd</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Destino</th>
                  <th className="px-8 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-pink/10">
                {filteredLotes.slice(0, 15).map((lote) => (
                  <tr key={lote.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-4 font-bold text-xs">{lote.numero_lote}</td>
                    <td className="px-6 py-4 text-center text-[10px] font-medium text-text-dark/40">
                      {new Date(lote.data_entrada).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-brand-cyan text-xs">{lote.quantidade}</td>
                    <td className="px-6 py-4"><Badge variant={lote.status}>{lote.status}</Badge></td>
                    <td className="px-6 py-4 text-[10px] font-bold text-text-dark/50 uppercase">{lote.destino}</td>
                    <td className="px-8 py-4 text-right">
                      <ChevronRight size={14} className="text-text-dark/20 ml-auto" />
                    </td>
                  </tr>
                ))}
                {filteredLotes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center text-xs text-text-dark/30 italic">
                      Nenhum registro encontrado com os filtros atuais.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}
