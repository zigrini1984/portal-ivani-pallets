"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Truck, 
  ClipboardCheck, 
  Hammer, 
  Package, 
  FileInput, 
  CreditCard,
  Target,
  ShieldCheck,
  TrendingDown,
  LayoutDashboard,
  Recycle,
  MessageSquare,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [leadStatus, setLeadStatus] = useState<"sucesso" | "erro" | null>(null);
  const [leadMessage, setLeadMessage] = useState("");

  async function handleLeadSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      const message = "Variaveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY nao configuradas.";
      console.error("[leads] Erro:", message);
      setLeadStatus("erro");
      setLeadMessage(message);
      return;
    }

    const lead = {
      nome: String(formData.get("nome") ?? "").trim(),
      empresa: String(formData.get("empresa") ?? "").trim(),
      whatsapp: String(formData.get("whatsapp") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      cidade: String(formData.get("cidade") ?? "").trim(),
      mensagem: String(formData.get("mensagem") ?? "").trim(),
      created_at: new Date().toISOString()
    };

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/leads`, {
        method: "POST",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        },
        body: JSON.stringify(lead)
      });

      const result = response.ok ? null : await response.json();

      if (!response.ok) {
        const message = result?.message ?? "Erro desconhecido ao salvar lead no Supabase.";
        console.error("[leads] Erro real do Supabase:", result);
        setLeadStatus("erro");
        setLeadMessage(message);
        return;
      }

      setLeadStatus("sucesso");
      setLeadMessage("Solicitação enviada com sucesso. Em breve a Ivani Pallets entrará em contato.");
      form.reset();

      fetch("/api/send-lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(lead)
      })
        .then(async (notificationResponse) => {
          if (!notificationResponse.ok) {
            const notificationError = await notificationResponse.json();
            console.error("[leads] Lead salvo, mas a notificacao por e-mail falhou:", notificationError);
          }
        })
        .catch((error) => {
          console.error("[leads] Lead salvo, mas a notificacao por e-mail falhou:", error);
        });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro inesperado ao conectar com o Supabase.";
      console.error("[leads] Erro real do Supabase:", error);
      setLeadStatus("erro");
      setLeadMessage(message);
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <main className="min-h-screen bg-bg-primary text-text-dark font-sans selection:bg-brand-cyan/20 selection:text-brand-cyan">
      {/* Hero Section */}
      <section className="relative pt-12 pb-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Coluna Esquerda */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col"
          >
            <div className="flex items-center gap-2 mb-8">
              <div className="w-10 h-10 bg-brand-cyan rounded-xl flex items-center justify-center shadow-lg shadow-brand-cyan/20">
                <Package className="text-white" size={24} />
              </div>
              <span className="font-display font-bold text-2xl tracking-tight text-brand-cyan">Portal Ivani Pallets</span>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-xs font-bold tracking-widest uppercase border border-brand-cyan/20 rounded-full bg-brand-cyan/5 text-brand-cyan w-fit">
              Gestão inteligente de pallets usados
            </div>

            <h1 className="font-display text-5xl md:text-6xl font-extrabold mb-8 leading-[1.1] tracking-tight">
              Transparência e economia na gestão de <span className="text-brand-cyan">pallets usados</span>
            </h1>

            <p className="text-lg md:text-xl text-text-dark/70 mb-12 leading-relaxed max-w-xl">
              Acompanhe coletas, triagem, manutenção, estoque, entregas e faturamento em um portal simples, claro e feito para clientes da Ivani Pallets.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <Link href="/login" className="w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto px-10 py-5 bg-brand-cyan hover:bg-[#1a6e74] text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-brand-cyan/20"
                >
                  Acessar Portal <ArrowRight size={20} />
                </motion.button>
              </Link>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto px-10 py-5 bg-white hover:bg-brand-pink/30 border border-brand-cyan/10 rounded-2xl font-bold transition-all"
              >
                Conhecer o processo
              </motion.button>
            </div>
          </motion.div>

          {/* Coluna Direita - Mockup do Portal */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] card-shadow border border-brand-pink relative z-10">
              <div className="text-center mb-10">
                <h3 className="font-display text-2xl font-bold mb-2">Portal do Cliente</h3>
                <p className="text-sm text-text-dark/50">Acompanhe seus pallets em tempo real</p>
              </div>

              <div className="space-y-6 mb-8">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-dark/40 mb-2 ml-1">E-mail</label>
                  <div className="w-full h-14 bg-brand-primary/50 border border-brand-pink rounded-2xl px-5 flex items-center text-text-dark/30 italic">
                    exemplo@empresa.com.br
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-dark/40 mb-2 ml-1">Senha</label>
                  <div className="w-full h-14 bg-brand-primary/50 border border-brand-pink rounded-2xl px-5 flex items-center text-text-dark/30 italic">
                    ••••••••••••
                  </div>
                </div>
              </div>

              <motion.button
                className="w-full py-5 bg-brand-cyan/10 text-brand-cyan rounded-2xl font-bold border border-brand-cyan/20 mb-10"
              >
                Entrar no Portal
              </motion.button>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: <Truck size={14} />, label: "Coleta" },
                  { icon: <ClipboardCheck size={14} />, label: "Triagem" },
                  { icon: <Hammer size={14} />, label: "Manutenção" },
                  { icon: <Package size={14} />, label: "Estoque" },
                  { icon: <ArrowRight size={14} />, label: "Entrega" },
                  { icon: <CreditCard size={14} />, label: "Faturamento" },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 p-3 bg-brand-pink/20 rounded-xl">
                    <div className="text-brand-cyan">{item.icon}</div>
                    <span className="text-[10px] font-bold uppercase tracking-tighter text-text-dark/60">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Elementos Decorativos */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-yellow/20 blur-[60px] rounded-full" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-cyan/10 blur-[60px] rounded-full" />
          </motion.div>
        </div>
      </section>

      {/* Seção Como Funciona */}
      <section className="py-32 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="font-display text-4xl font-bold mb-4 tracking-tight">Como funciona</h2>
            <div className="w-20 h-1.5 bg-brand-yellow mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <Truck />, title: "Coleta", desc: "Retirada ágil dos pallets em sua unidade para nossa central." },
              { icon: <ClipboardCheck />, title: "Triagem", desc: "Avaliação criteriosa do estado de cada peça recebida." },
              { icon: <Hammer />, title: "Manutenção", desc: "Recuperação especializada para garantir a vida útil." },
              { icon: <Package />, title: "Estoque", desc: "Controle preciso do saldo disponível para seu uso." },
              { icon: <ArrowRight />, title: "Entrega", desc: "Envio programado dos pallets prontos para a operação." },
              { icon: <CreditCard />, title: "Faturamento", desc: "Cobrança transparente baseada apenas no serviço executado." },
            ].map((step, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="p-8 rounded-[2rem] bg-bg-primary border border-brand-pink/50 hover:border-brand-cyan/30 transition-all group"
              >
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-brand-cyan mb-6 shadow-sm group-hover:bg-brand-cyan group-hover:text-white transition-colors duration-500">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-text-dark/60 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Seção Por que isso importa */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="font-display text-4xl font-bold mb-4 tracking-tight">Por que isso importa para o cliente?</h2>
            <p className="text-text-dark/50">Transparência que gera resultados reais.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { icon: <LayoutDashboard className="text-brand-cyan" />, title: "Mais controle sobre os pallets", desc: "Acesse seu saldo e histórico a qualquer momento, sem planilhas confusas." },
              { icon: <TrendingDown className="text-brand-brown" />, title: "Menos desperdício", desc: "Identificamos pallets que podem ser salvos, evitando descartes desnecessários." },
              { icon: <Target className="text-brand-yellow" />, title: "Melhor aproveitamento", desc: "Sua operação roda com pallets recuperados que possuem o mesmo desempenho de novos." },
              { icon: <ShieldCheck className="text-brand-cyan" />, title: "Informações claras", desc: "Dados auditáveis para conferência de faturamento e fluxo de caixa." },
            ].map((item, i) => (
              <div key={i} className="flex gap-6 p-8 bg-white rounded-[2rem] card-shadow border border-brand-pink/20">
                <div className="mt-1">{item.icon}</div>
                <div>
                  <h4 className="text-lg font-bold mb-2">{item.title}</h4>
                  <p className="text-text-dark/60 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Seção Economia Circular */}
      <section className="py-32 bg-brand-cyan text-white px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="font-display text-4xl font-bold mb-8 tracking-tight italic">Economia circular na prática</h2>
          <p className="text-xl md:text-2xl leading-relaxed font-medium text-white/90">
            “A Ivani Pallets trabalha com compra, venda, recuperação e reaproveitamento de pallets usados. O portal ajuda o cliente a enxergar o ciclo completo dos pallets com mais clareza e organização.”
          </p>
        </div>
        
        {/* Decoração */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 border-[40px] border-white rounded-full" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 border-[40px] border-white rounded-full" />
        </div>
      </section>

      {/* Seção Impacto Ambiental */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="font-display text-4xl font-bold mb-4 tracking-tight">Impacto ambiental da reutilização de pallets</h2>
            <p className="text-text-dark/50 max-w-2xl mx-auto">
              A recuperação de pallets reduz o descarte de madeira e contribui para um ciclo mais sustentável. 
              Os indicadores abaixo representam estimativas baseadas na operação.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                icon: <Target className="text-brand-cyan" />, 
                title: "Menos árvores descartadas", 
                desc: "A recuperação evita a necessidade de extrair novas matérias-primas da natureza constantemente." 
              },
              { 
                icon: <Recycle className="text-brand-brown" />, 
                title: "Redução de resíduos", 
                desc: "Prolongamos a vida útil dos pallets, evitando que terminem em aterros ou descarte inadequado." 
              },
              { 
                icon: <Truck className="text-brand-yellow" />, 
                title: "Menor impacto logístico", 
                desc: "A circulação otimizada de pallets usados diminui a necessidade de grandes transportes de carga nova." 
              },
              { 
                icon: <CreditCard className="text-brand-cyan" />, 
                title: "Economia para o cliente", 
                desc: "O reaproveitamento reduz custos operacionais sem comprometer a segurança da carga." 
              },
            ].map((card, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="p-8 bg-white rounded-[2.5rem] card-shadow border border-brand-pink/20"
              >
                <div className="mb-6 p-4 bg-bg-primary rounded-2xl w-fit">
                  {card.icon}
                </div>
                <h4 className="text-lg font-bold mb-3">{card.title}</h4>
                <p className="text-text-dark/60 text-sm leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Seção de Contato */}
      <section className="py-20 px-6 bg-brand-pink/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Coluna Esquerda: Texto Explicativo */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="w-16 h-16 bg-brand-yellow/20 rounded-2xl flex items-center justify-center mb-8">
                <MessageSquare className="text-brand-brown" size={32} />
              </div>
              <h2 className="font-display text-4xl font-bold mb-6 tracking-tight">
                Como podemos ajudar sua empresa?
              </h2>
              <p className="text-lg text-text-dark/70 mb-10 leading-relaxed">
                Atendemos empresas que precisam comprar, vender, coletar, recuperar ou organizar o fluxo de pallets usados com mais clareza e agilidade.
              </p>
              
              <ul className="space-y-4">
                {[
                  "Compra de pallets usados",
                  "Venda de pallets usados",
                  "Coleta e triagem",
                  "Recuperação e reaproveitamento",
                  "Gestão do fluxo de pallets"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-4 text-text-dark/80 font-medium">
                    <CheckCircle2 className="text-brand-cyan shrink-0" size={24} />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Coluna Direita: Formulário */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white p-8 md:p-12 rounded-[3rem] card-shadow border border-brand-pink/20"
            >
              <div className="mb-10">
                <h3 className="text-2xl font-bold mb-2">Solicite um contato</h3>
                <p className="text-sm text-text-dark/50">
                  Preencha seus dados para conversarmos sobre sua operação.
                </p>
              </div>

              <form 
                onSubmit={handleLeadSubmit}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {leadStatus && (
                  <div className={`md:col-span-2 rounded-xl px-4 py-3 text-sm font-semibold ${leadStatus === "sucesso" ? "bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20" : "bg-red-50 text-red-700 border border-red-200"}`}>
                    {leadMessage}
                  </div>
                )}
                <div className="md:col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dark/40 mb-2 ml-1">Nome</label>
                  <input required name="nome" type="text" placeholder="Nome completo" className="w-full h-12 bg-bg-primary border border-brand-pink/30 rounded-xl px-4 focus:outline-none focus:border-brand-cyan/50 transition-colors" />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dark/40 mb-2 ml-1">Empresa</label>
                  <input required name="empresa" type="text" placeholder="Nome da empresa" className="w-full h-12 bg-bg-primary border border-brand-pink/30 rounded-xl px-4 focus:outline-none focus:border-brand-cyan/50 transition-colors" />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dark/40 mb-2 ml-1">WhatsApp</label>
                  <input required name="whatsapp" type="tel" placeholder="WhatsApp com DDD" className="w-full h-12 bg-bg-primary border border-brand-pink/30 rounded-xl px-4 focus:outline-none focus:border-brand-cyan/50 transition-colors" />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dark/40 mb-2 ml-1">E-mail</label>
                  <input required name="email" type="email" placeholder="email@empresa.com.br" className="w-full h-12 bg-bg-primary border border-brand-pink/30 rounded-xl px-4 focus:outline-none focus:border-brand-cyan/50 transition-colors" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dark/40 mb-2 ml-1">Cidade</label>
                  <input required name="cidade" type="text" placeholder="Cidade / Estado" className="w-full h-12 bg-bg-primary border border-brand-pink/30 rounded-xl px-4 focus:outline-none focus:border-brand-cyan/50 transition-colors" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dark/40 mb-2 ml-1">Mensagem</label>
                  <textarea name="mensagem" rows={3} placeholder="Escreva brevemente como podemos ajudar" className="w-full bg-bg-primary border border-brand-pink/30 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-cyan/50 transition-colors resize-none"></textarea>
                </div>
                
                <div className="md:col-span-2 mt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-5 bg-brand-cyan hover:bg-[#1a6e74] text-white rounded-2xl font-bold transition-all shadow-lg shadow-brand-cyan/20"
                  >
                    Solicitar contato agora
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Final Refatorado */}
      <section className="pb-32 px-6">
        <div className="max-w-4xl mx-auto bg-brand-cyan rounded-[3rem] p-12 md:p-16 text-center text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-8 tracking-tight">
              Acompanhe sua operação com transparência
            </h2>
            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-5 bg-white text-brand-cyan rounded-2xl font-bold transition-all shadow-xl"
              >
                Acessar Portal do Cliente
              </motion.button>
            </Link>
          </div>
          <div className="absolute top-0 right-0 p-10 opacity-10">
            <LayoutDashboard size={120} />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-brand-pink/50 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Package className="text-brand-cyan" size={24} />
            <span className="font-display font-bold text-xl tracking-tight text-text-dark">Portal Ivani Pallets</span>
          </div>
          <div className="text-text-dark/40 text-xs font-bold tracking-widest uppercase">
            © {new Date().getFullYear()} Ivani Pallets — Feito para durar.
          </div>
        </div>
      </footer>
    </main>
  );
}
