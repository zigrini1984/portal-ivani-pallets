"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu, X, Package, Search, Truck, Settings,
  BarChart2, FileText, Wrench, Archive, LogOut,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { logout } from "@/app/actions/auth";

// ─── Nav items — routes unchanged ─────────────────────────────────────────────
const navItems = [
  { label: "Coletas",     href: "/admin/coleta",       icon: Truck      },
  { label: "Triagem",     href: "/admin/triagem",      icon: Search     },
  { label: "Manutenção",  href: "/admin/manutencao",   icon: Wrench     },
  { label: "Estoque",     href: "/admin/estoque",      icon: Archive    },
  { label: "Faturamento", href: "/admin/faturamento",  icon: FileText   },
  { label: "Relatórios",  href: "/admin/relatorios",   icon: BarChart2  },
  { label: "Configuração",href: "/admin/configuracao", icon: Settings   },
];

// ─── NavLink — used in both desktop and mobile ────────────────────────────────
function NavLink({
  item,
  isActive,
  onClick,
}: {
  item: (typeof navItems)[number];
  isActive: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`
        group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
        transition-all duration-150
        ${
          isActive
            ? "bg-[var(--ivani-primary)] text-white shadow-sm"
            : "text-[var(--ivani-muted)] hover:bg-[var(--ivani-bg)] hover:text-[var(--ivani-text)]"
        }
      `}
    >
      <Icon
        size={17}
        className={`flex-shrink-0 transition-transform ${isActive ? "" : "group-hover:scale-110"}`}
      />
      <span className="flex-1 truncate">{item.label}</span>
      {isActive && <ChevronRight size={14} className="opacity-60" />}
    </Link>
  );
}

// ─── Logo Block ───────────────────────────────────────────────────────────────
function LogoBlock() {
  return (
    <Link href="/admin/coleta" className="flex items-center gap-3 group px-2">
      <div className="relative">
        <img 
          src="/branding/logo-handwritten.png" 
          alt="Ivani Pallets" 
          className="h-12 w-auto object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
        />
        {/* Subtle bic pen underline */}
        <div className="absolute -bottom-1 left-0 w-full h-[1px] bg-[var(--ivani-primary)] opacity-40 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-700" />
      </div>
    </Link>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* ── Desktop Sidebar ──────────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 z-40 floating-sidebar flex-shrink-0 paper-texture">
        {/* Logo */}
        <div className="h-20 flex items-center px-4 border-b border-[var(--ivani-border)] bg-white/50">
          <LogoBlock />
        </div>

        {/* Nav */}
        <nav className="flex-1 py-6 px-3 flex flex-col gap-1 overflow-y-auto">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--ivani-muted)] mb-3 px-3">
            Menu Principal
          </p>
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={pathname === item.href}
            />
          ))}
        </nav>

        {/* Footer / Logout */}
        <div className="p-3 border-t border-[var(--ivani-border)]">
          {/* Version badge */}
          <div className="px-3 py-2 mb-2 rounded-xl bg-[var(--ivani-bg)]">
            <p className="text-xs font-medium text-[var(--ivani-muted)]">
              Ivani Pallets
            </p>
            <p className="text-[10px] text-[var(--ivani-muted)] opacity-60 mt-0.5">
              v2.1 · Sistema Operacional
            </p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="
                flex items-center gap-3 w-full px-3 py-2.5 rounded-xl
                text-sm font-medium text-[var(--ivani-muted)]
                hover:bg-red-50 hover:text-red-600
                transition-all duration-150
              "
            >
              <LogOut size={17} />
              Sair do Sistema
            </button>
          </form>
        </div>
      </aside>

      {/* ── Mobile Header ───────────────────────────────────────────────────── */}
      <div className="md:hidden flex items-center justify-between h-14 bg-[var(--ivani-surface)] border-b border-[var(--ivani-border)] px-4 sticky top-0 z-40">
        <LogoBlock />
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-[var(--ivani-muted)] hover:bg-[var(--ivani-bg)] rounded-lg transition-colors"
          aria-label="Toggle navigation"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* ── Mobile Drawer ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-[var(--ivani-text)]/20 backdrop-blur-sm z-[60] md:hidden"
            />

            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-[var(--ivani-surface)] z-[70] md:hidden shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between h-16 px-5 border-b border-[var(--ivani-border)]">
                <LogoBlock />
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-[var(--ivani-muted)] hover:bg-[var(--ivani-bg)] rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Nav */}
              <nav className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--ivani-muted)] mb-3 px-3">
                  Menu Principal
                </p>
                {navItems.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    isActive={pathname === item.href}
                    onClick={() => setIsOpen(false)}
                  />
                ))}
              </nav>

              {/* Logout */}
              <div className="p-3 border-t border-[var(--ivani-border)]">
                <form action={logout}>
                  <button
                    type="submit"
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--ivani-muted)] hover:bg-red-50 hover:text-red-600 transition-all"
                  >
                    <LogOut size={17} />
                    Sair do Sistema
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
