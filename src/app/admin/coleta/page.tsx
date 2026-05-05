"use server";

import { createClient } from "@supabase/supabase-js";

function createAuthClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl) throw new Error("URL do Supabase não configurada");
  if (!serviceRoleKey) throw new Error("Service Role Key não configurada");

  return createClient(supabaseUrl, serviceRoleKey);
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
  } catch {
    return value;
  }
}

export default async function AdminColetaPage() {
  let coletas: any[] = [];
  let error: any = null;

  try {
    const supabase = createAuthClient();

    const { data, error: supabaseError } = await supabase
      .from("coletas")
      .select("*")
      .eq("cliente_id", "pce")
      .order("created_at", { ascending: false });

    if (supabaseError) {
      error = supabaseError.message;
    } else {
      coletas = data || [];
    }
  } catch (err: any) {
    error = err.message;
  }

  console.log("COLETAS:", coletas);
  console.log("ERRO:", error);

  return (
    <main style={{ padding: 40 }}>
      <h1>Registro de Coletas</h1>

      {/* ERRO */}
      {error && (
        <div style={{ background: "#ffe5e5", padding: 20 }}>
          <h3 style={{ color: "red" }}>Erro ao carregar coletas</h3>
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}

      {/* SEM DADOS */}
      {!error && coletas.length === 0 && (
        <div style={{ padding: 20 }}>
          Nenhuma coleta encontrada.
        </div>
      )}

      {/* TABELA */}
      {!error && coletas.length > 0 && (
        <table border={1} cellPadding={10}>
          <thead>
            <tr>
              <th>Data</th>
              <th>Quantidade</th>
              <th>Motorista</th>
              <th>Caminhão</th>
              <th>Status</th>
              <th>Observação</th>
            </tr>
          </thead>

          <tbody>
            {coletas.map((c: any) => (
              <tr key={c.id}>
                <td>{formatDate(c.data_coleta)}</td>
                <td>{c.quantidade_material_bruto}</td>
                <td>{c.motorista || "-"}</td>
                <td>{c.caminhao || "-"}</td>
                <td>{c.status || "registrado"}</td>
                <td>{c.observacao || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}