"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { label: "Coletas", href: "/admin/coleta" },
  { label: "Triagem", href: "/admin/triagem" },
  { label: "Manutenção", href: "/admin/manutencao" },
  { label: "Estoque", href: "/admin/estoque" },
  { label: "Faturamento", href: "/admin/faturamento" },
  { label: "Configuração", href: "/admin/configuracao" },
  { label: "Relatórios", href: "/admin/relatorios" },
];

export function AdminNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Desktop Nav */}
      <nav className="hidden md:flex items-center gap-1 ml-6">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                isActive
                  ? "bg-brand-cyan/5 text-brand-cyan"
                  : "text-text-dark/40 hover:text-text-dark/60 hover:bg-gray-50"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Mobile Menu Button */}
      <div className="md:hidden flex items-center ml-2">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-text-dark/60 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] md:hidden"
            />
            
            {/* Drawer */}
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[280px] bg-white z-[70] md:hidden shadow-2xl border-l border-brand-pink/10 flex flex-col p-6"
            >
              <div className="flex justify-between items-center mb-8">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-cyan">Navegação Administrativa</span>
                <button onClick={() => setIsOpen(false)} className="p-2 text-text-dark/40">
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-2 overflow-y-auto pr-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center justify-between px-5 py-4 rounded-2xl text-sm font-bold transition-all ${
                        isActive
                          ? "bg-brand-cyan text-white shadow-lg shadow-brand-cyan/20"
                          : "text-text-dark/60 hover:bg-gray-50"
                      }`}
                    >
                      {item.label}
                      {isActive && <motion.div layoutId="active-dot" className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </Link>
                  );
                })}
              </div>

              <div className="mt-auto pt-6 border-t border-brand-pink/5">
                <div className="text-[9px] font-bold text-text-dark/20 uppercase tracking-widest text-center">Ivani Pallets — Portal 2.1</div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

