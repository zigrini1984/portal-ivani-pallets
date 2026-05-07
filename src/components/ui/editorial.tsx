import React from "react";
import Link from "next/link";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

// ─── 1. AppShell ─────────────────────────────────────────────────────────────
// Wraps the admin area: real sidebar (with routes+logout) + content area.
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-[var(--ivani-bg)] text-[var(--ivani-text)]">
      {/* Sidebar — handles both desktop sticky and mobile drawer */}
      <AdminSidebar />

      {/* Main content — md:pl accounts for the sticky 256px sidebar */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64">
        <main className="flex-1 p-6 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}

// ─── 2. FloatingSidebar ───────────────────────────────────────────────────────
// Kept for backwards compatibility — not used in AppShell any more.
export function FloatingSidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-64 fixed top-0 bottom-0 left-0 p-6 floating-sidebar z-50">
      <div className="mb-10 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[var(--ivani-primary)] flex items-center justify-center text-white font-bold text-sm">
          IP
        </div>
        <h1 className="text-lg font-bold tracking-tight text-[var(--ivani-primary)]">Ivani Pallets</h1>
      </div>
      <nav className="flex-1 flex flex-col gap-1">
        {[
          { label: "Coletas",     href: "/admin/coleta" },
          { label: "Triagem",     href: "/admin/triagem" },
          { label: "Manutenção",  href: "/admin/manutencao" },
          { label: "Estoque",     href: "/admin/estoque" },
          { label: "Relatórios",  href: "/admin/relatorios" },
          { label: "Configuração",href: "/admin/configuracao" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="px-4 py-2.5 rounded-xl hover:bg-[var(--ivani-bg)] text-[var(--ivani-text)] font-medium transition-colors text-sm"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto p-4 rounded-xl border border-[var(--ivani-border)] bg-[var(--ivani-bg)]">
        <p className="text-sm font-medium">Suporte Operacional</p>
        <p className="text-xs text-[var(--ivani-muted)] mt-1">v2.1 - Editorial</p>
      </div>
    </aside>
  );
}

// ─── 3. EditorialHeader ───────────────────────────────────────────────────────
export function EditorialHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-8 border-b border-[var(--ivani-border)] pb-6 relative">
      <div className="absolute -bottom-0.5 left-0 w-12 h-0.5 bg-[var(--ivani-secondary)] rounded-full" />
      <h2 className="text-2xl md:text-3xl font-bold text-[var(--ivani-text)] tracking-tight font-display">
        {title}
      </h2>
      {subtitle && (
        <p className="text-[var(--ivani-muted)] mt-1.5 text-base">{subtitle}</p>
      )}
    </header>
  );
}

// ─── 4. KpiCard ──────────────────────────────────────────────────────────────
export function KpiCard({
  title,
  value,
  trend,
  trendUp,
  accent = "primary",
}: {
  title: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  accent?: "primary" | "teal" | "amber" | "red" | "blue" | "purple";
}) {
  const accentMap = {
    primary: { bar: "bg-[var(--ivani-primary)]", value: "text-[var(--ivani-primary)]" },
    teal:    { bar: "bg-[var(--ivani-teal)]",    value: "text-[var(--ivani-teal)]" },
    amber:   { bar: "bg-[#F0BE49]",              value: "text-[#9A7820]" },
    red:     { bar: "bg-red-500",                value: "text-red-600" },
    blue:    { bar: "bg-[var(--ivani-blue)]",    value: "text-[var(--ivani-blue)]" },
    purple:  { bar: "bg-[var(--ivani-purple)]",  value: "text-[var(--ivani-purple)]" },
  };
  const a = accentMap[accent];

  return (
    <div className="editorial-card p-5 relative overflow-hidden group">
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${a.bar} opacity-70`} />
      <p className="text-xs font-semibold text-[var(--ivani-muted)] uppercase tracking-wider mb-3">
        {title}
      </p>
      <p className={`text-3xl font-bold tracking-tight ${a.value}`}>{value}</p>
      {trend && (
        <p
          className={`text-xs mt-2 font-medium ${
            trendUp ? "text-[var(--ivani-teal)]" : "text-red-500"
          }`}
        >
          {trendUp ? "↑" : "↓"} {trend}
        </p>
      )}
    </div>
  );
}

// ─── 5. StatusBadge ──────────────────────────────────────────────────────────
export function StatusBadge({
  status,
  variant = "default",
}: {
  status: string;
  variant?: "success" | "warning" | "error" | "default" | "info";
}) {
  const colors = {
    success: "bg-[var(--ivani-teal)]/10 text-[var(--ivani-teal)] border-[var(--ivani-teal)]/25",
    warning: "bg-[#F0BE49]/15 text-[#9A7820] border-[#F0BE49]/40",
    error:   "bg-red-500/10 text-red-600 border-red-500/20",
    info:    "bg-[var(--ivani-blue)]/10 text-[var(--ivani-blue)] border-[var(--ivani-blue)]/20",
    default: "bg-[var(--ivani-bg)] text-[var(--ivani-muted)] border-[var(--ivani-border)]",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide border ${colors[variant]}`}
    >
      {status}
    </span>
  );
}

