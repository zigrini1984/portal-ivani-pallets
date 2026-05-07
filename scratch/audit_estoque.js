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

async function auditEstoque() {
    console.log("Auditing Stock Tables...");
    
    // Check estoque_pallets
    const { data: pData, error: pError } = await supabase.from('estoque_pallets').select('*').limit(1);
    if (pError) {
        console.error("estoque_pallets Error:", pError.message);
    } else {
        console.log("estoque_pallets columns:", pData.length > 0 ? Object.keys(pData[0]) : "Table empty");
    }

    // Check estoque_movimentacoes
    const { data: mData, error: mError } = await supabase.from('estoque_movimentacoes').select('*').limit(1);
    if (mError) {
        console.error("estoque_movimentacoes Error:", mError.message);
    } else {
        console.log("estoque_movimentacoes columns:", mData.length > 0 ? Object.keys(mData[0]) : "Table empty");
    }
    
    // Probe columns of estoque_pallets if empty
    if (pData && pData.length === 0) {
        const { error } = await supabase.from('estoque_pallets').insert({});
        console.log("estoque_pallets Probe Error:", error?.message);
        console.log("estoque_pallets Probe Details:", error?.details);
    }
}

auditEstoque();
