"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Recycle, Leaf, ShieldCheck, Zap, 
  ChevronRight, ArrowRight, Loader2, X,
  LayoutDashboard, Truck, ClipboardList, 
  Wrench, Layers, BarChart3, Settings, 
  LogOut, Menu, User, Bell, Search,
  Banknote, Info
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BicPenBannerProps {
  title: string;
  subtitle: string;
  image: string;
  accentColor?: string;
  hueRotate?: string;
}

// ─── Components ───────────────────────────────────────────────────────────────

export function BicPenBanner({ 
  title, 
  subtitle, 
  image, 
  accentColor = "var(--ivani-primary)", 
  hueRotate = "0deg" 
}: BicPenBannerProps) {
  return (
    <div className="relative w-full mb-8 overflow-hidden rounded-3xl bg-white border border-[var(--ivani-border)] shadow-sm group">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none paper-texture" />
      
      <div className="flex flex-col md:flex-row items-center">
        <div className="flex-1 p-8 md:p-10 lg:pl-12 lg:pr-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-[1px] bg-[var(--ivani-primary)] opacity-40" />
              <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-[var(--ivani-primary)] opacity-60">
                Logística Inteligente
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--ivani-text)] tracking-tight leading-[1.1] mb-4">
              {title}
            </h2>
            <p className="text-sm md:text-base text-[var(--ivani-muted)] font-normal max-w-lg leading-relaxed opacity-80">
              {subtitle}
            </p>
            
            <div className="flex items-center gap-8 mt-6">
               <div className="flex flex-col gap-1.5">
                  <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-[var(--ivani-primary)] opacity-50">Industrial Premium</span>
                  <div className="flex gap-2 text-[var(--ivani-primary)] opacity-70">
                     <Recycle size={15} strokeWidth={1.5} />
                     <Leaf size={15} strokeWidth={1.5} />
                     <ShieldCheck size={15} strokeWidth={1.5} />
                  </div>
               </div>
               <div className="w-[1px] h-10 bg-[var(--ivani-border)]" />
               <div className="flex flex-col gap-1.5">
                  <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-[var(--ivani-accent)] opacity-50">Sustentabilidade</span>
                  <div className="flex gap-2 text-[var(--ivani-accent)] opacity-70">
                     <Zap size={15} strokeWidth={1.5} />
                     <Leaf size={15} strokeWidth={1.5} />
                  </div>
               </div>
            </div>
          </motion.div>
        </div>

        <div className="w-full md:w-[48%] h-72 md:h-80 relative overflow-hidden bg-white flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5 }}
            className="w-full h-full relative flex items-center justify-center"
          >
            <img 
              src={image} 
              alt="Operational Sketch"
              className="w-full h-full object-contain opacity-100 group-hover:scale-[1.05] transition-transform duration-1000 bg-white scale-[1.35]"
              style={{ 
                filter: `contrast(1.1) brightness(1.05) saturate(1.1) hue-rotate(${hueRotate})`,
                mixBlendMode: 'multiply'
              }}
            />
          </motion.div>
          {/* Edge fade to blend with text area */}
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white via-white/80 to-transparent z-10" />
        </div>
      </div>
    </div>
  );
}

export function PremiumCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`editorial-card paper-card ${className}`}
    >
      {children}
    </motion.div>
  );
}

interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
  icon?: React.ReactNode;
}