// ─── 6. EmptyState ───────────────────────────────────────────────────────────
export function EmptyState({
  message,
  actionLabel,
}: {
  message: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 mb-4 rounded-2xl bg-[var(--ivani-bg)] flex items-center justify-center">
        <span className="text-2xl opacity-40">📋</span>
      </div>
      <p className="text-[var(--ivani-muted)] text-base mb-4">{message}</p>
      {actionLabel && (
        <ActionButton>{actionLabel}</ActionButton>
      )}
    </div>
  );
}

// ─── 7. ActionButton ─────────────────────────────────────────────────────────
export function ActionButton({
  children,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary:
      "bg-[var(--ivani-primary)] text-white hover:bg-[var(--ivani-primary)]/90 shadow-sm",
    secondary:
      "bg-[var(--ivani-secondary)] text-[var(--ivani-text)] hover:bg-[var(--ivani-secondary)]/90",
    outline:
      "bg-transparent border border-[var(--ivani-border)] text-[var(--ivani-text)] hover:border-[var(--ivani-primary)]/50 hover:text-[var(--ivani-primary)] hover:bg-[var(--ivani-bg)]",
  };

  return (
    <button className={`${base} ${variants[variant]}`} {...props}>
      {children}
    </button>
  );
}

// ─── 8. FilterBar ────────────────────────────────────────────────────────────
export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap gap-3 p-4 editorial-card mb-6 items-center">
      {children}
    </div>
  );
}

// ─── 9. DataTable ────────────────────────────────────────────────────────────
export function DataTable({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="w-full overflow-x-auto editorial-card">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[var(--ivani-border)] bg-[var(--ivani-bg)]/60">
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-5 py-4 text-[11px] font-semibold text-[var(--ivani-muted)] uppercase tracking-wider whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--ivani-border)]">
          {children}
        </tbody>
      </table>
    </div>
  );
}

// ─── 10. OperationalFlow ─────────────────────────────────────────────────────
export function OperationalFlow({ steps }: { steps: string[] }) {
  return (
    <div className="flex items-center gap-3 w-full overflow-x-auto py-4">
      {steps.map((step, idx) => (
        <React.Fragment key={idx}>
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-[var(--ivani-surface)] border-2 border-[var(--ivani-primary)] flex items-center justify-center font-bold text-[var(--ivani-primary)] text-sm">
              {idx + 1}
            </div>
            <span className="text-xs font-medium text-center whitespace-nowrap text-[var(--ivani-text)]">
              {step}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div className="h-px flex-1 min-w-[32px] bg-[var(--ivani-border)]" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── 11. HeroProcessBanner ───────────────────────────────────────────────────
export function HeroProcessBanner({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="relative rounded-2xl overflow-hidden mb-8 bg-[var(--ivani-primary)]">
      {/* Subtle texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
          backgroundSize: "12px 12px",
        }}
      />
      {/* Decorative circle */}
      <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white opacity-5" />
      <div className="absolute -right-8 bottom-0 w-48 h-48 rounded-full bg-[var(--ivani-secondary)] opacity-10" />

      <div className="relative z-10 p-8 md:p-10 text-white">
        <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight font-display">
          {title}
        </h2>
        <p className="text-base opacity-80 leading-relaxed max-w-xl">{description}</p>
      </div>
    </div>
  );
}
