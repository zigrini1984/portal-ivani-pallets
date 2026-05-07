"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

/**
 * Gera registros de manutenção para uma triagem finalizada.
 * Regras:
 * - Apenas 'reforma' e 'remanufatura'.
 * - Ignora 'compra' e 'sucata'.
 * - Evita duplicidade (triagem_id + tipo_servico + modelo).
 */
export async function gerarManutencoesDaTriagem(triagemId: string) {
  try {
    const supabase = createAdminClient();
    const motivos: string[] = [];
    let itensCriados = 0;
    let itensIgnorados = 0;

    // 1. Buscar a triagem (totais e metadados)
    const { data: triData, error: triError } = await supabase
      .from("triagens")
      .select("id, coleta_id, cliente_id, status, quantidade_manutencao, quantidade_remanufatura, quantidade_sucata, quantidade_compra_ivani")
      .eq("id", triagemId);

    if (triError) throw triError;
    const triagem = triData?.[0];
    if (!triagem) return { success: false, error: "Triagem não encontrada." };

    // 2. Buscar itens triados por modelo
    const { data: itens, error: itensError } = await supabase
      .from("triagem_itens")
      .select(`
        id,
        modelo_pallet_id,
        quantidade_reforma,
        quantidade_remanufatura,
        modelos_pallets(id, nome)
      `)
      .eq("triagem_id", triagemId);

    if (itensError) {
       console.warn(`[gerarManutencoesDaTriagem] Erro ao buscar itens:`, itensError.message);
       motivos.push(`Erro ao buscar itens detalhados: ${itensError.message}`);
    }

    const clienteId = triagem.cliente_id || "pce";
    const manutItems: any[] = [];

    // 3. Processar Itens por Modelo
    if (itens && itens.length > 0) {
      for (const it of itens) {
        // Supabase returns relationship as object (1-1) or array (1-n)
        const modeloData: any = it.modelos_pallets;
        const modelo = Array.isArray(modeloData) ? modeloData[0] : modeloData;
        const modeloId = modelo?.id || it.modelo_pallet_id;
        const modeloNome = modelo?.nome || "Modelo não identificado";

        // Caso Reforma
        if ((it.quantidade_reforma || 0) > 0) {
          const qty = it.quantidade_reforma;
          manutItems.push({
            triagem_id: triagemId,
            coleta_id: triagem.coleta_id,
            cliente_id: clienteId,
            modelo_id: modeloId,
            modelo_pallet_id: modeloId,
            modelo_nome_snapshot: modeloNome,
            tipo_servico: "reforma",
            quantidade: qty,
            quantidade_entrada: qty,
            quantidade_concluida: 0
          });
        }

        // Caso Remanufatura
        if ((it.quantidade_remanufatura || 0) > 0) {
          const qty = it.quantidade_remanufatura;
          manutItems.push({
            triagem_id: triagemId,
            coleta_id: triagem.coleta_id,
            cliente_id: clienteId,
            modelo_id: modeloId,
            modelo_pallet_id: modeloId,
            modelo_nome_snapshot: modeloNome,
            tipo_servico: "remanufatura",
            quantidade: qty,
            quantidade_entrada: qty,
            quantidade_concluida: 0
          });
        }
      }
    }

    // 4. Fallback
    if (manutItems.length === 0) {
      if ((triagem.quantidade_manutencao || 0) > 0) {
        const qty = triagem.quantidade_manutencao;
        manutItems.push({
          triagem_id: triagemId,
          coleta_id: triagem.coleta_id,
          cliente_id: clienteId,
          modelo_nome_snapshot: "Modelo Geral (Reforma)",
          tipo_servico: "reforma",
          quantidade: qty,
          quantidade_entrada: qty,
          quantidade_concluida: 0
        });
      }
      if ((triagem.quantidade_remanufatura || 0) > 0) {
        const qty = triagem.quantidade_remanufatura;
        manutItems.push({
          triagem_id: triagemId,
          coleta_id: triagem.coleta_id,
          cliente_id: clienteId,
          modelo_nome_snapshot: "Modelo Geral (Remanufatura)",
          tipo_servico: "remanufatura",
          quantidade: qty,
          quantidade_entrada: qty,
          quantidade_concluida: 0
        });
      }
      
      if (manutItems.length === 0) {
          motivos.push(`Triagem ${triagemId.substring(0,8)} não possui quantidades de reforma ou remanufatura.`);
      }
    }

    // 5. Inserir
    for (const mItem of manutItems) {
      const { data: exist, error: exError } = await supabase
        .from("manutencoes")
        .select("id")
        .eq("triagem_id", triagemId)
        .eq("tipo_servico", mItem.tipo_servico)
        .eq("modelo_nome_snapshot", mItem.modelo_nome_snapshot)
        .limit(1);

      if (exist && exist.length > 0) {
        itensIgnorados++;
        motivos.push(`Item '${mItem.modelo_nome_snapshot}' (${mItem.tipo_servico}) já sincronizado.`);
        continue;
      }

      const { error: insError } = await supabase
        .from("manutencoes")
        .insert({
          ...mItem,
          status: "pendente",
          data_entrada: new Date().toISOString(),
          created_at: new Date().toISOString()
        });

      if (insError) {
        motivos.push(`Erro ao criar manutenção para ${mItem.modelo_nome_snapshot}: ${insError.message}`);
      } else {
        itensCriados++;
      }
    }

    console.log(`[gerarManutencoesDaTriagem] Triagem ${triagemId}: ${itensCriados} criados, ${itensIgnorados} ignorados.`);

    return {
      success: true,
      triagemId,
      itensCriados,
      itensIgnorados,
      motivos
    };
  } catch (err: any) {
    console.error("[gerarManutencoesDaTriagem] Falha fatal:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Sincroniza manutenções pendentes de triagens concluídas/finalizadas.
 */
export async function sincronizarManutencoesPendentes() {
  try {
    const supabase = createAdminClient();

    // 1. Buscar triagens que podem ter manutenções (finalizada ou concluida)
    const { data: triagens, error: triError } = await supabase
      .from("triagens")
      .select("id, status")
      .in("status", ["finalizada", "concluida"])
      .order("created_at", { ascending: false })
      .limit(50); // Limite de segurança para evitar timeout

    if (triError) throw triError;
    if (!triagens || triagens.length === 0) {
        return { success: true, triagensVerificadas: 0, itensCriados: 0, itensIgnorados: 0, motivos: ["Nenhuma triagem finalizada encontrada."] };
    }

    let totalCriados = 0;
    let totalIgnorados = 0;
    let triagensVerificadas = 0;
    const todosMotivos: string[] = [];

    // 2. Processar cada triagem
    for (const tri of triagens) {
      triagensVerificadas++;
      const res = await gerarManutencoesDaTriagem(tri.id);
      
      if (res.success) {
        totalCriados += (res.itensCriados || 0);
        totalIgnorados += (res.itensIgnorados || 0);
        if (res.motivos) {
            todosMotivos.push(...res.motivos);
        }
      } else {
        todosMotivos.push(`Erro Crítico na Triagem ${tri.id.substring(0,8)}: ${res.error}`);
      }
    }

    revalidatePath("/admin/manutencao");
    
    return { 
      success: true, 
      triagensVerificadas, 
      itensCriados: totalCriados, 
      itensIgnorados: totalIgnorados,
      motivos: Array.from(new Set(todosMotivos)) // Remove duplicados
    };
  } catch (err: any) {
    console.error("[sincronizarManutencoesPendentes] Erro:", err.message);
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
    const { data: manutData, error: fetchError } = await supabase
      .from("manutencoes")
      .select("id, cliente_id, modelo_id, modelo_pallet_id, modelo_nome_snapshot, tipo_servico, quantidade, quantidade_entrada, status")
      .eq("id", manutencaoId);

    if (fetchError) throw fetchError;
    const manut = manutData?.[0];

    if (!manut) return { success: false, error: "Manutenção não encontrada." };
    if (manut.status === "concluida") return { success: false, error: "Este item já foi concluído." };

    // 2. Atualizar status da manutenção
    const { error: updError } = await supabase
      .from("manutencoes")
      .update({
        status: "concluida",
        quantidade_concluida: manut.quantidade || manut.quantidade_entrada,
        data_conclusao: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", manutencaoId);

    if (updError) throw updError;

    // 3. Atualizar Estoque Acumulado (estoque_pallets)
    const clienteId = manut.cliente_id || "pce";
    
    // Tenta encontrar estoque existente por modelo
    let query = supabase
      .from("estoque_pallets")
      .select("id, quantidade")
      .eq("cliente_id", clienteId);

    if (manut.modelo_id || manut.modelo_pallet_id) {
      query = query.or(`modelo_id.eq.${manut.modelo_id},modelo_pallet_id.eq.${manut.modelo_pallet_id || manut.modelo_id}`);
    } else {
      query = query.eq("modelo_nome_snapshot", manut.modelo_nome_snapshot);
    }

    const { data: estData, error: estError } = await query.limit(1);
    if (estError) throw estError;

    const estoqueExistente = estData?.[0];
    const qtyFinal = Number(manut.quantidade || manut.quantidade_entrada || 0);

    if (estoqueExistente) {
      const { error: saveError } = await supabase
        .from("estoque_pallets")
        .update({
          quantidade: (estoqueExistente.quantidade || 0) + qtyFinal,
          updated_at: new Date().toISOString()
        })
        .eq("id", estoqueExistente.id);
      
      if (saveError) throw saveError;
    } else {
      const { error: insError } = await supabase
        .from("estoque_pallets")
        .insert({
          cliente_id: clienteId,
          modelo_id: manut.modelo_id || manut.modelo_pallet_id,
          modelo_pallet_id: manut.modelo_pallet_id || manut.modelo_id,
          modelo_nome_snapshot: manut.modelo_nome_snapshot,
          quantidade: qtyFinal,
          updated_at: new Date().toISOString()
        });
      
      if (insError) throw insError;
    }

    revalidatePath("/admin/manutencao");
    revalidatePath("/admin/estoque");
    
    return { success: true };
  } catch (err: any) {
    console.error("[concluirManutencao] Erro:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Inicia a manutenção (pendente -> em_andamento).
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
 * Remove registros inválidos ou zerados.
 */
export async function limparRegistrosInvalidos() {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("manutencoes")
      .delete()
      .or("quantidade.eq.0,quantidade_entrada.eq.0,quantidade_entrada.is.null");
    
    if (error) throw error;
    revalidatePath("/admin/manutencao");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
