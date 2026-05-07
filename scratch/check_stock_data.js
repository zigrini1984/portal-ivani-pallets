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

async function checkTriggers() {
    console.log("Checking Triggers...");
    const { data, error } = await supabase.rpc('inspect_triggers', {}); 
    // Wait, I don't have this RPC. I'll use a direct query if possible, or just look at logs if I can't.
    // Actually, I can use the SQL query tool if I had it, but I don't.
    // I'll try to find any sql files in the project.
}

async function checkStockData() {
    const { data: est } = await supabase.from('estoque_pallets').select('*');
    console.log("Estoque Pallets Data:", est);
    
    const { data: mov } = await supabase.from('estoque_movimentacoes').select('*').limit(5);
    console.log("Estoque Movimentacoes Data (last 5):", mov);
}

checkStockData();
