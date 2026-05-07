import React from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchDashboardKPIs } from "@/lib/kpis";
import ClientRelatorio from "./client";

export const dynamic = "force-dynamic";

export default async function RelatorioExecutivoPage() {
  const supabase = createAdminClient();
  const clienteId = "pce";

  const kpis = await fetchDashboardKPIs(clienteId, supabase);

  return <ClientRelatorio kpis={kpis} />;
}