export function PremiumButton({ 
  children, 
  variant = "primary", 
  loading, 
  icon, 
  className = "",
  ...props 
}: PremiumButtonProps) {
  const variantCls = {
    primary: "btn-premium-primary",
    secondary: "btn-premium-secondary",
    ghost: "btn-premium-ghost"
  };

  return (
    <button 
      className={`btn-premium ${variantCls[variant]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
      <span>{children}</span>
    </button>
  );
}

export function PremiumInput({ label, ...props }: { label?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col w-full">
      {label && <label className="label-premium">{label}</label>}
      <input className="input-premium" {...props} />
    </div>
  );
}

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function PremiumModal({ isOpen, onClose, title, children }: PremiumModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-backdrop">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="modal-content max-h-[90vh] flex flex-col"
          >
            <div className="p-8 border-b border-[var(--ivani-border)] flex items-center justify-between bg-[var(--ivani-bg)]/30">
              <div>
                <h3 className="text-xl font-bold text-[var(--ivani-text)] tracking-tight">
                  {title}
                </h3>
                <div className="w-12 h-[2px] bg-[var(--ivani-primary)] mt-1.5 rounded-full" />
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-black/5 rounded-full transition-colors text-[var(--ivani-muted)]"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-8 overflow-y-auto flex-1">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function PremiumBadge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "blue" | "teal" | "orange" }) {
  const variants = {
    default: "bg-[var(--ivani-bg)] text-[var(--ivani-muted)]",
    blue: "bg-[var(--ivani-blue)]/8 text-[var(--ivani-blue)]",
    teal: "bg-[var(--ivani-teal)]/8 text-[var(--ivani-teal)]",
    orange: "bg-amber-50 text-amber-700"
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${variants[variant]}`}>
      {children}
    </span>
  );
}

