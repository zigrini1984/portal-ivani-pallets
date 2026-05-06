"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

/**
 * Gera registros de manutenção para uma triagem finalizada.
 * Filtra apenas reforma e remanufatura.
 */
export async function gerarManutencoesDaTriagem(triagemId: string) {
  try {
    const supabase = createAdminClient();

    // 1. Buscar dados da triagem
    const { data: triagemData, error: triError } = await supabase
      .from("triagens")
      .select("id, coleta_id, cliente_id, status, quantidade_manutencao, quantidade_remanufatura")
      .eq("id", triagemId)
      .limit(1);

    const triagem = triagemData && triagemData.length > 0 ? triagemData[0] : null;
    if (triError || !triagem) throw new Error(`Triagem ${triagemId} não encontrada.`);

    // 2. Buscar itens detalhados por modelo
    const { data: itens, error: itensError } = await supabase
      .from("triagem_itens")
      .select(`
        modelo_pallet_id,
        quantidade_reforma,
        quantidade_remanufatura,
        modelos_pallets ( id, nome )
      `)
      .eq("triagem_id", triagemId);

    if (itensError) throw itensError;

    const manutItems: any[] = [];

    // 3. Processar itens detalhados
    if (itens && itens.length > 0) {
      for (const item of itens) {
        const modeloNome = (item.modelos_pallets as any)?.nome || "Modelo Desconhecido";
        const modeloId = (item.modelos_pallets as any)?.id || item.modelo_pallet_id;

        if (item.quantidade_reforma > 0) {
          manutItems.push({
            triagem_id: triagemId,
            coleta_id: triagem.coleta_id,
            cliente_id: triagem.cliente_id || "pce",
            modelo_id: modeloId,
            modelo_nome_snapshot: modeloNome,
            tipo_servico: "reforma",
            quantidade: item.quantidade_reforma,
            status: "pendente"
          });
        }

        if (item.quantidade_remanufatura > 0) {
          manutItems.push({
            triagem_id: triagemId,
            coleta_id: triagem.coleta_id,
            cliente_id: triagem.cliente_id || "pce",
            modelo_id: modeloId,
            modelo_nome_snapshot: modeloNome,
            tipo_servico: "remanufatura",
            quantidade: item.quantidade_remanufatura,
            status: "pendente"
          });
        }
      }
    } 
    // 4. Fallback: Se não houver itens detalhados mas houver totais na triagem
    else if ((triagem.quantidade_manutencao || 0) > 0 || (triagem.quantidade_remanufatura || 0) > 0) {
      console.log(`[gerarManutencoesDaTriagem] Triagem ${triagemId} sem itens detalhados. Usando totais gerais.`);
      
      if ((triagem.quantidade_manutencao || 0) > 0) {
        manutItems.push({
          triagem_id: triagemId,
          coleta_id: triagem.coleta_id,
          cliente_id: triagem.cliente_id || "pce",
          modelo_nome_snapshot: "Modelo não especificado (Reforma)",
          tipo_servico: "reforma",
          quantidade: triagem.quantidade_manutencao,
          status: "pendente"
        });
      }

      if ((triagem.quantidade_remanufatura || 0) > 0) {
        manutItems.push({
          triagem_id: triagemId,
          coleta_id: triagem.coleta_id,
          cliente_id: triagem.cliente_id || "pce",
          modelo_nome_snapshot: "Modelo não especificado (Remanufatura)",
          tipo_servico: "remanufatura",
          quantidade: triagem.quantidade_remanufatura,
          status: "pendente"
        });
      }
    }

    if (manutItems.length === 0) {
      return { success: true, created: 0, message: "Sem quantidades de reforma/remanufatura." };
    }

    let criados = 0;
    // 5. Inserir evitando duplicidade
    for (const mItem of manutItems) {
      const { data: exist } = await supabase
        .from("manutencoes")
        .select("id")
        .eq("triagem_id", triagemId)
        .eq("tipo_servico", mItem.tipo_servico)
        .eq("modelo_nome_snapshot", mItem.modelo_nome_snapshot)
        .limit(1);

      if (!exist || exist.length === 0) {
        const { error: insErr } = await supabase.from("manutencoes").insert(mItem);
        if (!insErr) criados++;
      }
    }

    revalidatePath("/admin/manutencao");
    return { success: true, created: criados };
  } catch (err: any) {
    console.error("[gerarManutencoesDaTriagem] Erro:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Sincroniza manutenções pendentes de triagens concluídas ou finalizadas.
 */
export async function sincronizarManutencoesPendentes() {
  try {
    const supabase = createAdminClient();

    // 1. Buscar triagens concluídas ou finalizadas
    const { data: triagens, error: triError } = await supabase
      .from("triagens")
      .select("id, status")
      .in("status", ["concluida", "finalizada", "concluido", "finalizado"]);

    if (triError) throw triError;

    let totalCriados = 0;
    let triagensVerificadas = 0;
    const logs: string[] = [];

    for (const tri of (triagens || [])) {
      triagensVerificadas++;
      const res = await gerarManutencoesDaTriagem(tri.id);
      if (res.success) {
        totalCriados += (res.created || 0);
        if ((res.created || 0) === 0) {
          logs.push(`Triagem ${tri.id.split('-')[0]}: Já sincronizada ou sem itens.`);
        }
      } else {
        logs.push(`Erro na triagem ${tri.id.split('-')[0]}: ${res.error}`);
      }
    }

    revalidatePath("/admin/manutencao");
    return { 
      success: true, 
      verificadas: triagensVerificadas, 
      criados: totalCriados,
      logs 
    };
  } catch (err: any) {
    console.error("[sincronizarManutencoesPendentes] Erro:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Inicia o processo de manutenção para um item.
 */
export async function iniciarManutencao(id: string) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("manutencoes")
      .update({ status: "em_andamento", data_inicio: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    revalidatePath("/admin/manutencao");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Conclui a manutenção e envia para o estoque.
 */
export async function concluirManutencao(id: string) {
  try {
    const supabase = createAdminClient();

    const { data: itemData, error: fetchError } = await supabase
      .from("manutencoes")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !itemData) throw new Error("Item não encontrado.");
    if (itemData.status === "concluida") throw new Error("Já concluído.");

    // Atualizar manutenção
    const { error: updateError } = await supabase
      .from("manutencoes")
      .update({ status: "concluida", data_conclusao: new Date().toISOString() })
      .eq("id", id);
    if (updateError) throw updateError;

    // Atualizar Estoque Acumulado (PCE)
    const clienteId = itemData.cliente_id || "pce";
    
    // Se não tiver modelo_id, não podemos atualizar o estoque por modelo
    if (!itemData.modelo_id) {
       console.warn("[concluirManutencao] Item sem modelo_id. Estoque acumulado não atualizado.");
       revalidatePath("/admin/manutencao");
       return { success: true, message: "Manutenção concluída, mas estoque não atualizado por falta de ID do modelo." };
    }

    const { data: estoque, error: estError } = await supabase
      .from("estoque_pallets")
      .select("id, quantidade")
      .eq("cliente_id", clienteId)
      .eq("modelo_id", itemData.modelo_id)
      .limit(1);

    if (estError) throw estError;

    if (estoque && estoque.length > 0) {
      await supabase
        .from("estoque_pallets")
        .update({ 
          quantidade: (estoque[0].quantidade || 0) + itemData.quantidade,
          updated_at: new Date().toISOString()
        })
        .eq("id", estoque[0].id);
    } else {
      await supabase.from("estoque_pallets").insert({
        cliente_id: clienteId,
        modelo_id: itemData.modelo_id,
        modelo_nome_snapshot: itemData.modelo_nome_snapshot,
        quantidade: itemData.quantidade,
      });
    }

    revalidatePath("/admin/manutencao");
    revalidatePath("/admin/estoque");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
