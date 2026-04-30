import { NextResponse } from "next/server";
import { sendLeadEmail } from "@/lib/lead-notifications";

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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LeadRequest;

    const lead = {
      nome: valueOrEmpty(body.nome),
      empresa: valueOrEmpty(body.empresa),
      whatsapp: valueOrEmpty(body.whatsapp),
      email: valueOrEmpty(body.email),
      cidade: valueOrEmpty(body.cidade),
      mensagem: valueOrEmpty(body.mensagem),
      created_at: new Date().toISOString()
    };

    await sendLeadEmail(lead);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido ao enviar e-mail.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
