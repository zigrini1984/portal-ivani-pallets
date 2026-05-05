"use client";

import React, { useState, useMemo } from "react";
import {
  Truck,
  Search,
  AlertCircle,
  CheckCircle2,
  Clock,
  Package,
  Hash,
  Calendar,
  User,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Coleta {
  id: string;
  data_coleta: string;
  quantidade_material_bruto: number;
  motorista?: string;
  caminhao?: string;
  status?: string;
  observacao?: string;
  created_at: string;
}

interface AdminColetaClientProps {
  initialColetas: Coleta[];
  error?: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
  } catch {
    return value;
  }
}

const STATUS_MAP: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  registrado: {
    label: "Registrado",
    color: "bg-blue-50 text-blue-600 border-blue-100",
    icon: <Clock size={11} />,
  },
  aguardando_triagem: {
    label: "Aguardando Triagem",
    color: "bg-amber-50 text-amber-600 border-amber-100",
    icon: <Clock size={11} />,
  },
  em_triagem: {
    label: "Em Triagem",
    color: "bg-brand-cyan/5 text-brand-cyan border-brand-cyan/20",
    icon: <Package size={11} />,
  },
  finalizado: {
    label: "Finalizado",
    color: "bg-green-50 text-green-600 border-green-100",
    icon: <CheckCircle2 size={11} />,
  },
};

function StatusBadge({ status }: { status?: string }) {
  const key = status?.toLowerCase() ?? "registrado";
  const cfg = STATUS_MAP[key] ?? STATUS_MAP["registrado"];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${cfg.color}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AdminColetaClient({
  initialColetas,
  error,
}: AdminColetaClientProps) {
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...initialColetas]
      .filter(
        (c) =>
          !q ||
          formatDate(c.data_coleta).includes(q) ||
          (c.motorista ?? "").toLowerCase().includes(q) ||
          (c.caminhao ?? "").toLowerCase().includes(q) ||
          (c.status ?? "").toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const diff =
          new Date(b.data_coleta).getTime() -
          new Date(a.data_coleta).getTime();
        return sortDir === "desc" ? diff : -diff;
      });
  }, [initialColetas, search, sortDir]);

  const totalPallets = initialColetas.reduce(
    (acc, c) => acc + (c.quantidade_material_bruto ?? 0),
    0
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-text-dark pb-20">
      {/* ── Header ── */}
      <AdminPageHeader
        title="Registro de Coletas"
        subtitle="Ivani Pallets — Admin"
        icon={<Truck size={18} />}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
        {/* ── Page title + KPIs ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Coletas Registradas
            </h1>
            <p className="text-text-dark/50 text-sm mt-1">
              Histórico de todas as coletas recebidas da PCE.
            </p>
          </div>

          <div className="flex gap-4 flex-wrap">
            <div className="bg-white rounded-2xl border border-brand-pink/20 px-5 py-3 shadow-sm flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-cyan/10 rounded-xl flex items-center justify-center text-brand-cyan">
                <Truck size={16} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest">
                  Total de Coletas
                </p>
                <p className="text-lg font-black text-text-dark leading-none">
                  {initialColetas.length}
                </p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-brand-pink/20 px-5 py-3 shadow-sm flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-brown/10 rounded-xl flex items-center justify-center text-brand-brown">
                <Package size={16} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest">
                  Total de Pallets
                </p>
                <p className="text-lg font-black text-text-dark leading-none">
                  {totalPallets.toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-100 rounded-2xl p-5 flex items-center gap-3">
            <AlertCircle className="text-red-500 shrink-0" size={20} />
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}

        {/* ── Toolbar ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dark/30"
              size={16}
            />
            <input
              type="text"
              placeholder="Buscar por data, motorista, caminhão…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-brand-pink/20 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-brand-cyan/20 transition-all"
            />
          </div>
          <button
            onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-brand-pink/20 rounded-xl text-xs font-bold text-text-dark/50 hover:border-brand-cyan/30 transition-all"
          >
            {sortDir === "desc" ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronUp size={14} />
            )}
            {sortDir === "desc" ? "Mais recentes" : "Mais antigas"}
          </button>
        </div>

        {/* ── Empty state ── */}
        {!error && filtered.length === 0 && (
          <div className="py-32 text-center bg-white rounded-3xl border border-brand-pink/20">
            <Truck className="mx-auto text-text-dark/10 mb-4" size={64} />
            <h3 className="text-lg font-bold text-text-dark/40">
              {search ? "Nenhum resultado encontrado" : "Sem coletas registradas"}
            </h3>
            {search && (
              <p className="text-sm text-text-dark/30 mt-1">
                Tente ajustar o filtro de busca.
              </p>
            )}
          </div>
        )}

        {/* ── Table ── */}
        {!error && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-brand-pink/20 overflow-hidden shadow-sm"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-bg-primary">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-dark/40">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        Data
                      </div>
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-dark/40">
                      <div className="flex items-center gap-1.5">
                        <Package size={12} />
                        Quantidade
                      </div>
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-dark/40">
                      <div className="flex items-center gap-1.5">
                        <User size={12} />
                        Motorista
                      </div>
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-dark/40">
                      <div className="flex items-center gap-1.5">
                        <Truck size={12} />
                        Caminhão
                      </div>
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-dark/40">
                      Status
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-dark/40">
                      <div className="flex items-center gap-1.5">
                        <MessageSquare size={12} />
                        Observação
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-brand-pink/5">
                  <AnimatePresence>
                    {filtered.map((c, i) => (
                      <motion.tr
                        key={c.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="hover:bg-bg-primary/40 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-text-dark">
                            {formatDate(c.data_coleta)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-black text-text-dark">
                            {c.quantidade_material_bruto.toLocaleString("pt-BR")}
                          </span>
                          <span className="text-[10px] text-text-dark/30 font-bold ml-1">
                            un
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-text-dark/60">
                          {c.motorista ?? (
                            <span className="text-text-dark/20 italic">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-text-dark/60">
                          {c.caminhao ?? (
                            <span className="text-text-dark/20 italic">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={c.status ?? "registrado"} />
                        </td>
                        <td className="px-6 py-4 text-xs text-text-dark/40 max-w-[200px] truncate">
                          {c.observacao ?? (
                            <span className="italic">—</span>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-brand-pink/10 bg-bg-primary/30 flex items-center justify-between">
              <p className="text-[10px] font-bold text-text-dark/30 uppercase tracking-widest">
                {filtered.length} de {initialColetas.length} registros
              </p>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
