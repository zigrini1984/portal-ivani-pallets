export type LeadNotificationPayload = {
  nome: string;
  empresa: string;
  whatsapp: string;
  email: string;
  cidade: string;
  mensagem: string;
  created_at: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatLeadDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo"
  }).format(new Date(value));
}

function buildLeadEmailHtml(lead: LeadNotificationPayload) {
  const rows = [
    ["Nome", lead.nome],
    ["Empresa", lead.empresa],
    ["WhatsApp", lead.whatsapp],
    ["E-mail", lead.email],
    ["Cidade", lead.cidade],
    ["Mensagem", lead.mensagem || "Sem mensagem"],
    ["Data do envio", formatLeadDate(lead.created_at)]
  ];

  return `
    <h1>Novo lead recebido pelo Portal Ivani Pallets</h1>
    <p>Um novo contato foi enviado pela landing page.</p>
    <table cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
      <tbody>
        ${rows
          .map(
            ([label, value]) => `
              <tr>
                <td style="font-weight: bold; border-bottom: 1px solid #ddd;">${escapeHtml(label)}</td>
                <td style="border-bottom: 1px solid #ddd;">${escapeHtml(value)}</td>
              </tr>
            `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

export async function sendLeadEmail(lead: LeadNotificationPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_NOTIFY_EMAIL;
  const from = process.env.LEAD_FROM_EMAIL;

  if (!apiKey || !to || !from) {
    throw new Error("Variaveis RESEND_API_KEY, LEAD_NOTIFY_EMAIL e LEAD_FROM_EMAIL precisam estar configuradas.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Novo lead recebido pelo Portal Ivani Pallets",
      html: buildLeadEmailHtml(lead)
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend retornou erro ${response.status}: ${errorBody}`);
  }
}

export async function sendLeadWhatsAppNotification(_lead: LeadNotificationPayload) {
  // Preparado para integração futura com WhatsApp. Não implementado nesta etapa.
  return;
}
