import { createClient as createBrowserClient } from "@/lib/supabase/client";

// Função interna para obter o client correto dependendo do ambiente
async function getSupabase() {
  return createBrowserClient();
}

export interface DashboardKPIs {
  operacao: {
    total_coletado: number;
    total_processado: number;
    total_estoque: number;
    total_entregue: number;
    volume_mensal: number;
    numero_coletas: number;
    tempo_medio_ciclo: string;
  };
  eficiencia: {
    taxa_reaproveitamento: number;
    taxa_sucata: number;
    taxa_reforma: number;
    taxa_remanufatura: number;
    eficiencia_recuperacao: number;
    perda_operacional: number;
  };
  financeiro: {
    economia_total: number;
    custo_evitar_novo: number;
    valor_recuperado: number;
    custo_medio_pallet: number;
    economia_por_pallet: number;
    roi_operacao: number;
  };
  esg: {
    arvores_preservadas: number;
    co2_evitado: number;
    madeira_reutilizada: number;
    residuos_evitar: number;
  };
  performance: {
    crescimento_mensal: number;
    tendencia_volume: "up" | "down" | "stable";
    indice_performance: number;
  };
}

export async function fetchDashboardKPIs(clienteId: string = "pce", supabaseParam?: any): Promise<DashboardKPIs> {
  try {
    const supabase = supabaseParam || await getSupabase();

    // 1. Fetch data from Supabase
    const [
      { data: coletas },
      { data: triagens },
      { data: estoque },
      { data: movimentacoes },
      { data: modelos }
    ] = await Promise.all([
      supabase.from("coletas").select("*").eq("cliente_id", clienteId),
      supabase.from("triagens").select("*").eq("cliente_id", clienteId),
      supabase.from("estoque_pallets").select("*").eq("cliente_id", clienteId),
      supabase.from("estoque_movimentacoes").select("*").eq("cliente_id", clienteId),
      supabase.from("modelos_pallets").select("*").eq("cliente_id", clienteId)
    ]);

    const coletasArr = coletas || [];
    const triagensArr = triagens || [];
    const estoqueArr = estoque || [];
    const movimentacoesArr = movimentacoes || [];
    const modelosArr = modelos || [];

    // --- CÁLCULOS BASE ---
    const total_coletado = coletasArr.reduce((acc: number, c: any) => acc + (c.quantidade_material_bruto || 0), 0);
    const total_processado = triagensArr.reduce((acc: number, t: any) => acc + (t.quantidade_total || 0), 0);
    const total_estoque = estoqueArr.reduce((acc: number, e: any) => acc + (e.quantidade_disponivel || 0), 0);
    const total_entregue = movimentacoesArr
      .filter((m: any) => m.tipo === "saida")
      .reduce((acc: number, m: any) => acc + (m.quantidade || 0), 0);

    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    
    const triagensMesAtual = triagensArr.filter((t: any) => {
      const d = new Date(t.created_at);
      return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
    });
    
    const volume_mensal = triagensMesAtual.reduce((acc: number, t: any) => acc + (t.quantidade_total || 0), 0);
    const numero_coletas = coletasArr.length;

    // Tempo médio de ciclo (coleta -> triagem)
    const temposCiclo = triagensArr
      .map((t: any) => {
        const coleta = coletasArr.find((c: any) => c.id === t.coleta_id);
        if (!coleta) return null;
        return new Date(t.created_at).getTime() - new Date(coleta.data_coleta).getTime();
      })
      .filter((t: any): t is number => t !== null);
    
    const tempo_medio_ciclo_ms = temposCiclo.length > 0 
      ? temposCiclo.reduce((acc: number, t: number) => acc + t, 0) / temposCiclo.length 
      : 0;
    const tempo_medio_ciclo = `${Math.round(tempo_medio_ciclo_ms / (1000 * 60 * 60 * 24))} dias`;

    // --- EFICIÊNCIA ---
    const reforma = triagensArr.reduce((acc: number, t: any) => acc + (t.quantidade_manutencao || 0), 0);
    const remanufatura = triagensArr.reduce((acc: number, t: any) => acc + (t.quantidade_remanufatura || 0), 0);
    const compra = triagensArr.reduce((acc: number, t: any) => acc + (t.quantidade_compra_ivani || 0), 0);
    const total_recuperado = reforma + remanufatura + compra;
    
    const sucata = total_processado - total_recuperado;

    const taxa_reaproveitamento = total_processado > 0 ? (total_recuperado / total_processado) * 100 : 0;
    const taxa_sucata = total_processado > 0 ? (Math.max(0, sucata) / total_processado) * 100 : 0;
    const taxa_reforma = total_processado > 0 ? (reforma / total_processado) * 100 : 0;
    const taxa_remanufatura = total_processado > 0 ? (remanufatura / total_processado) * 100 : 0;
    const eficiencia_recuperacao = taxa_reaproveitamento;
    const perda_operacional = total_coletado > 0 ? (Math.max(0, sucata) / total_coletado) * 100 : 0;

    // --- FINANCEIRO ---
    let economia_total = 0;
    let investimento_reparos = 0;
    let custo_evitar_novo = 0;

    triagensArr.forEach((t: any) => {
      const modelo = modelosArr.find((m: any) => m.id === t.modelo_pallet_id);
      if (modelo) {
        const pNovo = modelo.preco_pallet_novo || 80;
        const pRef = modelo.preco_reforma || 20;
        const pReman = modelo.preco_remanufatura || 35;
        
        const qRef = t.quantidade_manutencao || 0;
        const qReman = t.quantidade_remanufatura || 0;
        
        const econRef = (pNovo - pRef) * qRef;
        const econReman = (pNovo - pReman) * qReman;
        
        economia_total += (econRef + econReman);
        investimento_reparos += (pRef * qRef) + (pReman * qReman);
        custo_evitar_novo += pNovo * (qRef + qReman);
      }
    });

    const valor_recuperado = economia_total;
    const custo_medio_pallet = total_recuperado > 0 ? investimento_reparos / total_recuperado : 0;
    const economia_por_pallet = total_recuperado > 0 ? economia_total / total_recuperado : 0;
    const roi_operacao = investimento_reparos > 0 ? (economia_total / investimento_reparos) * 100 : 0;

    // --- ESG ---
    const arvores_preservadas = total_recuperado / 25;
    const co2_evitado = total_recuperado * 12.5;
    const madeira_reutilizada = total_recuperado * 0.025;
    const residuos_evitar = total_recuperado * 25;

    // --- PERFORMANCE ---
    const mesAnterior = mesAtual === 0 ? 11 : mesAtual - 1;
    const anoAnterior = mesAtual === 0 ? anoAtual - 1 : anoAtual;
    
    const triagensMesAnterior = triagensArr.filter((t: any) => {
      const d = new Date(t.created_at);
      return d.getMonth() === mesAnterior && d.getFullYear() === anoAnterior;
    });
    
    const volumeMesAnterior = triagensMesAnterior.reduce((acc: number, t: any) => acc + (t.quantidade_total || 0), 0);
    const crescimento_mensal = volumeMesAnterior > 0 
      ? ((volume_mensal - volumeMesAnterior) / volumeMesAnterior) * 100 
      : 0;
    
    const tendencia_volume = volume_mensal > volumeMesAnterior ? "up" : volume_mensal < volumeMesAnterior ? "down" : "stable";
    const indice_performance = (taxa_reaproveitamento * 0.7) + (Math.min(Math.max(0, crescimento_mensal), 100) * 0.3);

    return {
      operacao: { total_coletado, total_processado, total_estoque, total_entregue, volume_mensal, numero_coletas, tempo_medio_ciclo },
      eficiencia: { taxa_reaproveitamento, taxa_sucata, taxa_reforma, taxa_remanufatura, eficiencia_recuperacao, perda_operacional },
      financeiro: { economia_total, custo_evitar_novo, valor_recuperado, custo_medio_pallet, economia_por_pallet, roi_operacao },
      esg: { arvores_preservadas, co2_evitado, madeira_reutilizada, residuos_evitar },
      performance: { crescimento_mensal, tendencia_volume, indice_performance }
    };
  } catch (error) {
    console.error("fetchDashboardKPIs Error:", error);
    return {
      operacao: { total_coletado: 0, total_processado: 0, total_estoque: 0, total_entregue: 0, volume_mensal: 0, numero_coletas: 0, tempo_medio_ciclo: "---" },
      eficiencia: { taxa_reaproveitamento: 0, taxa_sucata: 0, taxa_reforma: 0, taxa_remanufatura: 0, eficiencia_recuperacao: 0, perda_operacional: 0 },
      financeiro: { economia_total: 0, custo_evitar_novo: 0, valor_recuperado: 0, custo_medio_pallet: 0, economia_por_pallet: 0, roi_operacao: 0 },
      esg: { arvores_preservadas: 0, co2_evitado: 0, madeira_reutilizada: 0, residuos_evitar: 0 },
      performance: { crescimento_mensal: 0, tendencia_volume: "stable", indice_performance: 0 }
    };
  }
}
