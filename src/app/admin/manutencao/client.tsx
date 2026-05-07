"use client";

import React, { useState, useMemo } from "react";
import {
  Wrench, AlertCircle, CheckCircle2, Loader2, Search,
  Play, ChevronDown, Calendar, Clock, Package, Inbox,
  RefreshCw, Check, ClipboardList, Hammer, Zap, Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { iniciarManutencao, concluirManutencao, sincronizarManutencoesPendentes, limparRegistrosInvalidos } from "@/app/actions/manutencao";
import { PageShell, KPIGrid, KPICard, AppCard, StatusBadge, EmptyState, AppButton } from "@/components/ui/tropical";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModeloPallet { id: string; nome: string; codigo: string; medidas: string; }

interface Manutencao {
  id: string; triagem_id?: string; coleta_id?: string; cliente_id?: string;
  modelo_id?: string; modelo_pallet_id?: string; modelo_nome_snapshot: string;
  tipo_servico: "reforma" | "remanufatura";
  quantidade: number;
  quantidade_entrada: number; 
  quantidade_concluida?: number;
  status: "pendente" | "em_andamento" | "concluida";
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

  // 1. Filtragem de dados válidos para KPIs e Tabela
  const manutencoesValidas = useMemo(() => {
    if (!Array.isArray(initialManutencoes)) return [];
    return initialManutencoes.filter(item => {
      const qty = Number(item.quantidade || item.quantidade_entrada || 0);
      const tipo = String(item.tipo_servico || "").toLowerCase();
      return qty > 0 && ["reforma", "remanufatura"].includes(tipo);
    });
  }, [initialManutencoes]);

  // 2. Cálculo dos KPIs
  const stats = useMemo(() => {
    const sum = (list: Manutencao[]) => list.reduce((acc, curr) => acc + Number(curr.quantidade || curr.quantidade_entrada || 0), 0);
    
    return {
      totalGeral: sum(manutencoesValidas),
      pendentes: sum(manutencoesValidas.filter(i => i.status === "pendente")),
      emAndamento: sum(manutencoesValidas.filter(i => i.status === "em_andamento")),
      concluidas: sum(manutencoesValidas.filter(i => i.status === "concluida")),
      reforma: sum(manutencoesValidas.filter(i => i.tipo_servico === "reforma")),
      remanufatura: sum(manutencoesValidas.filter(i => i.tipo_servico === "remanufatura")),
    };
  }, [manutencoesValidas]);

  // 3. Filtragem de Busca/Filtro
  const filteredList = useMemo(() => {
    return manutencoesValidas.filter(m => {
      const name = m?.modelo_nome_snapshot?.toLowerCase() || "";
      const matchSearch = name.includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === "todos" || m.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [manutencoesValidas, searchTerm, filterStatus]);

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
                  `Triagens verificadas: ${res.triagensVerificadas}\n` +
                  `Itens criados: ${res.itensCriados}\n` +
                  (res.motivos && res.motivos.length > 0 ? `\nObservações:\n- ${res.motivos.slice(0,3).join('\n- ')}` : "");
      
      alert(msg);
      router.refresh();
    } catch (err: any) {
      alert("Erro ao sincronizar: " + err.message);
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleClean() {
      if(!confirm("Deseja remover registros zerados ou inválidos?")) return;
      try {
          const res = await limparRegistrosInvalidos();
          if(res.success) {
              alert("Limpeza concluída!");
              router.refresh();
          } else {
              throw new Error(res.error);
          }
      } catch(err: any) {
          alert("Erro na limpeza: " + err.message);
      }
  }

  return (
    <PageShell hideHeader={false} 
      title="Manutenção e Reparos" 
      subtitle="Gerencie itens em reforma ou remanufatura vindos da triagem."
      actions={
        <div className="flex items-center gap-2">
          <AppButton onClick={handleClean} variant="danger" icon={<Trash2 size={16} />} title="Limpar inválidos" className="p-3">
             <span className="sr-only">Limpar</span>
          </AppButton>
          <AppButton onClick={handleSync} disabled={isSyncing} icon={isSyncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}>
             Sincronizar Triagens
          </AppButton>
        </div>
      }
    >
        <KPIGrid>
          <KPICard title="Pendentes" value={stats.pendentes} icon={<Clock size={24} />} colorVariant="orange" />
          <KPICard title="Em Andamento" value={stats.emAndamento} icon={<Zap size={24} />} colorVariant="aqua" />
          <KPICard title="Concluídos" value={stats.concluidas} icon={<CheckCircle2 size={24} />} colorVariant="jasmine" />
          <KPICard title="Total Geral" value={stats.totalGeral} icon={<ClipboardList size={24} />} colorVariant="default" />
        </KPIGrid>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <AppCard className="p-4 flex items-center gap-4">
             <div className="p-3 rounded-2xl bg-[#DD5C36]/10 text-[#DD5C36]"><Hammer size={20} /></div>
             <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-[#133020]/60">Total Reforma</p>
               <p className="text-2xl font-black text-[#133020]">{stats.reforma} <span className="text-[10px] font-bold text-[#133020]/40 uppercase">un</span></p>
             </div>
          </AppCard>
          <AppCard className="p-4 flex items-center gap-4">
             <div className="p-3 rounded-2xl bg-[#133020]/5 text-[#133020]"><Wrench size={20} /></div>
             <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-[#133020]/60">Total Remanufatura</p>
               <p className="text-2xl font-black text-[#133020]">{stats.remanufatura} <span className="text-[10px] font-bold text-[#133020]/40 uppercase">un</span></p>
             </div>
          </AppCard>
        </div>

        {serverError && (
          <div className="mb-6 bg-red-50 border border-red-100 rounded-3xl p-4 flex items-center gap-3">
            <AlertCircle className="text-red-500 shrink-0" size={20} />
            <p className="text-sm text-red-700 font-bold">{serverError}</p>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#133020]/30 group-focus-within:text-[#DD5C36] transition-colors" size={20} />
            <input type="text" placeholder="Buscar modelo de pallet..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-[#133020]/10 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-[#DD5C36]/10 transition-all shadow-sm font-medium text-[#133020]" />
          </div>
          
          <div className="relative min-w-[200px]">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="w-full appearance-none pl-4 pr-12 py-4 bg-white border border-[#133020]/10 rounded-2xl text-sm font-bold outline-none cursor-pointer focus:border-[#DD5C36] shadow-sm transition-all text-[#133020]">
              <option value="todos">Todos Status</option>
              <option value="pendente">Pendentes</option>
              <option value="em_andamento">Iniciados</option>
              <option value="concluida">Concluídos</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#133020]/30 pointer-events-none" size={18} />
          </div>
        </div>

        {/* List/Table */}
        <AppCard>
          {filteredList.length === 0 ? (
            <EmptyState 
              icon={<Inbox size={48} />}
              title={manutencoesValidas.length === 0 ? "Nenhum item em manutenção" : "Nenhum resultado"}
              description={manutencoesValidas.length === 0 ? "Conclua uma triagem com reforma ou remanufatura." : "Tente limpar os filtros."}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-[#F8EDD9]/50 border-b border-[#133020]/5">
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[#133020]/50">Modelo / Origem</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[#133020]/50 text-center">Quantidade</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[#133020]/50">Status / Tipo</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[#133020]/50 text-right">Ações Operacionais</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#133020]/5">
                  <AnimatePresence>
                    {filteredList.map((item) => (
                      <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-[#F8EDD9]/30 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#327039]/10 flex items-center justify-center text-[#327039] group-hover:scale-110 transition-transform">
                              <Package size={24} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-[#133020]">{item.modelo_nome_snapshot || "Modelo não informado"}</p>
                              <p className="text-[10px] text-[#133020]/50 font-bold uppercase tracking-widest mt-0.5">Triagem #{item.triagem_id?.split('-')[0]}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className="text-xl font-black text-[#133020]">{item.quantidade || item.quantidade_entrada}</span>
                          <span className="text-[10px] font-bold text-[#133020]/30 ml-1.5 uppercase tracking-widest">un</span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-2 items-start">
                            <StatusBadge 
                              variant={item.status === 'concluida' ? 'success' : item.status === 'em_andamento' ? 'info' : 'warning'} 
                            >
                              {item.status}
                            </StatusBadge>
                            <StatusBadge 
                              variant={item.tipo_servico === 'reforma' ? 'warning' : 'default'} 
                            >
                              {item.tipo_servico}
                            </StatusBadge>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            {item.status === "pendente" && (
                              <AppButton onClick={() => handleAction(item.id, "iniciar")} disabled={loadingId === item.id} icon={loadingId === item.id ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}>
                                Iniciar
                              </AppButton>
                            )}
                            
                            {item.status === "em_andamento" && (
                              <AppButton onClick={() => handleAction(item.id, "concluir")} variant="secondary" disabled={loadingId === item.id} icon={loadingId === item.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}>
                                Concluir
                              </AppButton>
                            )}
 
                            {item.status === "concluida" && (
                              <div className="flex items-center gap-2 px-4 py-3 bg-[#133020]/5 text-[#133020]/40 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                                <CheckCircle2 size={16} className="text-emerald-500" /> No Estoque
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
        </AppCard>
    </PageShell>
  );
}


