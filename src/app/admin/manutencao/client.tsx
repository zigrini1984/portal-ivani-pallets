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
import { 
  BicPenBanner, 
  PremiumCard, 
  PremiumButton, 
  PremiumBadge 
} from "@/components/ui/editorial";
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
    case "concluida":   return { label: "Concluído",   variant: "teal" as const };
    case "em_andamento":return { label: "Em Reparo",   variant: "blue" as const };
    default:            return { label: "Pendente",    variant: "orange" as const };
  }
}

function tipoConfig(t: string) {
  if (t === "reforma")       return { label: "Reforma",       variant: "orange" as const, icon: <Hammer size={12} /> };
  if (t === "remanufatura")  return { label: "Remanufatura",  variant: "blue" as const, icon: <History size={12} /> };
  return                            { label: t,               variant: "default" as const, icon: <Package size={12} /> };
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
      alert(`Sincronização concluída!\nTriagens: ${res.triagensVerificadas}\nItens: ${res.itensCriados}`);
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

  return (
    <div className="max-w-[1200px] mx-auto pb-20">
      <BicPenBanner 
        title="Manutenção e Reparos" 
        subtitle="Gestão operacional de itens em reforma ou remanufatura vindos da triagem."
        image="/branding/banner-operacao.png"
        hueRotate="240deg"
      />

      <div className="flex justify-end items-center gap-3 mb-10">
        <PremiumButton
          variant="secondary"
          onClick={handleClean}
          icon={<Trash2 size={16} />}
          className="!p-4"
        />
        <PremiumButton
          onClick={handleSync}
          loading={isSyncing}
          icon={<RefreshCw size={18} />}
        >
          Sincronizar Operação
        </PremiumButton>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: "Pendentes", value: stats.pendentes, icon: <ClipboardList size={20} />, color: "#F59E0B" },
          { label: "Em Reparo", value: stats.emAndamento, icon: <Zap size={20} />, color: "var(--ivani-blue)" },
          { label: "Concluídos", value: stats.concluidas, icon: <CheckCircle2 size={20} />, color: "var(--ivani-teal)" },
          { label: "Total Geral", value: stats.totalGeral, icon: <Package size={20} />, color: "var(--ivani-primary)" },
        ].map((kpi, idx) => (
          <PremiumCard key={kpi.label} className="p-6 relative group overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                {(kpi.icon as any) && React.cloneElement(kpi.icon as React.ReactElement<any>, { size: 48, strokeWidth: 1.5 })}
             </div>
            <div className="flex items-center justify-between mb-4">
               <div 
                 className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm border border-current/10"
                 style={{ background: `color-mix(in srgb, ${kpi.color} 10%, transparent)`, color: kpi.color }}
               >
                 {kpi.icon}
               </div>
               <div className="text-[9px] font-black uppercase tracking-widest text-[var(--ivani-muted)] opacity-40">Status</div>
            </div>
            <p className="text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-widest mb-1 opacity-60">{kpi.label}</p>
            <p className="text-3xl font-black text-[var(--ivani-text)] tracking-tight">{kpi.value}</p>
          </PremiumCard>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {[
          { label: "Linha de Reforma", value: stats.reforma, icon: <Hammer size={24} />, color: "#DD5C36", desc: "Recuperação estrutural técnica" },
          { label: "Linha de Remanufatura", value: stats.remanufatura, icon: <History size={24} />, color: "var(--ivani-purple)", desc: "Reutilização de componentes para novos ciclos" },
        ].map((k, idx) => (
          <PremiumCard 
            key={k.label} 
            className="p-8 flex items-center gap-6 group relative overflow-hidden"
          >
            <div 
              className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-110"
              style={{ background: `color-mix(in srgb, ${k.color} 8%, transparent)`, color: k.color }}
            >
              {k.icon}
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--ivani-muted)] mb-1.5 opacity-50">{k.label}</p>
              <p className="text-3xl font-black text-[var(--ivani-text)] tracking-tighter">
                {k.value} <span className="text-[10px] font-black text-[var(--ivani-muted)] uppercase ml-1 opacity-40">unidades</span>
              </p>
              <p className="text-[11px] font-bold text-[var(--ivani-muted)] mt-2 opacity-60">{k.desc}</p>
            </div>
          </PremiumCard>
        ))}
      </div>

      <PremiumCard className="p-4 mb-8 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--ivani-muted)] transition-colors group-focus-within:text-[var(--ivani-primary)]" size={18} />
          <input
            type="text"
            placeholder="Pesquisar por modelo de pallet..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-[var(--ivani-bg)]/40 border border-transparent rounded-2xl text-sm font-bold text-[var(--ivani-text)] outline-none focus:bg-white focus:border-[var(--ivani-primary)]/20 focus:ring-8 focus:ring-[var(--ivani-primary)]/5 transition-all placeholder:text-[var(--ivani-muted)]/30"
          />
        </div>
        <div className="relative min-w-[200px] w-full md:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full appearance-none pl-5 pr-12 py-4 bg-white border border-[var(--ivani-border)] rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer focus:border-[var(--ivani-primary)]/40 transition-all text-[var(--ivani-text)] shadow-sm"
          >
            <option value="todos">Todos os Status</option>
            <option value="pendente">Pendentes</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="concluida">Concluídos</option>
          </select>
          <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-[var(--ivani-muted)] pointer-events-none" size={16} />
        </div>
      </PremiumCard>

      <PremiumCard className="overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="py-32 flex flex-col items-center text-center px-6">
            <div className="w-24 h-24 rounded-[2.5rem] bg-[var(--ivani-bg)] flex items-center justify-center text-[var(--ivani-muted)] mb-8 hand-drawn-border border-dashed opacity-40">
              <Wrench size={40} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-black text-[var(--ivani-text)] mb-3">Linha de montagem vazia</h3>
            <p className="text-sm text-[var(--ivani-muted)] max-w-sm font-medium leading-relaxed opacity-60">
              Não há pallets aguardando ou em processo de reparo para os filtros atuais.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-premium min-w-[900px]">
              <thead>
                <tr>
                  <th>Modelo e Origem</th>
                  <th>Quantidade</th>
                  <th>Status Operacional</th>
                  <th>Tipo de Processo</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {filteredList.map((item, i) => {
                    const sc = statusConfig(item.status);
                    const tc = tipoConfig(item.tipo_servico);
                    return (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.02 }}
                        className={`${i % 2 === 0 ? "" : "zebra-row"} group`}
                      >
                        <td>
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-white border border-[var(--ivani-border)]/60 flex items-center justify-center text-[var(--ivani-muted)] shadow-sm group-hover:scale-110 transition-transform">
                              <Package size={18} strokeWidth={1.5} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-[var(--ivani-text)] tracking-tight">{item.modelo_nome_snapshot || "Modelo não informado"}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] font-black text-[var(--ivani-muted)] uppercase opacity-30 tracking-widest">TRIAGEM</span>
                                <span className="text-[10px] font-black text-[var(--ivani-primary)]">#{item.triagem_id?.split("-")[0]}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                           <div className="flex items-baseline gap-1.5">
                             <span className="text-lg font-black text-[var(--ivani-text)] tracking-tighter">{item.quantidade || item.quantidade_entrada}</span>
                             <span className="text-[9px] font-black text-[var(--ivani-muted)] uppercase tracking-widest opacity-40">UN</span>
                           </div>
                        </td>
                        <td>
                          <PremiumBadge variant={sc.variant}>
                            {sc.label}
                          </PremiumBadge>
                        </td>
                        <td>
                           <div className="inline-flex items-center gap-2">
                              {(tc.icon as any) && React.cloneElement(tc.icon as React.ReactElement<any>, { size: 14, className: "opacity-40" })}
                              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--ivani-text)]">{tc.label}</span>
                           </div>
                        </td>
                        <td className="text-right">
                           <div className="flex items-center justify-end gap-3">
                              {item.status === "pendente" && (
                                <PremiumButton
                                  onClick={() => handleAction(item.id, "iniciar")}
                                  loading={loadingId === item.id}
                                  icon={<Play size={14} />}
                                  className="!px-4 !py-2 !text-[9px] shadow-sm"
                                >
                                  Iniciar
                                </PremiumButton>
                              )}
                              {item.status === "em_andamento" && (
                                <PremiumButton
                                  variant="primary"
                                  onClick={() => handleAction(item.id, "concluir")}
                                  loading={loadingId === item.id}
                                  icon={<Check size={14} />}
                                  className="!px-4 !py-2 !text-[9px] shadow-sm"
                                >
                                  Concluir
                                </PremiumButton>
                              )}
                              {item.status === "concluida" && (
                                <div className="h-9 px-4 bg-[var(--ivani-bg)] text-[var(--ivani-muted)] rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-[var(--ivani-border)]/50 cursor-default">
                                  <CheckCircle2 size={14} className="text-[var(--ivani-teal)]" />
                                  Concluído
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
        <div className="px-8 py-6 border-t border-[var(--ivani-border)]/50 bg-[var(--ivani-bg)]/30 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-[var(--ivani-primary)] animate-pulse shadow-[0_0_8px_var(--ivani-primary)]" />
             <p className="text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.2em] opacity-60">Linha de Reparo Monitorada</p>
           </div>
           <p className="text-[11px] font-black text-[var(--ivani-muted)] uppercase tracking-widest opacity-60">
             Total de <span className="text-[var(--ivani-text)]">{filteredList.length}</span> ordens de serviço
           </p>
        </div>
      </PremiumCard>
    </div>
  );
}
