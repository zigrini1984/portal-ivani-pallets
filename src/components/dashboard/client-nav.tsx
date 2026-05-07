"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Settings, 
  Package, 
  TrendingUp, 
  LogOut,
  Menu,
  X
} from "lucide-react";
import { logout } from "@/app/actions/auth";

export function ClientNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);

  const navItems = [
    {
      name: "Visão Geral",
      href: "/cliente/dashboard",
      icon: LayoutDashboard
    },
    {
      name: "Operações",
      href: "/cliente/operacoes",
      icon: Package
    },
    {
      name: "Relatórios",
      href: "/cliente/relatorio",
      icon: TrendingUp
    }
  ];

  return (
    <nav className="flex items-center gap-2">
      {/* Desktop Nav */}
      <div className="hidden md:flex items-center gap-1 bg-neutral-50 p-1 rounded-2xl border border-neutral-200 shadow-sm">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive 
                  ? "bg-white text-neutral-900 shadow-sm border border-neutral-100" 
                  : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/50"
              }`}
            >
              <item.icon size={14} strokeWidth={isActive ? 2.5 : 2} />
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-600 hover:bg-neutral-100 transition-colors"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] bg-white md:hidden animate-in slide-in-from-right duration-300">
          <div className="p-6 flex flex-col h-full">
            <div className="flex justify-between items-center mb-10">
              <span className="text-lg font-bold text-neutral-900">Navegação</span>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex flex-col gap-3 flex-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-4 p-4 rounded-2xl text-base font-bold transition-all ${
                      isActive 
                        ? "bg-neutral-900 text-white shadow-lg" 
                        : "bg-neutral-50 text-neutral-600 border border-neutral-100"
                    }`}
                  >
                    <item.icon size={20} strokeWidth={2.5} />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            <button 
              onClick={() => logout()}
              className="mt-auto flex items-center gap-4 p-4 rounded-2xl bg-rose-50 text-rose-600 font-bold border border-rose-100"
            >
              <LogOut size={20} strokeWidth={2.5} />
              Sair da conta
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}


