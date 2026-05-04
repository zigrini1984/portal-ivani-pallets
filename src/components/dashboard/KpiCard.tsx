import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  titulo: string;
  valor: string | number;
  descricao: string;
  icone: LucideIcon;
  cor?: "cyan" | "pink" | "yellow" | "blue" | "green" | "red" | "purple";
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
  cor = "cyan",
  tendencia,
}) => {
  const colorMap = {
    cyan: "text-brand-cyan bg-brand-cyan/5 border-brand-cyan/10",
    pink: "text-brand-pink bg-brand-pink/5 border-brand-pink/10",
    yellow: "text-brand-yellow bg-brand-yellow/5 border-brand-yellow/10",
    blue: "text-brand-blue bg-brand-blue/5 border-brand-blue/10",
    green: "text-green-500 bg-green-50 border-green-100",
    red: "text-red-500 bg-red-50 border-red-100",
    purple: "text-purple-500 bg-purple-50 border-purple-100",
  };

  const iconColorMap = {
    cyan: "text-brand-cyan",
    pink: "text-brand-pink",
    yellow: "text-brand-yellow",
    blue: "text-brand-blue",
    green: "text-green-500",
    red: "text-red-500",
    purple: "text-purple-500",
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white rounded-3xl border border-brand-pink/10 p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-xl transition-all group relative overflow-hidden"
    >
      <div className="absolute top-[-20px] right-[-20px] opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-500 pointer-events-none rotate-12 group-hover:rotate-0">
        <Icone size={120} />
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorMap[cor]}`}>
            <Icone size={24} />
          </div>
          {tendencia && (
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${
                tendencia.subindo ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
              }`}
            >
              {tendencia.valor}
            </div>
          )}
        </div>

        <div>
          <span className="text-[10px] font-black text-text-dark/30 uppercase tracking-[0.15em] block mb-1">
            {titulo}
          </span>
          <div className="text-2xl sm:text-3xl font-black text-text-dark tracking-tight truncate">
            {valor}
          </div>
        </div>

        <p className="mt-4 text-[11px] text-text-dark/40 font-bold uppercase tracking-tight leading-relaxed border-t border-brand-pink/5 pt-4">
          {descricao}
        </p>
      </div>
    </motion.div>
  );
};
