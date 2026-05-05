"use client";

import React from "react";
import { ArrowLeft, LogOut } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { logout } from "@/app/actions/auth";

interface AdminPageHeaderProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  /** optional action slot — e.g. an extra button on the right */
  action?: React.ReactNode;
}

/**
 * Consistent sticky header used on every /admin/* page.
 * Renders: back-arrow · icon + title/subtitle · <AdminNav> · logout
 */
export function AdminPageHeader({
  title,
  subtitle,
  icon,
  action,
}: AdminPageHeaderProps) {
  return (
    <header className="bg-white border-b border-brand-pink/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Left: back + brand */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Voltar"
            >
              <ArrowLeft size={18} className="text-text-dark/40" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-brand-cyan rounded-lg flex items-center justify-center text-white shrink-0">
                {icon}
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-bold text-sm text-brand-cyan">
                  {title}
                </span>
                <span className="text-[10px] font-bold text-text-dark/30 uppercase tracking-tighter mt-0.5">
                  {subtitle}
                </span>
              </div>
            </div>
          </div>

          {/* Center: nav */}
          <AdminNav />

          {/* Right: optional action + logout */}
          <div className="flex items-center gap-2">
            {action}
            <button
              onClick={() => logout()}
              className="p-2 text-text-dark/40 hover:text-red-500 transition-colors"
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
