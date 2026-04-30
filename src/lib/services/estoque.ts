import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

/**
 * Sincroniza o estoque operacional da PCE baseando-se em Triagens e Manutenções.
 */
export async function sincronizarEstoqueOperacional() {
  try {
    console.log("Iniciando sincronização automática de estoque...");

    // 1. Manutenções Finalizadas -> Entrada
    const { data: manut } = await supabase
      .from("manutencoes")
      .select("*")
      .eq("status", "finalizada")
      .eq("cliente_id", "pce");

    if (manut) {
      for (const m of manut) {
        if (m.quantidade_concluida > 0) {
          // Inserir movimentação - O índice único uidx_movimentacao_origem impede duplicidade
          const { error } = await supabase.from("estoque_movimentacoes").insert([{
            cliente_id: 'pce',
            modelo_pallet_id: m.modelo_pallet_id,
            origem: 'manutencao',
            origem_id: m.id,
            tipo: 'entrada',
            quantidade: m.quantidade_concluida,
            descricao: `Entrada automática via Oficina (ID Manutenção: ${m.id.substring(0,8)})`
          }]);
          
          if (error && error.code !== '23505') { // 23505 = unique_violation
            console.error("Erro ao sincronizar manutenção:", m.id, error);
          } else if (!error) {
            console.log(`[Estoque] Sincronizado: Manutenção ${m.id}`);
          } else {
            console.log(`[Estoque] Já sincronizado: Manutenção ${m.id}`);
          }
        }
      }
    }

    // 2. Triagem Remanufatura -> Entrada
    const { data: triagemItens } = await supabase
      .from("triagem_itens")
      .select("*, triagem:triagens(id, status, cliente_id)")
      .gt("quantidade_remanufatura", 0)
      .eq("triagem.cliente_id", "pce");

    if (triagemItens) {
      for (const it of triagemItens) {
        // Inserir movimentação
        const { error } = await supabase.from("estoque_movimentacoes").insert([{
          cliente_id: 'pce',
          modelo_pallet_id: it.modelo_pallet_id,
          origem: 'triagem_remanufatura',
          origem_id: it.id,
          tipo: 'entrada',
          quantidade: it.quantidade_remanufatura,
          descricao: `Entrada automática via Remanufatura (Triagem: ${it.triagem_id.substring(0,8)})`
        }]);

        if (error && error.code !== '23505') {
          console.error("Erro ao sincronizar remanufatura:", it.id, error);
        } else if (!error) {
           console.log(`[Estoque] Sincronizado: Remanufatura ${it.id}`);
        } else {
           console.log(`[Estoque] Já sincronizado: Remanufatura ${it.id}`);
        }
      }
    }

    console.log("Sincronização de estoque concluída.");
    return { success: true };
  } catch (err) {
    console.error("Falha crítica na sincronização de estoque:", err);
    return { success: false, error: err };
  }
}
