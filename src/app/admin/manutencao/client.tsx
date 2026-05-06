"use client";

import React, { useState, useMemo } from "react";
import {
  Wrench, AlertCircle, CheckCircle2, Loader2, Search,
  Play, ChevronDown, Calendar, Clock, Package, Inbox
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { useRouter } from "next/navigation";
import { iniciarManutencao, concluirManutencao } from "@/app/actions/manutencao";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModeloPallet { id: string; nome: string; codigo: string; medidas: string; }

interface Manutencao {
  id: string; modelo_nome_snapshot: string;
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

  // Garantir que initialManutencoes é array
  const safeList = Array.isArray(initialManutencoes) ? initialManutencoes : [];

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

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-text-dark pb-20">
      <AdminPageHeader title="Manutenção" subtitle="Ivani Pallets — Admin" icon={<Wrench size={18} />} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Painel de Reparos</h1>
          <p className="text-text-dark/50 text-sm mt-1">Gerencie itens em reforma ou remanufatura.</p>
        </div>

        {serverError && (
          <div className="mb-6 bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle className="text-red-500 shrink-0" size={18} />
            <p className="text-sm text-red-700 font-medium">{serverError}</p>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dark/30 group-focus-within:text-brand-cyan transition-colors" size={18} />
            <input type="text" placeholder="Buscar modelo..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-brand-pink/20 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-brand-cyan/5 transition-all shadow-sm" />
          </div>
          
          <div className="relative min-w-[160px]">
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

        <div className="bg-white rounded-3xl border border-brand-pink/20 overflow-hidden shadow-sm">
          {filtered.length === 0 ? (
            <div className="py-32 text-center">
              <Inbox className="mx-auto text-text-dark/10 mb-4" size={64} />
              <h3 className="text-lg font-bold text-text-dark/40">Nenhum item em manutenção no momento.</h3>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-[#FAFAFA]">
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-text-dark/40">Modelo / Tipo</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-text-dark/40">Qtd</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-text-dark/40">Status</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-text-dark/40 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-pink/5">
                  <AnimatePresence>
                    {filtered.map((item) => (
                      <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-[#FAFAFA] transition-colors">
                        <td className="px-6 py-5">
                          <p className="text-sm font-black text-text-dark">{item.modelo_nome_snapshot || "Modelo s/ Nome"}</p>
                          <span className="text-[9px] font-black uppercase tracking-wider text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">{item.tipo_servico}</span>
                        </td>
                        <td className="px-6 py-5 text-sm font-black">{item.quantidade} un</td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${item.status === 'concluida' ? 'bg-green-50 text-green-700 border-green-200' : item.status === 'em_andamento' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          {item.status === "pendente" && (
                            <button onClick={() => handleAction(item.id, "iniciar")} disabled={loadingId === item.id}
                              className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black uppercase transition-all disabled:opacity-50">
                              Iniciar
                            </button>
                          )}
                          {item.status === "em_andamento" && (
                            <button onClick={() => handleAction(item.id, "concluir")} disabled={loadingId === item.id}
                              className="px-4 py-2 bg-green-50 text-green-700 rounded-xl text-[10px] font-black uppercase transition-all disabled:opacity-50">
                              Concluir
                            </button>
                          )}
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
