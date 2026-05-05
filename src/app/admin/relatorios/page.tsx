import { createClient } from "@/lib/supabase/server";
import { AdminRelatoriosClient } from "./client";

export default async function AdminRelatoriosPage() {
  const supabase = await createClient();

  const { data: triagens } = await supabase
    .from("triagens")
    .select("id, cliente_id, quantidade_total, quantidade_manutencao, quantidade_remanufatura, quantidade_compra_ivani, created_at, modelo_pallet_id")
    .eq("cliente_id", "pce")
    .order("data_coleta", { ascending: false });

  return <AdminRelatoriosClient initialTriagens={triagens || []} />;
}
