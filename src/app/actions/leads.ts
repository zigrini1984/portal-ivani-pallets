"use server";

import { sendLeadEmail } from "@/lib/lead-notifications";

export type ActionResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

/**
 * Server Action para processar o formulário de leads.
 * Salva no Supabase e envia notificação por e-mail via Resend.
 */
export async function submitLeadAction(_prevState: ActionResponse | null, formData: FormData): Promise<ActionResponse> {
  console.log("[leads-action] iniciando");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[leads-action] ERRO: Variáveis de ambiente do Supabase não configuradas.");
    return { 
      success: false, 
      error: "Erro de configuração no servidor. Por favor, tente novamente mais tarde." 
    };
  }

  // Extração e limpeza dos dados do FormData
  const lead = {
    nome: String(formData.get("nome") ?? "").trim(),
    empresa: String(formData.get("empresa") ?? "").trim(),
    whatsapp: String(formData.get("whatsapp") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    cidade: String(formData.get("cidade") ?? "").trim(),
    mensagem: String(formData.get("mensagem") ?? "").trim(),
    created_at: new Date().toISOString()
  };

  console.log("[leads-action] Dados extraídos:", { ...lead, email: "REDACTED" });

  try {
    // 1. Salvar no Supabase via REST API
    console.log("[leads-action] Salvando lead no Supabase...");
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

    if (!response.ok) {
      const result = await response.json();
      console.error("[leads-action] ERRO Supabase:", result);
      return { 
        success: false, 
        error: result?.message ?? "Falha ao salvar os dados no banco de dados." 
      };
    }
    console.log("[leads-action] Lead salvo");

    // 2. Enviar notificação por e-mail via Resend
    console.log("[leads-action] Enviando email");
    try {
      await sendLeadEmail(lead);
      console.log("[leads-action] E-mail enviado com sucesso.");
    } catch (emailError) {
      // Logamos o erro de e-mail, mas não interrompemos o fluxo pois o lead já foi salvo
      console.error("[leads-action] AVISO: Erro ao enviar e-mail:", emailError);
    }

    return { 
      success: true, 
      message: "Solicitação enviada com sucesso. Em breve a Ivani Pallets entrará em contato." 
    };
  } catch (error) {
    console.error("[leads-action] ERRO CRÍTICO inesperado:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Ocorreu um erro inesperado ao processar sua solicitação." 
    };
  }
}
