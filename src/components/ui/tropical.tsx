"use client";

import React from "react";
import { motion } from "framer-motion";

// ─── PageShell ───────────────────────────────────────────────────────────────
// Thin content wrapper — the sidebar is provided by AdminLayout (AppShell).
// Keeps existing prop signature so all pages work without changes.
export function PageShell({
  children,
  title,
  subtitle,
  actions,
  hideHeader = false,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  hideHeader?: boolean;
}) {
  return (
    <div className="w-full pb-20">
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-6 border-b border-[var(--ivani-border)] relative">
          {/* Accent underline */}
          <div className="absolute bottom-0 left-0 w-12 h-0.5 bg-[var(--ivani-secondary)] rounded-full" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--ivani-text)] tracking-tight font-display">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-[var(--ivani-muted)] mt-1 font-medium">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── SectionHeader ───────────────────────────────────────────────────────────
export function SectionHeader({
  title,
  description,
  icon,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 mb-6">
      {icon && (
        <div className="w-11 h-11 rounded-2xl bg-[var(--ivani-primary)]/10 text-[var(--ivani-primary)] flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
      )}
      <div>
        <h2 className="text-lg font-bold text-[var(--ivani-text)] font-display">{title}</h2>
        {description && (
          <p className="text-sm text-[var(--ivani-muted)] mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
}

// ─── KPIGrid ─────────────────────────────────────────────────────────────────
export function KPIGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      {children}
    </div>
  );
}

// ─── KPICard ─────────────────────────────────────────────────────────────────
// Keeps all props; maps colorVariant to new editorial tokens.
export function KPICard({
  title,
  value,
  unit,
  icon,
  colorVariant = "default",
  description,
}: {
  title: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  colorVariant?: "default" | "orange" | "aqua" | "jasmine" | "indigo" | "primary" | "floral" | "cream";
  description?: string;
}) {
  // Accent color per variant — used on the value & icon bg
  const accent: Record<string, { value: string; icon: string; bar: string }> = {
    default:  { value: "text-[var(--ivani-primary)]", icon: "bg-[var(--ivani-primary)]/10 text-[var(--ivani-primary)]",  bar: "bg-[var(--ivani-primary)]" },
    orange:   { value: "text-[#DD5C36]",              icon: "bg-[#DD5C36]/10 text-[#DD5C36]",                            bar: "bg-[#DD5C36]" },
    aqua:     { value: "text-[var(--ivani-teal)]",    icon: "bg-[var(--ivani-teal)]/10 text-[var(--ivani-teal)]",        bar: "bg-[var(--ivani-teal)]" },
    jasmine:  { value: "text-[#B8902E]",              icon: "bg-[#F0BE49]/20 text-[#B8902E]",                            bar: "bg-[#F0BE49]" },
    indigo:   { value: "text-[var(--ivani-purple)]",  icon: "bg-[var(--ivani-purple)]/10 text-[var(--ivani-purple)]",    bar: "bg-[var(--ivani-purple)]" },
    primary:  { value: "text-[var(--ivani-primary)]", icon: "bg-[var(--ivani-primary)]/10 text-[var(--ivani-primary)]",  bar: "bg-[var(--ivani-primary)]" },
    floral:   { value: "text-[var(--ivani-text)]",    icon: "bg-[var(--ivani-border)] text-[var(--ivani-muted)]",        bar: "bg-[var(--ivani-secondary)]" },
    cream:    { value: "text-[var(--ivani-text)]",    icon: "bg-[var(--ivani-border)] text-[var(--ivani-muted)]",        bar: "bg-[var(--ivani-border)]" },
  };

  const a = accent[colorVariant];

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="editorial-card p-5 relative overflow-hidden group"
    >
      {/* Top bar accent */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${a.bar} opacity-60`} />

      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-semibold text-[var(--ivani-muted)] uppercase tracking-wider leading-tight pr-2">
          {title}
        </p>
        {icon && (
          <div className={`p-2 rounded-xl flex-shrink-0 ${a.icon}`}>{icon}</div>
        )}
      </div>

      <p className={`text-3xl font-bold tracking-tight ${a.value}`}>
        {value}
        {unit && (
          <span className="text-xs font-semibold text-[var(--ivani-muted)] ml-1.5 uppercase tracking-wider">
            {unit}
          </span>
        )}
      </p>

      {description && (
        <p className="text-xs text-[var(--ivani-muted)] mt-2">{description}</p>
      )}
    </motion.div>
  );
}

// ─── AppCard ─────────────────────────────────────────────────────────────────
export function AppCard({
  children,
  className = "",
  noPadding = false,
}: {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}) {
  return (
    <div
      className={`editorial-card overflow-hidden ${noPadding ? "p-0" : "p-6"} ${className}`}
    >
      {children}
    </div>
  );
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────
export function StatusBadge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "success" | "warning" | "error" | "info" | "default";
}) {
  const styles = {
    success: "bg-[var(--ivani-teal)]/10 text-[var(--ivani-teal)] border-[var(--ivani-teal)]/25",
    warning: "bg-[#F0BE49]/15 text-[#9A7820] border-[#F0BE49]/40",
    error:   "bg-red-500/10 text-red-600 border-red-500/20",
    info:    "bg-[var(--ivani-blue)]/10 text-[var(--ivani-blue)] border-[var(--ivani-blue)]/20",
    default: "bg-[var(--ivani-bg)] text-[var(--ivani-muted)] border-[var(--ivani-border)]",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide border ${styles[variant]}`}
    >
      {children}
    </span>
  );
}

// ─── EmptyState ──────────────────────────────────────────────────────────────
export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="py-20 text-center px-4 flex flex-col items-center gap-3">
      <div className="w-16 h-16 rounded-2xl bg-[var(--ivani-bg)] text-[var(--ivani-muted)] flex items-center justify-center mb-2">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-[var(--ivani-text)] font-display">{title}</h3>
      {description && (
        <p className="text-sm text-[var(--ivani-muted)] max-w-xs leading-relaxed">{description}</p>
      )}
    </div>
  );
}

// ─── AppButton ───────────────────────────────────────────────────────────────
// Keeps full original prop signature unchanged.
export function AppButton({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  icon,
  className = "",
  type = "button",
  size = "md",
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
  size?: "sm" | "md" | "lg";
  title?: string;
}) {
  const sizes = {
    sm: "px-3 py-1.5 rounded-lg text-xs",
    md: "px-4 py-2.5 rounded-xl text-sm",
    lg: "px-6 py-3 rounded-xl text-base",
  };

  const base =
    "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-[var(--ivani-primary)] text-white hover:bg-[var(--ivani-primary)]/90 shadow-sm shadow-[var(--ivani-primary)]/20",
    secondary:
      "bg-[var(--ivani-surface)] border border-[var(--ivani-border)] text-[var(--ivani-text)] hover:border-[var(--ivani-primary)]/40 hover:bg-[var(--ivani-bg)]",
    danger:
      "bg-red-50 border border-red-200 text-red-600 hover:bg-red-100",
    ghost:
      "bg-transparent text-[var(--ivani-muted)] hover:bg-[var(--ivani-bg)] hover:text-[var(--ivani-text)]",
  };

  return (
    <button
      title={title}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}
