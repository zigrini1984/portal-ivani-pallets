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

    // 1. Buscar dados da triagem com nomes de colunas verificados
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

    if (itensError) {
       console.error("[gerarManutencoesDaTriagem] Erro ao buscar triagem_itens:", itensError.message);
    }

    const manutItems: any[] = [];
    const clienteId = triagem.cliente_id || "pce";

    // 3. Processar itens detalhados (Prioridade 1)
    if (itens && itens.length > 0) {
      for (const item of itens) {
        const modeloNome = (item.modelos_pallets as any)?.nome || "Modelo não informado";
        const modeloId = (item.modelos_pallets as any)?.id || item.modelo_pallet_id;

        if (Number(item.quantidade_reforma || 0) > 0) {
          manutItems.push({
            triagem_id: triagemId,
            coleta_id: triagem.coleta_id,
            cliente_id: clienteId,
            modelo_id: modeloId,
            modelo_nome_snapshot: modeloNome,
            tipo_servico: "reforma",
            quantidade: Number(item.quantidade_reforma),
            status: "pendente"
          });
        }

        if (Number(item.quantidade_remanufatura || 0) > 0) {
          manutItems.push({
            triagem_id: triagemId,
            coleta_id: triagem.coleta_id,
            cliente_id: clienteId,
            modelo_id: modeloId,
            modelo_nome_snapshot: modeloNome,
            tipo_servico: "remanufatura",
            quantidade: Number(item.quantidade_remanufatura),
            status: "pendente"
          });
        }
      }
    } 
    
    // 4. Fallback: Se não houver itens detalhados MAS houver totais na triagem (Prioridade 2)
    // Só entra aqui se NENHUM item detalhado foi encontrado com quantidade > 0
    if (manutItems.length === 0) {
      if (Number(triagem.quantidade_manutencao || 0) > 0) {
        manutItems.push({
          triagem_id: triagemId,
          coleta_id: triagem.coleta_id,
          cliente_id: clienteId,
          modelo_nome_snapshot: "Modelo não especificado (Reforma)",
          tipo_servico: "reforma",
          quantidade: Number(triagem.quantidade_manutencao),
          status: "pendente"
        });
      }

      if (Number(triagem.quantidade_remanufatura || 0) > 0) {
        manutItems.push({
          triagem_id: triagemId,
          coleta_id: triagem.coleta_id,
          cliente_id: clienteId,
          modelo_nome_snapshot: "Modelo não especificado (Remanufatura)",
          tipo_servico: "remanufatura",
          quantidade: Number(triagem.quantidade_remanufatura),
          status: "pendente"
        });
      }
    }

    if (manutItems.length === 0) {
      return { success: true, created: 0, message: "Sem quantidades válidas." };
    }

    let criadosCount = 0;
    // 5. Inserir evitando duplicidade (triagem + modelo + servico)
    for (const mItem of manutItems) {
      const { data: exist } = await supabase
        .from("manutencoes")
        .select("id")
        .eq("triagem_id", triagemId)
        .eq("tipo_servico", mItem.tipo_servico)
        .eq("modelo_nome_snapshot", mItem.modelo_nome_snapshot)
        .limit(1);

      if (!exist || exist.length === 0) {
        const { error: insErr } = await supabase.from("manutencoes").insert({
            ...mItem,
            data_entrada: new Date().toISOString(),
            created_at: new Date().toISOString()
        });
        if (!insErr) criadosCount++;
        else console.error("[gerarManutencoesDaTriagem] Erro ao inserir:", insErr.message);
      }
    }

    return { success: true, created: criadosCount };
  } catch (err: any) {
    console.error("[gerarManutencoesDaTriagem] Erro fatal:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Sincroniza manutenções pendentes de todas as triagens concluídas.
 */
export async function sincronizarManutencoesPendentes() {
  try {
    const supabase = createAdminClient();

    // 1. Buscar triagens com qualquer status de conclusão conhecido
    const { data: triagens, error: triError } = await supabase
      .from("triagens")
      .select("id, status")
      .in("status", ["concluida", "finalizada", "concluido", "finalizado"]);

    if (triError) throw triError;

    let totalCriados = 0;
    let triagensVerificadas = 0;
    const motivos: string[] = [];

    for (const tri of (triagens || [])) {
      triagensVerificadas++;
      const res = await gerarManutencoesDaTriagem(tri.id);
      if (res.success) {
        totalCriados += (res.created || 0);
        if (res.created === 0 && triagens?.length === 1) {
            motivos.push(res.message || "Já sincronizada.");
        }
      } else {
        motivos.push(`Erro na triagem ${tri.id.split('-')[0]}: ${res.error}`);
      }
    }

    revalidatePath("/admin/manutencao");
    return { 
      success: true, 
      verificadas: triagensVerificadas, 
      criados: totalCriados,
      motivos 
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Limpa registros inválidos (quantidade 0 ou sem identificação mínima).
 */
export async function limparRegistrosInvalidos() {
    try {
        const supabase = createAdminClient();
        const { error } = await supabase
            .from("manutencoes")
            .delete()
            .or("quantidade.eq.0,modelo_nome_snapshot.eq.'Modelo s/ Nome',modelo_nome_snapshot.eq.'Modelo não informado'");
        
        if (error) throw error;
        revalidatePath("/admin/manutencao");
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/**
 * Inicia o processo de manutenção.
 */
export async function iniciarManutencao(id: string) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("manutencoes")
      .update({ status: "em_andamento", data_inicio: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    revalidatePath("/admin/manutencao");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Conclui a manutenção e atualiza estoque.
 */
export async function concluirManutencao(id: string) {
  try {
    const supabase = createAdminClient();

    const { data: item, error: fetchError } = await supabase
      .from("manutencoes")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !item) throw new Error("Registro não encontrado.");
    if (item.status === "concluida") throw new Error("Já está concluído.");

    // 1. Atualizar manutenção
    const { error: updErr } = await supabase
      .from("manutencoes")
      .update({ 
          status: "concluida", 
          data_conclusao: new Date().toISOString(),
          updated_at: new Date().toISOString()
      })
      .eq("id", id);
    
    if (updErr) throw updErr;

    // 2. Atualizar Estoque (Somente se houver modelo_id)
    if (item.modelo_id) {
        const { data: estoque } = await supabase
            .from("estoque_pallets")
            .select("id, quantidade")
            .eq("modelo_id", item.modelo_id)
            .eq("cliente_id", item.cliente_id || "pce")
            .limit(1);

        if (estoque && estoque.length > 0) {
            await supabase
                .from("estoque_pallets")
                .update({ 
                    quantidade: (estoque[0].quantidade || 0) + item.quantidade,
                    updated_at: new Date().toISOString()
                })
                .eq("id", estoque[0].id);
        } else {
            await supabase.from("estoque_pallets").insert({
                cliente_id: item.cliente_id || "pce",
                modelo_id: item.modelo_id,
                modelo_nome_snapshot: item.modelo_nome_snapshot,
                quantidade: item.quantidade
            });
        }
    }

    revalidatePath("/admin/manutencao");
    revalidatePath("/admin/estoque");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
