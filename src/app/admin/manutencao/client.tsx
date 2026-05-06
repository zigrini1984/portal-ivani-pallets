"use client";

import React, { useState, useMemo } from "react";
import {
  Wrench, AlertCircle, CheckCircle2, Loader2, Search,
  Filter, Play, Check, ChevronDown, Calendar,
  Clock, Package, ArrowUpRight, Inbox
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { useRouter } from "next/navigation";
import { iniciarManutencao, concluirManutencao } from "@/app/actions/manutencao";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModeloPallet { id: string; nome: string; codigo: string; medidas: string; }

interface Manutencao {
  id: string; triagem_id: string; coleta_id: string; cliente_id: string;
  modelo_id: string; modelo_nome_snapshot: string;
  tipo_servico: "reforma" | "remanufatura";
  quantidade: number; status: "pendente" | "em_andamento" | "concluida";
  data_entrada: string; data_inicio: string | null; data_conclusao: string | null;
  observacao: string | null; created_at: string;
}

interface Props {
  initialManutencoes: Manutencao[];
  initialModelos: ModeloPallet[];
  serverError?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(v: string | null) {
  if (!v) return "—";
  try { return new Intl.DateTimeFormat("pt-BR", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(v)); } catch { return v; }
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pendente:     { label: "Pendente",     cls: "bg-amber-50 text-amber-700 border-amber-200" },
    em_andamento: { label: "Iniciado",     cls: "bg-blue-50 text-blue-700 border-blue-200" },
    concluida:    { label: "Concluída",    cls: "bg-green-50 text-green-700 border-green-200" },
  };
  const c = map[status] ?? map["pendente"];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${c.cls}`}>
      {c.label}
    </span>
  );
}

function ServiceTypeBadge({ type }: { type: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border 
      ${type === "reforma" ? "bg-amber-100/50 text-amber-800 border-amber-200" : "bg-purple-100/50 text-purple-800 border-purple-200"}`}>
      {type}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AdminManutencaoClient({ initialManutencoes, initialModelos, serverError }: Props) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [filterType, setFilterType] = useState<string>("todos");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Filtered list
  const filtered = useMemo(() => {
    return initialManutencoes.filter(m => {
      const matchSearch = m.modelo_nome_snapshot.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === "todos" || m.status === filterStatus;
      const matchType   = filterType === "todos" || m.tipo_servico === filterType;
      return matchSearch && matchStatus && matchType;
    });
  }, [initialManutencoes, searchTerm, filterStatus, filterType]);

  // KPIs
  const kpis = useMemo(() => ({
    pendentes: initialManutencoes.filter(m => m.status === "pendente").reduce((a, b) => a + b.quantidade, 0),
    emAndamento: initialManutencoes.filter(m => m.status === "em_andamento").reduce((a, b) => a + b.quantidade, 0),
    concluidos: initialManutencoes.filter(m => m.status === "concluida").reduce((a, b) => a + b.quantidade, 0),
    total: initialManutencoes.reduce((a, b) => a + b.quantidade, 0)
  }), [initialManutencoes]);

  async function handleAction(id: string, action: "iniciar" | "concluir") {
    setLoadingId(id);
    try {
      const res = action === "iniciar" ? await iniciarManutencao(id) : await concluirManutencao(id);
      if (!res.success) throw new Error(res.error);
      router.refresh();
    } catch (err: any) {
      alert("Erro ao processar ação: " + err.message);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-text-dark pb-20">
      <AdminPageHeader title="Manutenção" subtitle="Ivani Pallets — Admin" icon={<Wrench size={18} />} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
        
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Painel de Reparos</h1>
          <p className="text-text-dark/50 text-sm mt-1">Controle de reforma e remanufatura. Itens concluídos entram automaticamente no estoque.</p>
        </div>

        {/* Error Alert */}
        {serverError && (
          <div className="mb-6 bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle className="text-red-500 shrink-0" size={18} />
            <p className="text-sm text-red-700">{serverError}</p>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Pendentes", value: kpis.pendentes, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", icon: <Clock size={14} /> },
            { label: "Em Andamento", value: kpis.emAndamento, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", icon: <Play size={14} /> },
            { label: "Concluídos", value: kpis.concluidos, color: "text-green-600", bg: "bg-green-50", border: "border-green-100", icon: <CheckCircle2 size={14} /> },
            { label: "Total Geral", value: kpis.total, color: "text-brand-cyan", bg: "bg-brand-cyan/5", border: "border-brand-cyan/10", icon: <Package size={14} /> },
          ].map(card => (
            <div key={card.label} className={`bg-white rounded-2xl border ${card.border} p-5 shadow-sm`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`${card.color} opacity-40`}>{card.icon}</span>
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-dark/40">{card.label}</p>
              </div>
              <p className={`text-2xl font-black ${card.color}`}>{card.value.toLocaleString("pt-BR")}<span className="text-[10px] font-normal ml-1 text-text-dark/20">un</span></p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dark/30 group-focus-within:text-brand-cyan transition-colors" size={18} />
            <input type="text" placeholder="Buscar por modelo de pallet..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-brand-pink/20 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-brand-cyan/5 focus:border-brand-cyan transition-all shadow-sm" />
          </div>
          
          <div className="flex gap-2">
            <div className="relative min-w-[140px]">
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="w-full appearance-none pl-4 pr-10 py-3 bg-white border border-brand-pink/20 rounded-2xl text-sm font-bold outline-none cursor-pointer focus:border-brand-cyan shadow-sm transition-all">
                <option value="todos">Todos Status</option>
                <option value="pendente">Pendentes</option>
                <option value="em_andamento">Iniciados</option>
                <option value="concluida">Concluídos</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dark/30 pointer-events-none" size={16} />
            </div>

            <div className="relative min-w-[140px]">
              <select value={filterType} onChange={e => setFilterType(e.target.value)}
                className="w-full appearance-none pl-4 pr-10 py-3 bg-white border border-brand-pink/20 rounded-2xl text-sm font-bold outline-none cursor-pointer focus:border-brand-cyan shadow-sm transition-all">
                <option value="todos">Todos Serviços</option>
                <option value="reforma">Reforma</option>
                <option value="remanufatura">Remanufatura</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dark/30 pointer-events-none" size={16} />
            </div>
          </div>
        </div>

        {/* List/Table */}
        <div className="bg-white rounded-3xl border border-brand-pink/20 overflow-hidden shadow-sm">
          {filtered.length === 0 ? (
            <div className="py-32 text-center">
              <Inbox className="mx-auto text-text-dark/10 mb-4" size={64} />
              <h3 className="text-lg font-bold text-text-dark/40">Nenhum item encontrado</h3>
              <p className="text-sm text-text-dark/30 mt-1">Ajuste os filtros ou verifique se há triagens finalizadas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-[#FAFAFA]">
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-text-dark/40">Modelo de Pallet</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-text-dark/40">Tipo / Qtd</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-text-dark/40">Status</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-text-dark/40">Datas</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-text-dark/40 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-pink/5">
                  <AnimatePresence>
                    {filtered.map((item, i) => (
                      <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="hover:bg-[#FAFAFA] transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-brand-cyan/5 flex items-center justify-center text-brand-cyan group-hover:scale-110 transition-transform">
                              <Package size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-text-dark">{item.modelo_nome_snapshot}</p>
                              <p className="text-[10px] text-text-dark/40 mt-0.5 uppercase tracking-tighter">Origem: Triagem #{item.triagem_id?.split('-')[0] || '?'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1.5">
                            <ServiceTypeBadge type={item.tipo_servico} />
                            <p className="text-sm font-black text-text-dark">{item.quantidade}<span className="text-[10px] font-normal text-text-dark/30 ml-1">unidades</span></p>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-6 py-5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-[10px] text-text-dark/40">
                              <Calendar size={10} /> <span>Entrada: {fmtDate(item.data_entrada)}</span>
                            </div>
                            {item.data_inicio && (
                              <div className="flex items-center gap-2 text-[10px] text-blue-600/60">
                                <Play size={10} /> <span>Início: {fmtDate(item.data_inicio)}</span>
                              </div>
                            )}
                            {item.data_conclusao && (
                              <div className="flex items-center gap-2 text-[10px] text-green-600/60">
                                <Check size={10} /> <span>Fim: {fmtDate(item.data_conclusao)}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-2">
                            {item.status === "pendente" && (
                              <button onClick={() => handleAction(item.id, "iniciar")} disabled={loadingId === item.id}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all disabled:opacity-50">
                                {loadingId === item.id ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />} Iniciar
                              </button>
                            )}
                            
                            {item.status === "em_andamento" && (
                              <button onClick={() => handleAction(item.id, "concluir")} disabled={loadingId === item.id}
                                className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-100 transition-all shadow-sm shadow-green-100/50 disabled:opacity-50">
                                {loadingId === item.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Concluir & Estoque
                              </button>
                            )}

                            {item.status === "concluida" && (
                              <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 text-gray-400 rounded-xl text-[9px] font-bold uppercase border border-gray-100">
                                <ArrowUpRight size={12} /> Enviado ao Estoque
                              </div>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
          
          <div className="px-6 py-4 border-t border-brand-pink/5 bg-[#FAFAFA]/50 rounded-b-3xl flex justify-between items-center">
            <p className="text-[10px] font-bold text-text-dark/30 uppercase tracking-widest">{filtered.length} registros exibidos</p>
            <p className="text-[10px] font-bold text-brand-cyan uppercase tracking-widest">Sincronizado com Estoque PCE</p>
          </div>
        </div>
      </main>
    </div>
  );
}
