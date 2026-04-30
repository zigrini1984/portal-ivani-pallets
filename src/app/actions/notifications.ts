"use server";

import { resend } from "@/lib/resend";
import { createClient } from "@/lib/supabase/server";

interface NotificationParams {
  cliente_id: string;
  loteNumber: string;
  status: string;
  destino?: string;
  observacao?: string;
  dataAlteracao: string;
}

export async function sendStatusUpdateEmail({
  cliente_id,
  loteNumber,
  status,
  destino,
  observacao,
  dataAlteracao
}: NotificationParams) {
  // Controle de ativação das notificações
  if (process.env.ENABLE_EMAIL_NOTIFICATIONS !== "true") {
    console.log("Notificações por e-mail estão desativadas via flag ENABLE_EMAIL_NOTIFICATIONS.");
    return { success: true, message: "Notificações desativadas" };
  }

  try {
    const supabase = await createClient();

    // 1. Buscar os e-mails dos usuários vinculados ao cliente_id
    const { data: perfis, error: fetchError } = await supabase
      .from("perfis")
      .select("email")
      .eq("cliente_id", cliente_id);

    if (fetchError || !perfis || perfis.length === 0) {
      console.warn(`Nenhum perfil encontrado para o cliente_id: ${cliente_id}`);
      return { error: "Nenhum e-mail de destino encontrado." };
    }

    const emails = perfis.map(p => p.email).filter(Boolean) as string[];

    if (emails.length === 0) {
      return { error: "E-mails não configurados para este cliente." };
    }

    // 2. Enviar o e-mail via Resend
    const { data, error } = await resend.emails.send({
      from: 'Ivani Pallets <onboarding@resend.dev>', // Usando domínio padrão do Resend para teste, ou o domínio do cliente se configurado
      to: emails,
      subject: `Atualização: Lote ${loteNumber} - ${status.toUpperCase()}`,
      html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #008990;">Portal Ivani Pallets</h2>
          <p>Olá,</p>
          <p>Informamos que houve uma atualização no status do lote <strong>${loteNumber}</strong>.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #008990;">
            <p style="margin: 5px 0;"><strong>Novo Status:</strong> <span style="text-transform: uppercase; color: #008990;">${status}</span></p>
            ${destino && destino !== 'A definir' ? `<p style="margin: 5px 0;"><strong>Destino:</strong> ${destino}</p>` : ''}
            ${observacao ? `<p style="margin: 5px 0;"><strong>Observação:</strong> ${observacao}</p>` : ''}
            <p style="margin: 5px 0;"><strong>Data da Alteração:</strong> ${dataAlteracao}</p>
          </div>
          
          <p>Para acompanhar o progresso detalhado, acesse seu dashboard no portal.</p>
          
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 11px; color: #999; text-align: center;">
            Este é um e-mail automático enviado pelo Portal de Gestão Ivani Pallets.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Erro ao enviar e-mail via Resend:", error);
      return { error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Erro inesperado ao enviar e-mail:", error);
    return { error: "Erro interno ao processar notificação." };
  }
}
