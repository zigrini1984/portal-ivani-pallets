"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

/**
 * Gera registros de manutenção para uma triagem finalizada.
 * Filtra apenas itens classificados como 'reforma' ou 'remanufatura'.
 */
export async function gerarManutencoesDaTriagem(triagemId: string) {
  try {
    const supabase = createAdminClient();

    // 1. Buscar a triagem
    const { data: triagens, error: triError } = await supabase
      .from("triagens")
      .select("id, coleta_id, cliente_id, status, quantidade_manutencao, quantidade_remanufatura")
      .eq("id", triagemId);

    if (triError) throw triError;
    const triagem = triagens?.[0];
    if (!triagem) return { success: false, error: "Triagem não encontrada." };

    // 2. Buscar itens triados por modelo
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
    const clienteId = triagem.cliente_id || "pce";
    const motivos: string[] = [];
    let itensIgnorados = 0;

    // 3. Mapear itens para manutenção
    if (itens && itens.length > 0) {
      for (const item of itens) {
        const modelo = (item.modelos_pallets as any);
        const modeloId = modelo?.id || item.modelo_pallet_id;
        const modeloNome = modelo?.nome || "Modelo não identificado";

        // Caso: Reforma
        if ((item.quantidade_reforma || 0) > 0) {
          manutItems.push({
            triagem_id: triagemId,
            coleta_id: triagem.coleta_id,
            cliente_id: clienteId,
            modelo_id: modeloId,
            modelo_nome_snapshot: modeloNome,
            tipo_servico: "reforma",
            quantidade: item.quantidade_reforma,
            status: "pendente"
          });
        }

        // Caso: Remanufatura
        if ((item.quantidade_remanufatura || 0) > 0) {
          manutItems.push({
            triagem_id: triagemId,
            coleta_id: triagem.coleta_id,
            cliente_id: clienteId,
            modelo_id: modeloId,
            modelo_nome_snapshot: modeloNome,
            tipo_servico: "remanufatura",
            quantidade: item.quantidade_remanufatura,
            status: "pendente"
          });
        }
      }
    } else {
      // Fallback: usar totais da triagem se não houver itens detalhados
      if ((triagem.quantidade_manutencao || 0) > 0) {
        manutItems.push({
          triagem_id: triagemId,
          coleta_id: triagem.coleta_id,
          cliente_id: clienteId,
          modelo_nome_snapshot: "Modelo Geral (Reforma)",
          tipo_servico: "reforma",
          quantidade: triagem.quantidade_manutencao,
          status: "pendente"
        });
      }
      if ((triagem.quantidade_remanufatura || 0) > 0) {
        manutItems.push({
          triagem_id: triagemId,
          coleta_id: triagem.coleta_id,
          cliente_id: clienteId,
          modelo_nome_snapshot: "Modelo Geral (Remanufatura)",
          tipo_servico: "remanufatura",
          quantidade: triagem.quantidade_remanufatura,
          status: "pendente"
        });
      }
    }

    let itensCriados = 0;

    // 4. Inserir evitando duplicidade
    for (const mItem of manutItems) {
      // Verificar se já existe manutenção para este modelo + serviço nesta triagem
      const { data: exist, error: existError } = await supabase
        .from("manutencoes")
        .select("id")
        .eq("triagem_id", triagemId)
        .eq("tipo_servico", mItem.tipo_servico)
        .eq("modelo_nome_snapshot", mItem.modelo_nome_snapshot)
        .limit(1);

      if (existError) {
        motivos.push(`Erro ao verificar duplicidade: ${existError.message}`);
        continue;
      }

      if (exist && exist.length > 0) {
        itensIgnorados++;
        motivos.push(`Item '${mItem.modelo_nome_snapshot}' (${mItem.tipo_servico}) já existe.`);
        continue;
      }

      const { error: insError } = await supabase
        .from("manutencoes")
        .insert({
          ...mItem,
          data_entrada: new Date().toISOString(),
          created_at: new Date().toISOString()
        });

      if (insError) {
        motivos.push(`Erro ao inserir item '${mItem.modelo_nome_snapshot}': ${insError.message}`);
      } else {
        itensCriados++;
      }
    }

    return {
      success: true,
      itensCriados,
      itensIgnorados,
      motivos
    };
  } catch (err: any) {
    console.error("[gerarManutencoesDaTriagem] Erro:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Conclui a manutenção e envia para o estoque acumulado.
 */
export async function concluirManutencao(manutencaoId: string) {
  try {
    const supabase = createAdminClient();

    // 1. Buscar manutenção
    const { data: manutencoes, error: fetchError } = await supabase
      .from("manutencoes")
      .select("id, triagem_id, coleta_id, cliente_id, modelo_id, modelo_nome_snapshot, tipo_servico, quantidade, status")
      .eq("id", manutencaoId);

    if (fetchError) throw fetchError;
    const manut = manutencoes?.[0];

    if (!manut) return { success: false, error: "Manutenção não encontrada." };
    if (manut.status === "concluida") return { success: false, error: "Manutenção já está concluída." };
    if ((manut.quantidade || 0) <= 0) return { success: false, error: "Quantidade inválida para conclusão." };

    // 2. Atualizar status da manutenção
    const { error: updError } = await supabase
      .from("manutencoes")
      .update({
        status: "concluida",
        data_conclusao: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", manutencaoId);

    if (updError) throw updError;

    // 3. Atualizar Estoque Acumulado
    const clienteId = manut.cliente_id || "pce";
    
    // Tenta encontrar estoque existente
    const query = supabase
      .from("estoque_pallets")
      .select("id, quantidade")
      .eq("cliente_id", clienteId);

    if (manut.modelo_id) {
      query.eq("modelo_id", manut.modelo_id);
    } else {
      query.eq("modelo_nome_snapshot", manut.modelo_nome_snapshot);
    }

    const { data: estoqueData, error: estError } = await query.limit(1);
    if (estError) throw estError;

    const estoqueExistente = estoqueData?.[0];

    if (estoqueExistente) {
      // Atualiza
      const { error: saveError } = await supabase
        .from("estoque_pallets")
        .update({
          quantidade: (estoqueExistente.quantidade || 0) + manut.quantidade,
          updated_at: new Date().toISOString()
        })
        .eq("id", estoqueExistente.id);
      
      if (saveError) throw saveError;
    } else {
      // Cria novo
      const { error: insError } = await supabase
        .from("estoque_pallets")
        .insert({
          cliente_id: clienteId,
          modelo_id: manut.modelo_id,
          modelo_nome_snapshot: manut.modelo_nome_snapshot,
          quantidade: manut.quantidade,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (insError) throw insError;
    }

    revalidatePath("/admin/manutencao");
    revalidatePath("/admin/estoque");
    
    return { success: true, message: "Manutenção concluída e estoque atualizado." };
  } catch (err: any) {
    console.error("[concluirManutencao] Erro:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Inicia o processo de manutenção (status 'em_andamento').
 */
export async function iniciarManutencao(id: string) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("manutencoes")
      .update({ 
        status: "em_andamento", 
        data_inicio: new Date().toISOString(), 
        updated_at: new Date().toISOString() 
      })
      .eq("id", id);
    if (error) throw error;
    revalidatePath("/admin/manutencao");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Limpa registros inválidos (quantidade 0).
 */
export async function limparRegistrosInvalidos() {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("manutencoes")
      .delete()
      .eq("quantidade", 0);
    
    if (error) throw error;
    revalidatePath("/admin/manutencao");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Sincroniza manutenções pendentes de triagens já concluídas.
 */
export async function sincronizarManutencoesPendentes() {
  try {
    const supabase = createAdminClient();

    const { data: triagens, error: triError } = await supabase
      .from("triagens")
      .select("id, status")
      .in("status", ["concluida", "finalizada"]);

    if (triError) throw triError;

    let totalCriados = 0;
    let totalIgnorados = 0;
    let triagensVerificadas = 0;
    const todosMotivos: string[] = [];

    for (const tri of (triagens || [])) {
      triagensVerificadas++;
      const res = await gerarManutencoesDaTriagem(tri.id);
      if (res.success) {
        totalCriados += (res.itensCriados || 0);
        totalIgnorados += (res.itensIgnorados || 0);
      } else {
        todosMotivos.push(`Erro na triagem ${tri.id}: ${res.error}`);
      }
    }

    revalidatePath("/admin/manutencao");
    return { 
      success: true, 
      triagensVerificadas, 
      itensCriados: totalCriados, 
      itensIgnorados: totalIgnorados,
      motivos: todosMotivos 
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
