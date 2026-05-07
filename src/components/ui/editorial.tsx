import React from "react";
import Link from "next/link";

// 1. AppShell
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex w-full bg-[var(--ivani-bg)] text-[var(--ivani-text)] font-[var(--font-poppins)]">
      <FloatingSidebar />
      <div className="flex-1 flex flex-col p-6 lg:p-10 ml-0 lg:ml-[280px]">
        {children}
      </div>
    </div>
  );
}

// 2. FloatingSidebar
export function FloatingSidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-[280px] fixed top-0 bottom-0 left-0 p-6 floating-sidebar z-50">
      <div className="mb-10 flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-[var(--ivani-primary)] flex items-center justify-center text-white font-bold">
          IP
        </div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--ivani-primary)]">Ivani Pallets</h1>
      </div>
      <nav className="flex-1 flex flex-col gap-2">
        {['Dashboard', 'Triagem', 'Estoque', 'Relatórios', 'Configurações'].map((item) => (
          <Link
            key={item}
            href="#"
            className="px-4 py-3 rounded-xl hover:bg-[var(--ivani-bg)] text-[var(--ivani-text)] font-medium transition-colors"
          >
            {item}
          </Link>
        ))}
      </nav>
      <div className="mt-auto p-4 rounded-xl border border-[var(--ivani-border)] bg-[var(--ivani-bg)] hand-drawn-border">
        <p className="text-sm font-medium">Suporte Operacional</p>
        <p className="text-xs text-[var(--ivani-muted)] mt-1">v2.1 - Editorial</p>
      </div>
    </aside>
  );
}

// 3. EditorialHeader
export function EditorialHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-8 border-b border-[var(--ivani-border)] pb-6 relative">
      <div className="absolute -bottom-1 left-0 w-12 h-1 bg-[var(--ivani-secondary)] rounded-full"></div>
      <h2 className="text-3xl font-bold text-[var(--ivani-text)]">{title}</h2>
      {subtitle && <p className="text-[var(--ivani-muted)] mt-2 text-lg">{subtitle}</p>}
    </header>
  );
}

// 4. KpiCard
export function KpiCard({ title, value, trend, trendUp }: { title: string; value: string | number; trend?: string; trendUp?: boolean }) {
  return (
    <div className="p-6 editorial-card relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-16 h-16 bg-[var(--ivani-bg)] rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
      <p className="text-sm font-medium text-[var(--ivani-muted)] uppercase tracking-wider relative z-10">{title}</p>
      <p className="text-4xl font-semibold mt-3 text-[var(--ivani-primary)] relative z-10">{value}</p>
      {trend && (
        <p className={`text-sm mt-3 relative z-10 font-medium ${trendUp ? 'text-[var(--ivani-teal)]' : 'text-[var(--ivani-cherry)]'}`}>
          {trendUp ? '↑' : '↓'} {trend}
        </p>
      )}
    </div>
  );
}

// 5. StatusBadge
export function StatusBadge({ status, variant = 'default' }: { status: string; variant?: 'success' | 'warning' | 'error' | 'default' | 'info' }) {
  const colors = {
    success: 'bg-[var(--ivani-teal)]/10 text-[var(--ivani-teal)] border-[var(--ivani-teal)]/20',
    warning: 'bg-[var(--ivani-secondary)]/10 text-[var(--ivani-primary)] border-[var(--ivani-secondary)]/30',
    error: 'bg-red-500/10 text-red-600 border-red-500/20',
    info: 'bg-[var(--ivani-blue)]/10 text-[var(--ivani-blue)] border-[var(--ivani-blue)]/20',
    default: 'bg-[var(--ivani-bg)] text-[var(--ivani-muted)] border-[var(--ivani-border)]'
  };

  return (
    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${colors[variant]}`}>
      {status}
    </span>
  );
}

// 6. EmptyState
export function EmptyState({ message, actionLabel }: { message: string; actionLabel?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center editorial-card border-dashed">
      <div className="w-16 h-16 mb-4 rounded-full bg-[var(--ivani-bg)] flex items-center justify-center">
        <span className="text-2xl opacity-50">📋</span>
      </div>
      <p className="text-[var(--ivani-muted)] text-lg mb-4">{message}</p>
      {actionLabel && <ActionButton>{actionLabel}</ActionButton>}
    </div>
  );
}

// 7. ActionButton
export function ActionButton({ children, variant = 'primary', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' }) {
  const base = "px-6 py-2.5 rounded-xl font-medium transition-all duration-200 active:scale-95";
  const variants = {
    primary: "bg-[var(--ivani-primary)] text-white hover:bg-[var(--ivani-primary)]/90 soft-shadow",
    secondary: "bg-[var(--ivani-secondary)] text-[var(--ivani-text)] hover:bg-[var(--ivani-secondary)]/90",
    outline: "bg-transparent border-2 border-[var(--ivani-border)] text-[var(--ivani-text)] hover:border-[var(--ivani-primary)] hover:text-[var(--ivani-primary)]"
  };

  return (
    <button className={`${base} ${variants[variant]}`} {...props}>
      {children}
    </button>
  );
}

// 8. FilterBar
export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap gap-4 p-4 editorial-card mb-6 items-center justify-between">
      {children}
    </div>
  );
}

// 9. DataTable
export function DataTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="w-full overflow-x-auto editorial-card">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[var(--ivani-border)] bg-[var(--ivani-bg)]/50">
            {headers.map((h, i) => (
              <th key={i} className="px-6 py-4 text-xs font-semibold text-[var(--ivani-muted)] uppercase tracking-wider">
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

// 10. OperationalFlow
export function OperationalFlow({ steps }: { steps: string[] }) {
  return (
    <div className="flex items-center gap-4 w-full overflow-x-auto py-6">
      {steps.map((step, idx) => (
        <React.Fragment key={idx}>
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[var(--ivani-surface)] border-2 border-[var(--ivani-primary)] flex items-center justify-center font-bold text-[var(--ivani-primary)] z-10 relative">
              {idx + 1}
            </div>
            <span className="text-sm font-medium text-center whitespace-nowrap">{step}</span>
          </div>
          {idx < steps.length - 1 && (
            <div className="h-0.5 flex-1 min-w-[40px] bg-[var(--ivani-border)] relative -mt-6 hand-drawn-border"></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// 11. HeroProcessBanner
export function HeroProcessBanner({ title, description }: { title: string; description: string }) {
  return (
    <div className="relative p-8 md:p-12 editorial-card bg-gradient-to-br from-[var(--ivani-primary)] to-[var(--ivani-teal)] text-white overflow-hidden mb-8">
      <div className="relative z-10 max-w-2xl">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
        <p className="text-lg opacity-90 leading-relaxed">{description}</p>
      </div>
      {/* Decorative hand-drawn element */}
      <svg className="absolute top-0 right-0 w-64 h-full opacity-20 transform translate-x-1/4" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M0,0 C50,30 20,80 100,100 L100,0 Z" fill="currentColor" />
      </svg>
    </div>
  );
}
