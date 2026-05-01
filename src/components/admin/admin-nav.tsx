"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

  return (
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
  );
}
