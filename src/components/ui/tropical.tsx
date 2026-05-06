import React from "react";
import { motion } from "framer-motion";

export function PageShell({ children, title, subtitle, actions, hideHeader = false }: { children: React.ReactNode, title: string, subtitle?: string, actions?: React.ReactNode, hideHeader?: boolean }) {
  return (
    <div className="min-h-screen bg-brand-sand/30 text-brand-mirage pb-20">
      {!hideHeader && (
        <header className="bg-white border-b border-brand-mirage/5 sticky top-0 z-30 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-brand-mirage">{title}</h1>
              {subtitle && <p className="text-sm text-brand-mirage/60 font-medium">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
          </div>
        </header>
      )}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        {children}
      </main>
    </div>
  );
}

export function SectionHeader({ title, description, icon }: { title: string, description?: string, icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      {icon && <div className="w-12 h-12 rounded-2xl bg-brand-teal/10 text-brand-teal flex items-center justify-center">{icon}</div>}
      <div>
        <h2 className="text-xl font-bold text-brand-mirage">{title}</h2>
        {description && <p className="text-sm text-brand-mirage/60">{description}</p>}
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
  // Mapping old tropical variants to new premium ones
  const colors = {
    default: "bg-white border-brand-mirage/10 text-brand-mirage",
    orange: "bg-white border-brand-orange/20 text-brand-orange shadow-sm",
    aqua: "bg-white border-brand-teal/20 text-brand-teal shadow-sm",
    jasmine: "bg-white border-brand-mirage/10 text-amber-700 shadow-sm",
    indigo: "bg-brand-mirage text-white shadow-md",
    primary: "bg-white border-emerald-200 text-emerald-700 shadow-sm",
    floral: "bg-brand-sand/50 border-brand-mirage/10 text-brand-mirage",
    cream: "bg-white border-brand-mirage/5 text-brand-mirage shadow-sm",
  };
  
  const iconColors = {
    default: "bg-brand-mirage/5 text-brand-mirage",
    orange: "bg-brand-orange/10 text-brand-orange",
    aqua: "bg-brand-teal/10 text-brand-teal",
    jasmine: "bg-amber-50 text-amber-600",
    indigo: "bg-white/10 text-white",
    primary: "bg-emerald-50 text-emerald-600",
    floral: "bg-brand-mirage/5 text-brand-mirage",
    cream: "bg-brand-mirage/5 text-brand-mirage",
  };

  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className={`rounded-2xl p-5 border transition-all card-shadow ${colors[colorVariant]}`}
    >
      <div className="flex items-center justify-between mb-3">
        {icon && <div className={`p-2.5 rounded-xl ${iconColors[colorVariant]}`}>{icon}</div>}
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-bold tracking-tight">
          {value}
          {unit && <span className="text-xs font-semibold opacity-70 ml-1 uppercase tracking-wider">{unit}</span>}
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider opacity-70 mt-1">{title}</span>
        {description && <p className="text-xs font-medium opacity-50 mt-1">{description}</p>}
      </div>
    </motion.div>
  );
}

export function AppCard({ children, className = "", noPadding = false }: { children: React.ReactNode, className?: string, noPadding?: boolean }) {
  return (
    <div className={`bg-white rounded-2xl border border-brand-mirage/10 card-shadow overflow-hidden ${noPadding ? 'p-0' : 'p-6'} ${className}`}>
      {children}
    </div>
  );
}

export function StatusBadge({ children, variant = "default" }: { children: React.ReactNode, variant?: "success" | "warning" | "error" | "info" | "default" }) {
  const styles = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    error: "bg-red-50 text-red-700 border-red-200",
    info: "bg-brand-teal/10 text-brand-teal border-brand-teal/20",
    default: "bg-slate-50 text-slate-600 border-slate-200"
  };

  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide border ${styles[variant]}`}>
      {children}
    </span>
  );
}

export function EmptyState({ icon, title, description }: { icon: React.ReactNode, title: string, description?: string }) {
  return (
    <div className="py-20 text-center px-4 flex flex-col items-center">
      <div className="text-brand-mirage/20 mb-4 bg-brand-sand/50 p-6 rounded-full">{icon}</div>
      <h3 className="text-lg font-bold text-brand-mirage">{title}</h3>
      {description && <p className="text-sm text-brand-mirage/60 mt-2 max-w-sm">{description}</p>}
    </div>
  );
}

export function AppButton({ children, onClick, variant = "primary", disabled = false, icon, className="", type = "button", size = "md", title }: { children: React.ReactNode, onClick?: () => void, variant?: "primary" | "secondary" | "danger" | "ghost", disabled?: boolean, icon?: React.ReactNode, className?: string, type?: "button" | "submit" | "reset", size?: "sm" | "md" | "lg", title?: string }) {
  const sizes = {
    sm: "px-3 py-1.5 rounded-lg text-xs",
    md: "px-4 py-2.5 rounded-xl text-sm",
    lg: "px-6 py-3 rounded-xl text-base"
  };
  
  const base = "flex items-center justify-center gap-2 font-semibold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-brand-orange text-white hover:bg-[#E04F00] border border-transparent",
    secondary: "bg-white border border-brand-mirage/20 text-brand-mirage hover:bg-brand-mirage/5",
    danger: "bg-red-50 border border-red-100 text-red-600 hover:bg-red-100",
    ghost: "bg-transparent border-transparent text-brand-mirage/70 hover:bg-brand-mirage/5 hover:text-brand-mirage shadow-none"
  };

  return (
    <button title={title} type={type} onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {icon}
      {children}
    </button>
  );
}

