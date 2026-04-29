import { NextResponse } from "next/server";
import {
  sendLeadEmail,
  sendLeadWhatsAppNotification,
  type LeadNotificationPayload
} from "@/lib/lead-notifications";

export async function POST(request: Request) {
  try {
    const lead = (await request.json()) as LeadNotificationPayload;

    await sendLeadEmail(lead);
    await sendLeadWhatsAppNotification(lead);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido ao notificar lead.";
    console.error("[leads] Falha ao enviar notificacao:", error);

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
