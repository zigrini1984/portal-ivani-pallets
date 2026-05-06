import React from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { Package, LogOut } from "lucide-react";
import { logout } from "@/app/actions/auth";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-brand-sand/30">
      <header className="bg-white border-b border-brand-mirage/5 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-20">
            {/* Logo & Brand */}
            <Link href="/admin/coleta" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-brand-mirage rounded-xl flex items-center justify-center shadow-lg shadow-brand-mirage/10 group-hover:scale-105 transition-transform">
                <Package className="text-white" size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-brand-mirage tracking-tight">Portal Ivani</span>
                <span className="text-[10px] font-bold text-brand-mirage/30 uppercase tracking-widest">Admin Panel</span>
              </div>
            </Link>

            {/* Navigation */}
            <AdminNav />

            {/* User Actions */}
            <div className="flex items-center gap-4">
              <form action={logout}>
                <button
                  type="submit"
                  className="p-2.5 text-brand-mirage/40 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  title="Sair do Sistema"
                >
                  <LogOut size={20} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
