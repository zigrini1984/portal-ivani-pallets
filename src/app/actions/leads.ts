"use server";

import { sendLeadEmail } from "@/lib/lead-notifications";

export type ActionResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

export async function submitLeadAction(formData: FormData): Promise<ActionResponse> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[leads-action] Supabase env vars missing");
    return { 
      success: false, 
      error: "Erro de configuração no servidor. Por favor, tente novamente mais tarde." 
    };
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
    // 1. Salvar no Supabase via REST API
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
      console.error("[leads-action] Erro Supabase:", result);
      return { 
        success: false, 
        error: result?.message ?? "Falha ao salvar os dados no banco de dados." 
      };
    }

    // 2. Enviar notificação por e-mail
    try {
      await sendLeadEmail(lead);
    } catch (emailError) {
      // Logamos o erro de e-mail, mas o lead já foi salvo com sucesso
      console.error("[leads-action] Erro ao enviar e-mail:", emailError);
      // Opcional: podemos retornar sucesso mas avisar que a notificação falhou internamente
    }

    return { 
      success: true, 
      message: "Solicitação enviada com sucesso. Em breve a Ivani Pallets entrará em contato." 
    };
  } catch (error) {
    console.error("[leads-action] Erro inesperado:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Ocorreu um erro inesperado ao processar sua solicitação." 
    };
  }
}
