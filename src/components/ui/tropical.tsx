import React from "react";
import { motion } from "framer-motion";

export function PageShell({ children, title, subtitle, actions }: { children: React.ReactNode, title: string, subtitle?: string, actions?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-floral text-brand-indigo pb-20">
      <header className="bg-white border-b border-brand-indigo/10 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-brand-indigo">{title}</h1>
            {subtitle && <p className="text-sm text-brand-indigo/60 font-medium">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        {children}
      </main>
    </div>
  );
}

export function SectionHeader({ title, description, icon }: { title: string, description?: string, icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      {icon && <div className="w-12 h-12 rounded-2xl bg-brand-aqua/20 text-brand-aqua flex items-center justify-center">{icon}</div>}
      <div>
        <h2 className="text-xl font-black text-brand-indigo">{title}</h2>
        {description && <p className="text-sm text-brand-indigo/60">{description}</p>}
      </div>
    </div>
  );
}

export function KPIGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {children}
    </div>
  );
}

export function KPICard({ title, value, unit, icon, colorVariant = "default", description }: { title: string, value: string | number, unit?: string, icon?: React.ReactNode, colorVariant?: "default" | "orange" | "aqua" | "jasmine" | "indigo" | "primary" | "floral" | "cream", description?: string }) {
  const colors = {
    default: "bg-white border-brand-indigo/10 text-brand-indigo",
    orange: "bg-brand-orange/10 border-brand-orange/20 text-brand-orange",
    aqua: "bg-brand-aqua/10 border-brand-aqua/20 text-brand-aqua",
    jasmine: "bg-brand-jasmine/20 border-brand-jasmine/30 text-amber-700",
    indigo: "bg-brand-indigo/10 border-brand-indigo/20 text-brand-indigo",
    primary: "bg-emerald-50 border-emerald-100 text-emerald-700",
    floral: "bg-brand-floral border-brand-indigo/10 text-brand-indigo",
    cream: "bg-brand-cream border-brand-indigo/10 text-brand-indigo",
  };
  
  const iconColors = {
    default: "bg-brand-indigo/5 text-brand-indigo",
    orange: "bg-brand-orange/20 text-brand-orange",
    aqua: "bg-brand-aqua/20 text-brand-aqua",
    jasmine: "bg-brand-jasmine/40 text-amber-700",
    indigo: "bg-brand-indigo/20 text-brand-indigo",
    primary: "bg-emerald-100 text-emerald-600",
    floral: "bg-brand-indigo/5 text-brand-indigo",
    cream: "bg-brand-indigo/5 text-brand-indigo",
  };

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className={`rounded-3xl p-6 border shadow-sm transition-all ${colors[colorVariant]}`}
    >
      <div className="flex items-center justify-between mb-4">
        {icon && <div className={`p-3 rounded-2xl ${iconColors[colorVariant]}`}>{icon}</div>}
      </div>
      <div className="flex flex-col">
        <span className="text-3xl font-black tracking-tight">
          {value}
          {unit && <span className="text-xs font-bold opacity-60 ml-1.5 uppercase tracking-widest">{unit}</span>}
        </span>
        <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-1">{title}</span>
        {description && <p className="text-[10px] font-medium opacity-40 mt-1">{description}</p>}
      </div>
    </motion.div>
  );
}

export function AppCard({ children, className = "", noPadding = false }: { children: React.ReactNode, className?: string, noPadding?: boolean }) {
  return (
    <div className={`bg-white rounded-3xl border border-brand-indigo/10 shadow-sm overflow-hidden ${noPadding ? 'p-0' : 'p-6'} ${className}`}>
      {children}
    </div>
  );
}

export function StatusBadge({ children, variant = "default" }: { children: React.ReactNode, variant?: "success" | "warning" | "error" | "info" | "default" }) {
  const styles = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    error: "bg-red-50 text-red-700 border-red-200",
    info: "bg-brand-aqua/10 text-brand-aqua border-brand-aqua/20",
    default: "bg-slate-50 text-slate-600 border-slate-200"
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${styles[variant]}`}>
      {children}
    </span>
  );
}

export function EmptyState({ icon, title, description }: { icon: React.ReactNode, title: string, description?: string }) {
  return (
    <div className="py-24 text-center px-4 flex flex-col items-center">
      <div className="text-brand-indigo/20 mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-brand-indigo/60">{title}</h3>
      {description && <p className="text-sm text-brand-indigo/40 mt-1">{description}</p>}
    </div>
  );
}

export function AppButton({ children, onClick, variant = "primary", disabled = false, icon, className="", type = "button", size = "md", title }: { children: React.ReactNode, onClick?: () => void, variant?: "primary" | "secondary" | "danger" | "ghost", disabled?: boolean, icon?: React.ReactNode, className?: string, type?: "button" | "submit" | "reset", size?: "sm" | "md" | "lg", title?: string }) {
  const sizes = {
    sm: "px-3 py-2 rounded-xl text-[10px]",
    md: "px-5 py-3 rounded-2xl text-xs",
    lg: "px-8 py-4 rounded-3xl text-sm"
  };
  
  const base = "flex items-center justify-center gap-2 font-black uppercase tracking-widest transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-brand-orange text-white hover:bg-[#e67a0f]",
    secondary: "bg-white border border-brand-indigo/20 text-brand-indigo hover:bg-brand-indigo/5",
    danger: "bg-red-50 border border-red-100 text-red-600 hover:bg-red-100",
    ghost: "bg-transparent border-transparent text-brand-indigo/60 hover:bg-brand-indigo/5 hover:text-brand-indigo shadow-none"
  };

  return (
    <button title={title} type={type} onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {icon}
      {children}
    </button>
  );
}
