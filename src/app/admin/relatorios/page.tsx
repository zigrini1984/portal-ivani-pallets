import { createClient } from "@/lib/supabase/server";
import { AdminRelatoriosClient } from "./client";

export default async function AdminRelatoriosPage() {
  const supabase = await createClient();

  const { data: triagens } = await supabase
    .from("triagens")
    .select("*")
    .eq("cliente_id", "pce")
    .order("data_coleta", { ascending: false });

  return <AdminRelatoriosClient initialTriagens={triagens || []} />;
}
