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
  console.log("[api-leads] iniciando");

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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Variaveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY precisam estar configuradas."
        },
        { status: 500 }
      );
    }

    const supabaseResponse = await fetch(`${supabaseUrl}/rest/v1/leads`, {
      method: "POST",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify(lead)
    });

    if (!supabaseResponse.ok) {
      const error = await supabaseResponse.text();
      console.error("[api-leads] Erro Supabase:", error);
      return NextResponse.json({ success: false, error }, { status: supabaseResponse.status });
    }

    console.log("[api-leads] Lead salvo");
    console.log("[api-leads] Enviando email");

    await sendLeadEmail(lead);

    console.log("[api-leads] Email enviado");

    return NextResponse.json({
      success: true,
      message: "Solicitação enviada com sucesso. Em breve a Ivani Pallets entrará em contato."
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado ao processar lead.";
    console.error("[api-leads] Erro:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
