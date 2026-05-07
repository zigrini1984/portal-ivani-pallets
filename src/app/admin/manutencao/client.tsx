"use client";

import React, { useState, useMemo } from "react";
import {
  Wrench, AlertCircle, CheckCircle2, Loader2, Search,
  Play, ChevronDown, Package, Inbox,
  RefreshCw, Check, ClipboardList, Hammer, Zap, Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
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
    case "concluida":   return { label: "Concluída",   dot: "bg-[var(--ivani-teal)]",  text: "text-[var(--ivani-teal)]",  bg: "bg-[var(--ivani-teal)]/8" };
    case "em_andamento":return { label: "Em Andamento",dot: "bg-[var(--ivani-blue)]",  text: "text-[var(--ivani-blue)]",  bg: "bg-[var(--ivani-blue)]/8" };
    default:            return { label: "Pendente",    dot: "bg-amber-500",            text: "text-amber-700",            bg: "bg-amber-50" };
  }
}

function tipoConfig(t: string) {
  if (t === "reforma")       return { label: "Reforma",       bg: "bg-orange-50", text: "text-orange-700" };
  if (t === "remanufatura")  return { label: "Remanufatura",  bg: "bg-[var(--ivani-purple)]/8", text: "text-[var(--ivani-purple)]" };
  return                            { label: t,               bg: "bg-[var(--ivani-bg)]",       text: "text-[var(--ivani-muted)]" };
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
      const msg = `Sincronização concluída!\n\nTriagens verificadas: ${res.triagensVerificadas}\nItens criados: ${res.itensCriados}` +
        (res.motivos?.length ? `\n\nObservações:\n- ${res.motivos.slice(0, 3).join("\n- ")}` : "");
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
    <>
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8 pb-6 border-b border-[var(--ivani-border)] relative">
        <div className="absolute bottom-0 left-0 w-10 h-0.5 bg-[var(--ivani-secondary)] rounded-full" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--ivani-muted)] mb-1">Operações</p>
          <h1 className="text-2xl font-bold text-[var(--ivani-text)] tracking-tight">Manutenção e Reparos</h1>
          <p className="text-sm text-[var(--ivani-muted)] mt-1">Gerencie itens em reforma ou remanufatura vindos da triagem.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClean}
            title="Limpar registros inválidos"
            className="p-2.5 border border-[var(--ivani-border)] rounded-xl text-[var(--ivani-muted)] hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--ivani-primary)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--ivani-primary)]/90 transition-all shadow-sm disabled:opacity-60 active:scale-95"
          >
            {isSyncing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            Sincronizar Triagens
          </button>
        </div>
      </div>

      {/* ── KPI Strip ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Pendentes",    value: stats.pendentes,   icon: <ClipboardList size={17} />, accent: "#F59E0B" },
          { label: "Em Andamento", value: stats.emAndamento, icon: <Zap size={17} />,           accent: "var(--ivani-blue)" },
          { label: "Concluídos",   value: stats.concluidas,  icon: <CheckCircle2 size={17} />,  accent: "var(--ivani-teal)" },
          { label: "Total Geral",  value: stats.totalGeral,  icon: <Package size={17} />,       accent: "var(--ivani-primary)" },
        ].map(k => (
          <div key={k.label} className="editorial-card p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: k.accent }} />
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-[var(--ivani-muted)]">{k.label}</p>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: `color-mix(in srgb, ${k.accent} 12%, transparent)`, color: k.accent }}>
                {k.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-[var(--ivani-text)] tracking-tight">{k.value}</p>
          </div>
        ))}
      </div>

      {/* ── Type Breakdown ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          { label: "Total Reforma",      value: stats.reforma,      icon: <Hammer size={18} />,  accent: "#DD5C36" },
          { label: "Total Remanufatura", value: stats.remanufatura, icon: <Wrench size={18} />,  accent: "var(--ivani-purple)" },
        ].map(k => (
          <div key={k.label} className="editorial-card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `color-mix(in srgb, ${k.accent} 12%, transparent)`, color: k.accent }}>
              {k.icon}
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--ivani-muted)]">{k.label}</p>
              <p className="text-xl font-bold text-[var(--ivani-text)]">{k.value} <span className="text-xs font-normal text-[var(--ivani-muted)]">un</span></p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {serverError && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="text-red-500 flex-shrink-0" size={16} />
          <p className="text-sm text-red-700">{serverError}</p>
        </div>
      )}

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ivani-muted)]" size={15} />
          <input
            type="text"
            placeholder="Buscar modelo de pallet…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--ivani-surface)] border border-[var(--ivani-border)] rounded-xl text-sm outline-none focus:border-[var(--ivani-primary)] focus:ring-2 focus:ring-[var(--ivani-primary)]/15 transition-all"
          />
        </div>
        <div className="relative min-w-[180px]">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="w-full appearance-none pl-4 pr-10 py-2.5 bg-[var(--ivani-surface)] border border-[var(--ivani-border)] rounded-xl text-sm font-medium outline-none cursor-pointer focus:border-[var(--ivani-primary)] transition-all text-[var(--ivani-text)]"
          >
            <option value="todos">Todos os Status</option>
            <option value="pendente">Pendentes</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="concluida">Concluídos</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ivani-muted)] pointer-events-none" size={16} />
        </div>
      </div>

      {/* ── Table / Empty ─────────────────────────────────────────────────── */}
      <div className="editorial-card overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="py-20 flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[var(--ivani-bg)] flex items-center justify-center text-[var(--ivani-muted)]">
              <Inbox size={24} />
            </div>
            <p className="font-semibold text-[var(--ivani-text)]">
              {manutencoesValidas.length === 0 ? "Nenhum item em manutenção" : "Nenhum resultado"}
            </p>
            <p className="text-sm text-[var(--ivani-muted)] max-w-xs">
              {manutencoesValidas.length === 0
                ? "Conclua uma triagem com reforma ou remanufatura."
                : "Tente ajustar os filtros acima."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-[var(--ivani-border)] bg-[var(--ivani-bg)]/60">
                  {["Modelo / Origem", "Qtd.", "Status", "Tipo", "Ações"].map(h => (
                    <th key={h} className="px-5 py-3.5 text-[11px] font-semibold text-[var(--ivani-muted)] uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ivani-border)]">
                <AnimatePresence>
                  {filteredList.map((item) => {
                    const sc = statusConfig(item.status);
                    const tc = tipoConfig(item.tipo_servico);
                    return (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-[var(--ivani-bg)]/60 transition-colors group"
                      >
                        {/* Modelo */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[var(--ivani-primary)]/8 flex items-center justify-center text-[var(--ivani-primary)] flex-shrink-0 group-hover:scale-105 transition-transform">
                              <Package size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[var(--ivani-text)]">{item.modelo_nome_snapshot || "Modelo não informado"}</p>
                              <p className="text-[11px] text-[var(--ivani-muted)] mt-0.5">Triagem #{item.triagem_id?.split("-")[0]}</p>
                            </div>
                          </div>
                        </td>
                        {/* Qtd */}
                        <td className="px-5 py-4">
                          <span className="text-base font-bold text-[var(--ivani-text)]">{item.quantidade || item.quantidade_entrada}</span>
                          <span className="text-xs text-[var(--ivani-muted)] ml-1">un</span>
                        </td>
                        {/* Status */}
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${sc.bg} ${sc.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {sc.label}
                          </span>
                        </td>
                        {/* Tipo */}
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${tc.bg} ${tc.text}`}>
                            {tc.label}
                          </span>
                        </td>
                        {/* Actions */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            {item.status === "pendente" && (
                              <button
                                onClick={() => handleAction(item.id, "iniciar")}
                                disabled={loadingId === item.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--ivani-primary)] text-white rounded-lg text-xs font-semibold hover:bg-[var(--ivani-primary)]/90 transition-all disabled:opacity-50 active:scale-95"
                              >
                                {loadingId === item.id ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                                Iniciar
                              </button>
                            )}
                            {item.status === "em_andamento" && (
                              <button
                                onClick={() => handleAction(item.id, "concluir")}
                                disabled={loadingId === item.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--ivani-teal)] text-white rounded-lg text-xs font-semibold hover:bg-[var(--ivani-teal)]/90 transition-all disabled:opacity-50 active:scale-95"
                              >
                                {loadingId === item.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                Concluir
                              </button>
                            )}
                            {item.status === "concluida" && (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--ivani-bg)] text-[var(--ivani-muted)] rounded-lg text-xs font-medium">
                                <CheckCircle2 size={12} className="text-[var(--ivani-teal)]" />
                                No Estoque
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
            <div className="px-5 py-3 border-t border-[var(--ivani-border)] bg-[var(--ivani-bg)]/40">
              <p className="text-xs text-[var(--ivani-muted)]">
                <span className="font-semibold text-[var(--ivani-text)]">{filteredList.length}</span> de {manutencoesValidas.length} registros
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
