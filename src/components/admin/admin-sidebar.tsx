"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Menu, X, Package, Search, LayoutDashboard, Truck, Settings, 
  BarChart2, FileText, Wrench, Archive, LogOut 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { logout } from "@/app/actions/auth";

const navItems = [
  { label: "Coletas", href: "/admin/coleta", icon: <Truck size={20} /> },
  { label: "Triagem", href: "/admin/triagem", icon: <Search size={20} /> },
  { label: "Manutenção", href: "/admin/manutencao", icon: <Wrench size={20} /> },
  { label: "Estoque", href: "/admin/estoque", icon: <Archive size={20} /> },
  { label: "Faturamento", href: "/admin/faturamento", icon: <FileText size={20} /> },
  { label: "Relatórios", href: "/admin/relatorios", icon: <BarChart2 size={20} /> },
  { label: "Configuração", href: "/admin/configuracao", icon: <Settings size={20} /> },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#133020] border-r border-[#133020]/10 text-[#F8EDD9] h-screen shrink-0 sticky top-0 z-40">
        <div className="h-20 flex items-center px-6 border-b border-[#F8EDD9]/10">
          <Link href="/admin/coleta" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-[#DD5C36] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Package className="text-white" size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-white font-display">Portal Ivani</span>
              <span className="text-[10px] font-bold text-[#F8EDD9]/50 uppercase tracking-widest">Operação</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 py-8 px-4 flex flex-col gap-2 overflow-y-auto">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#F8EDD9]/40 mb-2 px-2">Menu Principal</div>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-[#DD5C36] text-white shadow-md shadow-[#DD5C36]/20"
                    : "text-[#F8EDD9]/70 hover:bg-[#F8EDD9]/10 hover:text-white"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#F8EDD9]/10">
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-[#F8EDD9]/70 hover:bg-red-500/10 hover:text-red-400 transition-all"
            >
              <LogOut size={20} />
              Sair do Sistema
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile Header / Nav Toggle */}
      <div className="md:hidden flex items-center justify-between h-16 bg-[#133020] px-4 sticky top-0 z-40 border-b border-[#F8EDD9]/10">
        <Link href="/admin/coleta" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#DD5C36] rounded-lg flex items-center justify-center">
            <Package className="text-white" size={16} />
          </div>
          <span className="font-bold text-sm text-white font-display">Portal Ivani</span>
        </Link>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-[#F8EDD9]/80 hover:bg-[#F8EDD9]/10 rounded-lg transition-colors"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-[#133020]/60 backdrop-blur-sm z-[60] md:hidden"
            />
            
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-[#133020] z-[70] md:hidden shadow-2xl border-r border-[#F8EDD9]/10 flex flex-col p-6"
            >
              <div className="flex justify-between items-center mb-8">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#DD5C36]">Navegação</span>
                <button onClick={() => setIsOpen(false)} className="p-2 text-[#F8EDD9]/40 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-2 overflow-y-auto pr-2 flex-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-4 py-4 rounded-2xl text-sm font-bold transition-all ${
                        isActive
                          ? "bg-[#DD5C36] text-white shadow-lg shadow-[#DD5C36]/20"
                          : "text-[#F8EDD9]/70 hover:bg-[#F8EDD9]/10 hover:text-white"
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              <div className="mt-auto pt-6 border-t border-[#F8EDD9]/10">
                <form action={logout}>
                  <button
                    type="submit"
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-[#F8EDD9]/70 hover:bg-red-500/10 hover:text-red-400 transition-all"
                  >
                    <LogOut size={20} />
                    Sair
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



