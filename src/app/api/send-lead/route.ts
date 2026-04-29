import { NextResponse } from "next/server";

type LeadRequest = {
  nome?: string;
  empresa?: string;
  whatsapp?: string;
  email?: string;
  cidade?: string;
  mensagem?: string;
};

function valueOrEmpty(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LeadRequest;

    const lead = {
      nome: valueOrEmpty(body.nome),
      empresa: valueOrEmpty(body.empresa),
      whatsapp: valueOrEmpty(body.whatsapp),
      email: valueOrEmpty(body.email),
      cidade: valueOrEmpty(body.cidade),
      mensagem: valueOrEmpty(body.mensagem)
    };

    const resendApiKey = process.env.RESEND_API_KEY;
    const notifyEmail = process.env.LEAD_NOTIFY_EMAIL;
    const fromEmail = process.env.LEAD_FROM_EMAIL;

    if (!resendApiKey || !notifyEmail || !fromEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "Variaveis RESEND_API_KEY, LEAD_NOTIFY_EMAIL e LEAD_FROM_EMAIL precisam estar configuradas."
        },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: fromEmail,
        to: notifyEmail,
        subject: "Novo lead - Portal Ivani",
        html: `
          <h1>Novo lead - Portal Ivani</h1>
          <p>Um novo lead foi enviado pelo Portal Ivani Pallets.</p>
          <ul>
            <li><strong>Nome:</strong> ${escapeHtml(lead.nome)}</li>
            <li><strong>Empresa:</strong> ${escapeHtml(lead.empresa)}</li>
            <li><strong>WhatsApp:</strong> ${escapeHtml(lead.whatsapp)}</li>
            <li><strong>E-mail:</strong> ${escapeHtml(lead.email)}</li>
            <li><strong>Cidade:</strong> ${escapeHtml(lead.cidade)}</li>
            <li><strong>Mensagem:</strong> ${escapeHtml(lead.mensagem || "Sem mensagem")}</li>
          </ul>
        `
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ success: false, error }, { status: response.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido ao enviar e-mail.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
