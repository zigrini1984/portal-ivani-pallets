"use client";

import React, { useState, useMemo } from "react";
import {
  Wrench, AlertCircle, CheckCircle2, Loader2, Search,
  Play, ChevronDown, Package, Inbox,
  RefreshCw, Check, ClipboardList, Hammer, Zap, Trash2,
  Calendar, ArrowRight, History
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { BicPenBanner } from "@/components/ui/editorial";
import { iniciarManutencao, concluirManutencao, sincronizarManutencoesPendentes, limparRegistrosInvalidos } from "@/app/actions/manutencao";

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

// ─── Status helpers ───────────────────────────────────────────────────────────

function statusConfig(s: string) {
  switch (s) {
    case "concluida":   return { label: "Concluído",   dot: "bg-[var(--ivani-teal)]",  text: "text-[var(--ivani-teal)]",  bg: "bg-[var(--ivani-teal)]/8" };
    case "em_andamento":return { label: "Em Reparo",   dot: "bg-[var(--ivani-blue)]",  text: "text-[var(--ivani-blue)]",  bg: "bg-[var(--ivani-blue)]/8" };
    default:            return { label: "Pendente",    dot: "bg-amber-500",            text: "text-amber-700",            bg: "bg-amber-50" };
  }
}

function tipoConfig(t: string) {
  if (t === "reforma")       return { label: "Reforma",       bg: "bg-orange-50", text: "text-orange-700", icon: <Hammer size={12} /> };
  if (t === "remanufatura")  return { label: "Remanufatura",  bg: "bg-[var(--ivani-purple)]/8", text: "text-[var(--ivani-purple)]", icon: <History size={12} /> };
  return                            { label: t,               bg: "bg-[var(--ivani-bg)]",       text: "text-[var(--ivani-muted)]", icon: <Package size={12} /> };
}

// ─── Component ────────────────────────────────────────────────────────────────

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

  // ─── Data (logic preserved) ───────────────────────────────────────────────
  const manutencoesValidas = useMemo(() => {
    if (!Array.isArray(initialManutencoes)) return [];
    return initialManutencoes.filter(item => {
      const qty = Number(item.quantidade || item.quantidade_entrada || 0);
      const tipo = String(item.tipo_servico || "").toLowerCase();
      return qty > 0 && ["reforma", "remanufatura"].includes(tipo);
    });
  }, [initialManutencoes]);

  const stats = useMemo(() => {
    const sum = (list: Manutencao[]) => list.reduce((acc, curr) => acc + Number(curr.quantidade || curr.quantidade_entrada || 0), 0);
    return {
      totalGeral:   sum(manutencoesValidas),
      pendentes:    sum(manutencoesValidas.filter(i => i.status === "pendente")),
      emAndamento:  sum(manutencoesValidas.filter(i => i.status === "em_andamento")),
      concluidas:   sum(manutencoesValidas.filter(i => i.status === "concluida")),
      reforma:      sum(manutencoesValidas.filter(i => i.tipo_servico === "reforma")),
      remanufatura: sum(manutencoesValidas.filter(i => i.tipo_servico === "remanufatura")),
    };
  }, [manutencoesValidas]);

  const filteredList = useMemo(() => {
    return manutencoesValidas.filter(m => {
      const name = m?.modelo_nome_snapshot?.toLowerCase() || "";
      return name.includes(searchTerm.toLowerCase()) && (filterStatus === "todos" || m.status === filterStatus);
    });
  }, [manutencoesValidas, searchTerm, filterStatus]);

  // ─── Handlers (logic preserved) ──────────────────────────────────────────
  async function handleAction(id: string, action: "iniciar" | "concluir") {
    setLoadingId(id);
    try {
      const res = action === "iniciar" ? await iniciarManutencao(id) : await concluirManutencao(id);
      if (!res.success) throw new Error(res.error);
      router.refresh();
    } catch (err: any) {
      alert("Erro: " + err.message);
    } finally { setLoadingId(null); }
  }

  async function handleSync() {
    setIsSyncing(true);
    try {
      const res = await sincronizarManutencoesPendentes();
      if (!res.success) throw new Error(res.error);
      const msg = `Sincronização concluída!\n\nTriagens verificadas: ${res.triagensVerificadas}\nItens criados: ${res.itensCriados}`;
      alert(msg);
      router.refresh();
    } catch (err: any) {
      alert("Erro ao sincronizar: " + err.message);
    } finally { setIsSyncing(false); }
  }

  async function handleClean() {
    if (!confirm("Deseja remover registros zerados ou inválidos?")) return;
    try {
      const res = await limparRegistrosInvalidos();
      if (res.success) { alert("Limpeza concluída!"); router.refresh(); }
      else throw new Error(res.error);
    } catch (err: any) { alert("Erro na limpeza: " + err.message); }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-[1200px] mx-auto">
      <BicPenBanner 
        title="Manutenção e Reparos" 
        subtitle="Gestão operacional de itens em reforma ou remanufatura vindos da triagem."
        image="/branding/banner-operacao.png"
      />

      <div className="flex justify-end items-center gap-3 mb-10">
        <button
          onClick={handleClean}
          title="Limpar registros inválidos"
          className="p-3.5 border border-[var(--ivani-border)] rounded-2xl text-[var(--ivani-muted)] hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all active:scale-95 shadow-sm bg-white"
        >
          <Trash2 size={18} />
        </button>
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="group relative inline-flex items-center gap-3 px-6 py-3.5 bg-[var(--ivani-primary)] text-white rounded-2xl text-sm font-bold overflow-hidden transition-all hover:shadow-[0_8px_25px_-5px_rgba(31,92,63,0.4)] active:scale-[0.98] disabled:opacity-60"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          {isSyncing ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
          Sincronizar Triagens
        </button>
      </div>

      {/* ── KPI Grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Pendentes", value: stats.pendentes, icon: <ClipboardList size={18} />, color: "#F59E0B" },
          { label: "Em Reparo", value: stats.emAndamento, icon: <Zap size={18} />, color: "var(--ivani-blue)" },
          { label: "Concluídos", value: stats.concluidas, icon: <CheckCircle2 size={18} />, color: "var(--ivani-teal)" },
          { label: "Total Geral", value: stats.totalGeral, icon: <Package size={18} />, color: "var(--ivani-primary)" },
        ].map((kpi, idx) => (
          <motion.div 
            key={kpi.label} 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="editorial-card p-5 relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 opacity-20" style={{ background: kpi.color }} />
            <div className="flex items-center justify-between mb-3">
               <p className="text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-widest">{kpi.label}</p>
               <div 
                 className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:rotate-12"
                 style={{ background: `color-mix(in srgb, ${kpi.color} 10%, transparent)`, color: kpi.color }}
               >
                 {kpi.icon}
               </div>
            </div>
            <p className="text-2xl font-black text-[var(--ivani-text)] tracking-tight">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Type Breakdown Breakdown ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {[
          { label: "Processo de Reforma", value: stats.reforma, icon: <Hammer size={20} />, color: "#DD5C36", desc: "Recuperação de peças e estrutura original" },
          { label: "Processo de Remanufatura", value: stats.remanufatura, icon: <History size={20} />, color: "var(--ivani-purple)", desc: "Reutilização de componentes para novos pallets" },
        ].map((k, idx) => (
          <motion.div 
            key={k.label} 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + idx * 0.1 }}
            className="editorial-card p-6 flex items-center gap-5 bg-white group hover:border-[var(--ivani-primary)]/30 transition-all"
          >
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
              style={{ background: `color-mix(in srgb, ${k.color} 8%, transparent)`, color: k.color }}
            >
              {k.icon}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--ivani-muted)] mb-1">{k.label}</p>
              <p className="text-2xl font-black text-[var(--ivani-text)] tracking-tight">
                {k.value} <span className="text-xs font-bold text-[var(--ivani-muted)] uppercase ml-1">unidades</span>
              </p>
              <p className="text-[11px] font-medium text-[var(--ivani-muted)] mt-1 opacity-70">{k.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Error Banner ─────────────────────────────────────────────────── */}
      {serverError && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
          <AlertCircle className="text-red-500 shrink-0" size={18} />
          <p className="text-sm font-bold text-red-700">{serverError}</p>
        </div>
      )}

      {/* ── Filter Bar ───────────────────────────────────────────────────── */}
      <div className="editorial-card p-4 mb-6 flex flex-col md:flex-row items-center gap-4 border-dashed border-2">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ivani-muted)]" size={18} />
          <input
            type="text"
            placeholder="Pesquisar por modelo de pallet..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[var(--ivani-bg)]/50 border border-transparent rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-[var(--ivani-primary)] focus:ring-4 focus:ring-[var(--ivani-primary)]/5 transition-all"
          />
        </div>
        <div className="relative min-w-[200px] w-full md:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full appearance-none pl-4 pr-10 py-3 bg-white border border-[var(--ivani-border)] rounded-xl text-xs font-black uppercase tracking-widest outline-none cursor-pointer focus:border-[var(--ivani-primary)] transition-all text-[var(--ivani-text)]"
          >
            <option value="todos">Todos os Status</option>
            <option value="pendente">Pendentes</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="concluida">Concluídos</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ivani-muted)] pointer-events-none" size={16} />
        </div>
      </div>

      {/* ── Table Container ─────────────────────────────────────────────── */}
      <div className="editorial-card overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="py-24 flex flex-col items-center text-center px-6">
            <div className="w-20 h-20 rounded-3xl bg-[var(--ivani-bg)] flex items-center justify-center text-[var(--ivani-muted)] mb-6 hand-drawn-border border-dashed">
              <Inbox size={32} />
            </div>
            <h3 className="text-lg font-black text-[var(--ivani-text)] mb-2">Nenhum item em manutenção</h3>
            <p className="text-sm text-[var(--ivani-muted)] max-w-sm font-medium">
              {manutencoesValidas.length === 0 
                ? "Conclua uma triagem operacional para gerar novos registros de manutenção." 
                : "Não encontramos resultados para os filtros selecionados."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-[var(--ivani-bg)]/40 border-b border-[var(--ivani-border)]">
                  <th className="px-6 py-5 text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.2em]">Modelo / Origem</th>
                  <th className="px-6 py-5 text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.2em]">Qtd.</th>
                  <th className="px-6 py-5 text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.2em]">Status</th>
                  <th className="px-6 py-5 text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.2em]">Tipo</th>
                  <th className="px-6 py-5 text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.2em] text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ivani-border)]">
                <AnimatePresence>
                  {filteredList.map((item, i) => {
                    const sc = statusConfig(item.status);
                    const tc = tipoConfig(item.tipo_servico);
                    return (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="hover:bg-[var(--ivani-bg)]/30 transition-colors group"
                      >
                        {/* Modelo */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white border border-[var(--ivani-border)] flex items-center justify-center text-[var(--ivani-muted)] shadow-sm group-hover:scale-110 transition-transform">
                              <Package size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-[var(--ivani-text)]">{item.modelo_nome_snapshot || "Modelo não informado"}</p>
                              <p className="text-[10px] font-bold text-[var(--ivani-primary)] uppercase mt-0.5 opacity-60">Triagem #{item.triagem_id?.split("-")[0]}</p>
                            </div>
                          </div>
                        </td>

                        {/* Qtd */}
                        <td className="px-6 py-5">
                           <div className="flex items-baseline gap-1">
                             <span className="text-lg font-black text-[var(--ivani-text)]">{item.quantidade || item.quantidade_entrada}</span>
                             <span className="text-[10px] font-bold text-[var(--ivani-muted)] uppercase">un</span>
                           </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-5">
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${sc.bg}`}>
                            <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
                            <span className={`text-[10px] font-black uppercase tracking-widest ${sc.text}`}>
                              {sc.label}
                            </span>
                          </div>
                        </td>

                        {/* Tipo */}
                        <td className="px-6 py-5">
                           <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-current/10 ${tc.bg} ${tc.text}`}>
                              {tc.icon}
                              <span className="text-[10px] font-black uppercase tracking-widest">{tc.label}</span>
                           </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-5 text-right">
                           <div className="flex items-center justify-end gap-3">
                              {item.status === "pendente" && (
                                <button
                                  onClick={() => handleAction(item.id, "iniciar")}
                                  disabled={loadingId === item.id}
                                  className="h-9 px-4 bg-[var(--ivani-primary)] text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:shadow-[0_4px_15px_-3px_rgba(31,92,63,0.3)] transition-all active:scale-95 disabled:opacity-50"
                                >
                                  {loadingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                                  Iniciar
                                </button>
                              )}
                              {item.status === "em_andamento" && (
                                <button
                                  onClick={() => handleAction(item.id, "concluir")}
                                  disabled={loadingId === item.id}
                                  className="h-9 px-4 bg-[var(--ivani-teal)] text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:shadow-[0_4px_15px_-3px_rgba(51,183,165,0.3)] transition-all active:scale-95 disabled:opacity-50"
                                >
                                  {loadingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                  Concluir
                                </button>
                              )}
                              {item.status === "concluida" && (
                                <div className="h-9 px-4 bg-[var(--ivani-bg)] text-[var(--ivani-muted)] rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-[var(--ivani-border)] cursor-default shadow-sm">
                                  <CheckCircle2 size={14} className="text-[var(--ivani-teal)]" />
                                  Em Estoque
                                </div>
                              )}
                           </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
        <div className="px-6 py-5 border-t border-[var(--ivani-border)] bg-[var(--ivani-bg)]/20 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-[var(--ivani-purple)]" />
             <p className="text-[10px] font-bold text-[var(--ivani-muted)] uppercase tracking-widest">Fluxo de Restauração Ativo</p>
           </div>
           <p className="text-[11px] font-bold text-[var(--ivani-muted)] uppercase">
             Exibindo <span className="text-[var(--ivani-text)] font-black">{filteredList.length}</span> registros de manutenção
           </p>
        </div>
      </div>
    </div>
  );
}
