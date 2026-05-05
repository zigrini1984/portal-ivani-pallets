import { createClient } from "@/lib/supabase/server";
import { AdminTriagemClient } from "./client";

export default async function AdminTriagemPage() {
  const supabase = await createClient();

  // Buscar Modelos
  const { data: modelosData } = await supabase
    .from("modelos_pallets")
    .select("id, nome, codigo, medidas")
    .eq("ativo", true)
    .order("nome");

  // Buscar Triagens
  const { data: triagensData } = await supabase
    .from("triagens")
    .select("*")
    .eq("cliente_id", "pce")
    .order("created_at", { ascending: false });

  let triagensComItens = triagensData || [];

  if (triagensData && triagensData.length > 0) {
    const triagemIds = triagensData.map((t: any) => t.id);
    const { data: itensData } = await supabase
      .from("triagem_itens")
      .select("*")
      .in("triagem_id", triagemIds);

    triagensComItens = triagensData.map((triagem: any) => {
      const itensDestaTriagem = itensData ? itensData.filter((item: any) => item.triagem_id === triagem.id) : [];
      return {
        ...triagem,
        itens: itensDestaTriagem
      };
    });
  }

  return (
    <AdminTriagemClient 
      initialTriagens={triagensComItens} 
      initialModelosPallets={modelosData || []} 
    />
  );
}
