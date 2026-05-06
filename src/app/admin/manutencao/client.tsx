"use client";

import React, { useState, useMemo } from "react";
import {
  Wrench, AlertCircle, CheckCircle2, Loader2, Search,
  Play, ChevronDown, Calendar, Clock, Package, Inbox,
  RefreshCw, Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { useRouter } from "next/navigation";
import { iniciarManutencao, concluirManutencao, sincronizarManutencoesPendentes } from "@/app/actions/manutencao";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModeloPallet { id: string; nome: string; codigo: string; medidas: string; }

interface Manutencao {
  id: string; triagem_id: string; modelo_nome_snapshot: string;
  tipo_servico: "reforma" | "remanufatura";
  quantidade: number; status: "pendente" | "em_andamento" | "concluida";
  data_entrada: string; data_inicio: string | null; data_conclusao: string | null;
  observacao?: string | null;
}

interface Props {
  initialManutencoes?: Manutencao[];
  initialModelos?: ModeloPallet[];
  serverError?: string | null;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AdminManutencaoClient({ 
  initialManutencoes = [], 
  initialModelos = [], 
  serverError = null 
}: Props) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Garantir que initialManutencoes é array e filtrar inválidos (quantidade 0 ou sem nome)
  const safeList = useMemo(() => {
    if (!Array.isArray(initialManutencoes)) return [];
    return initialManutencoes.filter(m => 
      m.quantidade > 0 && 
      m.modelo_nome_snapshot && 
      m.modelo_nome_snapshot !== "Modelo s/ Nome"
    );
  }, [initialManutencoes]);

  const filtered = useMemo(() => {
    return safeList.filter(m => {
      const name = m?.modelo_nome_snapshot?.toLowerCase() || "";
      const matchSearch = name.includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === "todos" || m.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [safeList, searchTerm, filterStatus]);

  async function handleAction(id: string, action: "iniciar" | "concluir") {
    setLoadingId(id);
    try {
      const res = action === "iniciar" ? await iniciarManutencao(id) : await concluirManutencao(id);
      if (!res.success) throw new Error(res.error);
      router.refresh();
    } catch (err: any) {
      alert("Erro: " + err.message);
    } finally {
      setLoadingId(null);
    }
  }

  async function handleSync() {
    setIsSyncing(true);
    try {
      const res = await sincronizarManutencoesPendentes();
      if (!res.success) throw new Error(res.error);
      
      const msg = `Sincronização concluída!\n\n` +
                  `Triagens verificadas: ${res.verificadas}\n` +
                  `Itens criados: ${res.criados}\n` +
                  (res.criados === 0 ? "\n(Nenhum item pendente ou triagens sem quantidades de reforma/remanufatura)" : "");
      
      alert(msg);
      router.refresh();
    } catch (err: any) {
      alert("Erro ao sincronizar: " + err.message);
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-text-dark pb-20">
      <AdminPageHeader title="Manutenção" subtitle="Ivani Pallets — Admin" icon={<Wrench size={18} />} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Painel de Reparos</h1>
            <p className="text-slate-500 text-sm mt-1">Gerencie itens em reforma ou remanufatura vindos da triagem.</p>
          </div>
          
          <button onClick={handleSync} disabled={isSyncing}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-brand-cyan/20 text-brand-cyan rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-brand-cyan/5 transition-all shadow-sm disabled:opacity-50">
            {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Sincronizar Triagens
          </button>
        </div>

        {serverError && (
          <div className="mb-6 bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle className="text-red-500 shrink-0" size={18} />
            <p className="text-sm text-red-700 font-medium">{serverError}</p>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dark/30 group-focus-within:text-brand-cyan transition-colors" size={18} />
            <input type="text" placeholder="Buscar modelo de pallet..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-brand-pink/20 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-brand-cyan/5 transition-all shadow-sm" />
          </div>
          
          <div className="relative min-w-[180px]">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="w-full appearance-none pl-4 pr-10 py-3 bg-white border border-brand-pink/20 rounded-2xl text-sm font-bold outline-none cursor-pointer focus:border-brand-cyan shadow-sm transition-all">
              <option value="todos">Todos Status</option>
              <option value="pendente">Pendentes</option>
              <option value="em_andamento">Iniciados</option>
              <option value="concluida">Concluídos</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dark/30 pointer-events-none" size={16} />
          </div>
        </div>

        {/* List/Table */}
        <div className="bg-white rounded-3xl border border-brand-pink/20 overflow-hidden shadow-sm">
          {filtered.length === 0 ? (
            <div className="py-32 text-center">
              <Inbox className="mx-auto text-text-dark/10 mb-4" size={64} />
              <h3 className="text-lg font-bold text-text-dark/40">Nenhum item em manutenção.</h3>
              <p className="text-sm text-text-dark/30 mt-1 italic">Conclua triagens para alimentar este painel.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-[#FAFAFA]">
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-text-dark/40">Modelo / Origem</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-text-dark/40 text-center">Quantidade</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-text-dark/40">Status / Tipo</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-text-dark/40 text-right">Ações Operacionais</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-pink/5">
                  <AnimatePresence>
                    {filtered.map((item) => (
                      <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-[#FAFAFA] transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-brand-cyan/5 flex items-center justify-center text-brand-cyan group-hover:scale-110 transition-transform">
                              <Package size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-800">{item.modelo_nome_snapshot}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Triagem #{item.triagem_id?.split('-')[0]}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className="text-lg font-black text-slate-700">{item.quantidade}</span>
                          <span className="text-[10px] font-bold text-slate-300 ml-1 uppercase">un</span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-2">
                            <span className={`w-fit px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border 
                              ${item.status === 'concluida' ? 'bg-green-50 text-green-700 border-green-200' : 
                                item.status === 'em_andamento' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                                'bg-amber-50 text-amber-700 border-amber-200'}`}>
                              {item.status}
                            </span>
                            <span className={`w-fit px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border 
                              ${item.tipo_servico === "reforma" ? "bg-amber-100/50 text-amber-800 border-amber-200" : "bg-purple-100/50 text-purple-800 border-purple-200"}`}>
                              {item.tipo_servico}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            {item.status === "pendente" && (
                              <button onClick={() => handleAction(item.id, "iniciar")} disabled={loadingId === item.id}
                                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50">
                                {loadingId === item.id ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />} Iniciar
                              </button>
                            )}
                            
                            {item.status === "em_andamento" && (
                              <button onClick={() => handleAction(item.id, "concluir")} disabled={loadingId === item.id}
                                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md shadow-green-200 hover:bg-green-700 transition-all disabled:opacity-50">
                                {loadingId === item.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Concluir
                              </button>
                            )}

                            {item.status === "concluida" && (
                              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-400 rounded-xl text-[9px] font-bold uppercase border border-slate-100">
                                <CheckCircle2 size={12} className="text-green-500" /> No Estoque
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
        </div>
      </main>
    </div>
  );
}
