-- Estrutura para gestão de lotes e eventos (Portal PCE)

-- Tabela de Lotes
CREATE TABLE IF NOT EXISTS public.lotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_lote TEXT NOT NULL,
    data_entrada TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    quantidade INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'triagem', -- triagem, manutencao, remanufatura, descarte, compra, finalizado
    destino TEXT DEFAULT 'A definir', -- manutencao, remanufatura, descarte, compra
    prioridade TEXT DEFAULT 'Normal', -- Baixa, Normal, Alta
    observacao TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Eventos (Timeline)
CREATE TABLE IF NOT EXISTS public.lote_eventos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lote_id UUID REFERENCES public.lotes(id) ON DELETE CASCADE,
    etapa TEXT NOT NULL, -- coleta_solicitada, coleta_realizada, recebido, triagem, processo, finalizado
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Opcional, mas recomendado. Como o usuário pediu anon key sem service role, supõe-se que as políticas permitam leitura/escrita anon)
-- ALTER TABLE public.lotes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.lote_eventos ENABLE ROW LEVEL SECURITY;

-- Exemplo de inserção de dados iniciais (Seed)
/*
INSERT INTO public.lotes (numero_lote, quantidade, status, destino, prioridade)
VALUES 
('LOTE-2024-001', 250, 'manutencao', 'Reforma', 'Normal'),
('LOTE-2024-002', 400, 'triagem', 'A definir', 'Alta'),
('LOTE-2024-003', 150, 'finalizado', 'compra', 'Baixa');
*/
