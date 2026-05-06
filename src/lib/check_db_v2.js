const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log("Checking manutencoes schema...");
  const { data: m, error: e1 } = await supabase.from('manutencoes').select().limit(1);
  if (e1) console.error("manutencoes error:", e1);
  else console.log("manutencoes columns:", Object.keys(m[0] || {}));

  console.log("\nChecking estoque_pallets schema...");
  const { data: e, error: e2 } = await supabase.from('estoque_pallets').select().limit(1);
  if (e2) console.error("estoque_pallets error:", e2);
  else console.log("estoque_pallets columns:", Object.keys(e[0] || {}));
}

checkSchema();
