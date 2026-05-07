const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function getEnv() {
    const envPath = path.resolve(process.cwd(), '.env.local');
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    const env = {};
    lines.forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            env[key.trim()] = value.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
        }
    });
    return env;
}

const env = getEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function debugSync() {
    console.log("Starting Debug Sync...");
    
    // 1. Fetch triagens
    const { data: triagens, error: triError } = await supabase
      .from("triagens")
      .select("id, status, quantidade_manutencao, quantidade_remanufatura")
      .in("status", ["finalizada", "concluida"])
      .limit(5);

    if (triError) {
        console.error("Triagem Fetch Error:", triError);
        return;
    }

    console.log(`Found ${triagens.length} triagens to process.`);

    for (const tri of triagens) {
        console.log(`\n--- Processing Triagem: ${tri.id} ---`);
        console.log(`Status: ${tri.status}, Reforma (Total): ${tri.quantidade_manutencao}, Remanufatura (Total): ${tri.quantidade_remanufatura}`);

        // 2. Fetch items
        const { data: itens, error: itensError } = await supabase
          .from("triagem_itens")
          .select(`
            id,
            modelo_pallet_id,
            quantidade_reforma,
            quantidade_remanufatura
          `)
          .eq("triagem_id", tri.id);

        if (itensError) {
            console.error("Itens Fetch Error:", itensError);
        } else {
            console.log(`Found ${itens.length} items for this triagem.`);
            itens.forEach(it => {
                console.log(`  - Item ${it.id}: Reforma=${it.quantidade_reforma}, Remanufatura=${it.quantidade_remanufatura}`);
            });
        }

        // 3. Check for existing maintenance
        const { data: exist, error: exError } = await supabase
          .from("manutencoes")
          .select("id, tipo_servico, modelo_nome_snapshot")
          .eq("triagem_id", tri.id);

        if (exError) {
            console.error("Maintenance Check Error:", exError);
        } else {
            console.log(`Already have ${exist.length} maintenance records.`);
            exist.forEach(e => {
                console.log(`  - Existing: ${e.tipo_servico} for ${e.modelo_nome_snapshot}`);
            });
        }
    }
}

debugSync();