// ─── AppShell ─────────────────────────────────────────────────────────────

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setSidebarOpen] = React.useState(true);
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const menuItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard size={20} /> },
    { label: "Coletas", href: "/admin/coleta", icon: <Truck size={20} /> },
    { label: "Triagem", href: "/admin/triagem", icon: <ClipboardList size={20} /> },
    { label: "Manutenção", href: "/admin/manutencao", icon: <Wrench size={20} /> },
    { label: "Estoque", href: "/admin/estoque", icon: <Layers size={20} /> },
    { label: "Faturamento", href: "/admin/faturamento", icon: <Banknote size={20} /> },
    { label: "Relatórios", href: "/admin/relatorios", icon: <BarChart3 size={20} /> },
    { label: "Configurações", href: "/admin/configuracao", icon: <Settings size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-[var(--ivani-bg)] flex overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        className="bg-white border-r border-[var(--ivani-border)] relative z-50 overflow-hidden hidden lg:block"
      >
        <div className="h-full flex flex-col w-[280px]">
          {/* Logo Area */}
          <div className="p-8 pb-10">
            <div className="flex items-center gap-4 mb-2">
               <div className="w-10 h-10 rounded-2xl bg-[var(--ivani-primary)] flex items-center justify-center text-white shadow-lg">
                  <Recycle size={22} strokeWidth={2.5} />
               </div>
               <div>
                  <h1 className="text-lg font-black text-[var(--ivani-text)] tracking-tighter leading-none">IVANI</h1>
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--ivani-muted)] opacity-50">Industrial Premium</span>
               </div>
            </div>
            <div className="w-full h-[1px] bg-[var(--ivani-border)] opacity-40 mt-6" />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 group ${
                    isActive
                      ? "bg-[var(--ivani-bg)] text-[var(--ivani-primary)] shadow-sm border border-[var(--ivani-border)]/50"
                      : "text-[var(--ivani-muted)] hover:text-[var(--ivani-text)] hover:bg-[var(--ivani-bg)]/50"
                  }`}
                >
                  <div className={`transition-transform duration-500 ${isActive ? "scale-110" : "group-hover:scale-110 opacity-40"}`}>
                    {item.icon}
                  </div>
                  {item.label}
                  {isActive && (
                    <motion.div layoutId="active-indicator" className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--ivani-primary)] shadow-[0_0_8px_var(--ivani-primary)]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Info / Footer */}
          <div className="p-6 mt-auto">
            <div className="p-5 bg-[var(--ivani-bg)]/50 rounded-[2rem] border border-[var(--ivani-border)]/50">
               <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-[var(--ivani-border)] shadow-sm">
                     <User size={18} className="text-[var(--ivani-muted)]" />
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black text-[var(--ivani-text)] uppercase tracking-tight">Administrador</span>
                     <span className="text-[8px] font-bold text-[var(--ivani-muted)] uppercase tracking-widest opacity-40">Operação Global</span>
                  </div>
               </div>
               <button 
                 onClick={handleLogout}
                 className="w-full flex items-center justify-center gap-3 py-3 bg-white border border-[var(--ivani-border)]/50 rounded-xl text-[9px] font-black uppercase tracking-widest text-red-400 hover:bg-red-50 hover:text-red-600 transition-all active:scale-95 shadow-sm"
               >
                 <LogOut size={14} /> Encerrar Sessão
               </button>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-[var(--ivani-border)] flex items-center justify-between px-6 lg:px-10 z-40">
           <div className="flex items-center gap-4 lg:gap-10">
              <button 
                onClick={() => setSidebarOpen(!isSidebarOpen)}
                className="p-3 text-[var(--ivani-muted)] hover:bg-[var(--ivani-bg)] rounded-xl transition-all"
              >
                <Menu size={22} />
              </button>
              
              <div className="hidden md:flex items-center gap-4 px-5 py-2.5 bg-[var(--ivani-bg)]/40 rounded-xl border border-[var(--ivani-border)]/50 group">
                 <Search size={16} className="text-[var(--ivani-muted)] opacity-40 group-focus-within:text-[var(--ivani-primary)] transition-colors" />
                 <input 
                   type="text" 
                   placeholder="Pesquisa global..." 
                   className="bg-transparent border-none outline-none text-[11px] font-black uppercase tracking-widest text-[var(--ivani-text)] placeholder:text-[var(--ivani-muted)]/30 w-48 lg:w-64"
                 />
              </div>
           </div>

           <div className="flex items-center gap-3 lg:gap-6">
              <div className="flex items-center gap-1.5 lg:gap-3 mr-2 lg:mr-4">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_var(--ivani-teal)]" />
                 <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--ivani-muted)] opacity-50 hidden sm:block">Sincronizado</span>
              </div>
              
              <button className="relative p-3 text-[var(--ivani-muted)] hover:bg-[var(--ivani-bg)] rounded-xl transition-all">
                <Bell size={22} />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[var(--ivani-primary)] rounded-full border-2 border-white" />
              </button>

              <div className="w-[1px] h-8 bg-[var(--ivani-border)] mx-1 lg:mx-2" />

              <div className="flex items-center gap-4 pl-2 lg:pl-4">
                 <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black text-[var(--ivani-text)] uppercase tracking-tight">Portal Ivani</p>
                    <p className="text-[9px] font-bold text-[var(--ivani-muted)] uppercase tracking-widest opacity-40">v2.1 Premium</p>
                 </div>
                 <div className="w-10 lg:w-12 h-10 lg:h-12 rounded-2xl bg-[var(--ivani-bg)] border border-[var(--ivani-border)] flex items-center justify-center text-[var(--ivani-primary)] shadow-sm">
                    <User size={24} strokeWidth={1.5} />
                 </div>
              </div>
           </div>
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 bg-[var(--ivani-bg)] relative">
           {/* Background Subtle Elements */}
           <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
              <Recycle size={400} />
           </div>
           
           <div className="relative z-10">
              {children}
           </div>

           {/* Footer Branding */}
           <footer className="mt-20 py-10 border-t border-[var(--ivani-border)]/50 flex flex-col md:flex-row justify-between items-center gap-6 opacity-40">
              <div className="flex items-center gap-4">
                 <div className="w-8 h-8 rounded-xl bg-[var(--ivani-primary)] flex items-center justify-center text-white text-[10px] font-black tracking-widest">IV</div>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--ivani-text)]">Ivani Pallets &copy; 2026</p>
              </div>
              <div className="flex gap-8">
                 <span className="text-[9px] font-black uppercase tracking-widest cursor-pointer hover:text-[var(--ivani-primary)] transition-colors">Compliance</span>
                 <span className="text-[9px] font-black uppercase tracking-widest cursor-pointer hover:text-[var(--ivani-primary)] transition-colors">Privacidade</span>
                 <span className="text-[9px] font-black uppercase tracking-widest cursor-pointer hover:text-[var(--ivani-primary)] transition-colors">Termos</span>
              </div>
           </footer>
        </div>
      </main>
    </div>
  );
}
