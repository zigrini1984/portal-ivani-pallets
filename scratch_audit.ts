import { createAdminClient } from "./src/lib/supabase/admin";

async function audit() {
  const supabase = createAdminClient();

  console.log("--- AUDIT START ---");

  // 1. Check Tables
  const { data: tables } = await supabase.rpc('get_tables_names'); // Might not exist
  // Fallback: simple query to a table to see if it exists
  const checkTable = async (name: string) => {
    const { error } = await supabase.from(name).select('id').limit(1);
    console.log(`Table ${name}: ${error ? 'ERROR (' + error.message + ')' : 'OK'}`);
  };

  await checkTable('triagens');
  await checkTable('triagem_itens');
  await checkTable('manutencoes');
  await checkTable('modelos_pallets');

  // 2. Check Columns of triagens
  const { data: triagemColumns } = await supabase.from('triagens').select('*').limit(1);
  if (triagemColumns && triagemColumns.length > 0) {
    console.log("Triagens Columns:", Object.keys(triagemColumns[0]));
  }

  // 3. Check Columns of triagem_itens
  const { data: itemColumns } = await supabase.from('triagem_itens').select('*').limit(1);
  if (itemColumns && itemColumns.length > 0) {
    console.log("Triagem Itens Columns:", Object.keys(itemColumns[0]));
  }

  // 4. Check Data in manutencoes
  const { data: manutData } = await supabase.from('manutencoes').select('*').limit(5);
  console.log("Manutencoes Data Count:", manutData?.length || 0);
  if (manutData && manutData.length > 0) {
    console.log("Manutencoes Sample:", manutData[0]);
  }

  console.log("--- AUDIT END ---");
}

audit();
