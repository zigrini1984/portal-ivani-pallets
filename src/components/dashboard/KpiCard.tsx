"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  titulo: string;
  valor: string | number | null | undefined;
  descricao?: string;
  icone: LucideIcon;
  cor?: "neutral" | "success" | "warning" | "brand";
  tendencia?: {
    valor: string;
    subindo: boolean;
  };
}

export const KpiCard: React.FC<KpiCardProps> = ({
  titulo,
  valor,
  descricao,
  icone: Icone,
  cor = "neutral",
  tendencia,
}) => {
  const colorStyles = {
    neutral: "text-neutral-500",
    success: "text-emerald-600",
    warning: "text-amber-600",
    brand: "text-brand-teal",
  };

  const bgStyles = {
    neutral: "bg-neutral-50 border-neutral-100",
    success: "bg-emerald-50/50 border-emerald-100",
    warning: "bg-amber-50/50 border-amber-100",
    brand: "bg-brand-teal/5 border-brand-teal/20",
  };

  return (
    <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] transition-all duration-300 flex flex-col h-full group">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-110 ${bgStyles[cor]}`}>
            {Icone && <Icone size={18} className={colorStyles[cor]} strokeWidth={2.5} />}
          </div>
          <span className="text-sm font-semibold text-neutral-500 tracking-wide">{titulo}</span>
        </div>
        {tendencia && (
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider ${
              tendencia.subindo ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            }`}
          >
            {tendencia.subindo ? "↑" : "↓"} {tendencia.valor}
          </div>
        )}
      </div>

      <div className="mt-auto">
        <div className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tighter mb-1">
          {valor ?? "---"}
        </div>
        {descricao && (
          <p className="mt-3 text-xs text-neutral-400 font-medium leading-relaxed">
            {descricao}
          </p>
        )}
      </div>
    </div>
  );
};
