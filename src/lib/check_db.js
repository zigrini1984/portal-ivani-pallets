const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log("Checking coletas schema...");
  const { data: coletas, error: e1 } = await supabase.from('coletas').select().limit(1);
  if (e1) console.error("Coletas error:", e1);
  else console.log("Coletas sample:", coletas);

  console.log("\nChecking triagens schema...");
  const { data: triagens, error: e2 } = await supabase.from('triagens').select().limit(1);
  if (e2) console.error("Triagens error:", e2);
  else console.log("Triagens sample:", triagens);
}

checkSchema();
