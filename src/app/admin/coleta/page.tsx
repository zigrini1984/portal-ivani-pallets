import { createClient } from "@/lib/supabase/server";
import { AdminColetaClient } from "./client";

export default async function AdminColetaPage() {
  let coletas: any[] = [];
  let error: string | null = null;

  try {
    const supabase = await createClient();

    const { data, error: supabaseError } = await supabase
      .from("coletas")
      .select("*")
      .eq("cliente_id", "pce")
      .order("data_coleta", { ascending: false });

    if (supabaseError) {
      error = supabaseError.message;
    } else {
      coletas = data || [];
    }
  } catch (err: any) {
    error = err.message;
  }

  return <AdminColetaClient initialColetas={coletas} error={error} />;
}