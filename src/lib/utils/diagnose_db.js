const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bbtgnzndgmaeukwhsqwm.supabase.co';
const supabaseKey = 'sb_publishable_gMy7NAbvzbWNCxZulmOSFg_dvZGMC_j';
const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
  console.log("--- DIAGNÓSTICO TRIAGENS ---");
  
  // 1. Verificar contagem total
  const { count, error: countErr } = await supabase
    .from('triagens')
    .select('*', { count: 'exact', head: true });
  
  console.log("Contagem total de triagens:", count);
  if (countErr) console.error("Erro na contagem:", countErr);

  // 2. Verificar dados brutos (PCE)
  const { data: triagens, error: triError } = await supabase
    .from('triagens')
    .select('id, cliente_id, status, created_at')
    .eq('cliente_id', 'pce')
    .limit(5);

  console.log("Triagens PCE encontradas:", triagens?.length || 0);
  console.log("Amostra triagens:", triagens);
  if (triError) console.error("Erro ao buscar triagens:", triError);

  // 3. Verificar triagem_itens
  const { data: itens, error: itensErr } = await supabase
    .from('triagem_itens')
    .select('id, triagem_id, modelo_pallet_id')
    .limit(5);

  console.log("Itens de triagem encontrados:", itens?.length || 0);
  if (itensErr) console.error("Erro ao buscar itens:", itensErr);

  // 4. Testar a query exata usada na página
  const { data: complex, error: complexErr } = await supabase
    .from("triagens")
    .select(`
      *,
      itens:triagem_itens(
        *,
        modelo_pallet:modelos_pallets(id, nome, codigo, medidas)
      )
    `)
    .eq('cliente_id', 'pce')
    .limit(5);

  console.log("Query complexa retornou:", complex?.length || 0);
  if (complexErr) console.error("Erro na query complexa:", complexErr);
}

diagnose();
