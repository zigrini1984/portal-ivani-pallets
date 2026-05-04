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
    brand: "text-brand-cyan",
  };

  const bgStyles = {
    neutral: "bg-neutral-100",
    success: "bg-emerald-50",
    warning: "bg-amber-50",
    brand: "bg-brand-cyan/10",
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${bgStyles[cor]}`}>
            {Icone && <Icone size={18} className={colorStyles[cor]} strokeWidth={2.5} />}
          </div>
          <span className="text-sm font-medium text-neutral-500">{titulo}</span>
        </div>
        {tendencia && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
              tendencia.subindo ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            }`}
          >
            {tendencia.subindo ? "↑" : "↓"} {tendencia.valor}
          </div>
        )}
      </div>

      <div className="mt-auto">
        <div className="text-3xl font-semibold text-neutral-900 tracking-tight">
          {valor ?? "---"}
        </div>
        {descricao && (
          <p className="mt-2 text-xs text-neutral-400 font-medium">
            {descricao}
          </p>
        )}
      </div>
    </div>
  );
};
