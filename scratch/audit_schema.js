const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function getEnv() {
    const envPath = path.resolve(process.cwd(), '.env.local');
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const idx = line.indexOf('=');
        if (idx > 0) {
            const key = line.substring(0, idx).trim();
            const value = line.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
            env[key] = value;
        }
    });
    return env;
}

const env = getEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function audit() {
    const tables = ['triagem_itens', 'manutencoes', 'estoque_pallets', 'modelos_pallets', 'triagens'];
    for (const t of tables) {
        const { data, error } = await supabase.from(t).select('*').limit(1);
        if (error) { console.log(`[${t}] ERROR:`, error.message); }
        else if (data && data.length > 0) { console.log(`[${t}] COLS:`, Object.keys(data[0]).join(', ')); }
        else {
            // try an insert with empty object to see schema error
            const { error: e2 } = await supabase.from(t).insert({});
            console.log(`[${t}] EMPTY. Probe:`, e2?.message || 'no probe error');
        }
    }
}
audit();
