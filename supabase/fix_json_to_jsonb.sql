-- Script para converter todas as colunas JSON para JSONB
-- Resolve o erro "operator does not exist: json ? unknown"

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Loop por todas as colunas que são do tipo 'json' no schema 'public'
    FOR r IN (
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND data_type = 'json'
    ) LOOP
        -- Executa a alteração de tipo com o cast USING ::jsonb para garantir a integridade dos dados
        EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I TYPE jsonb USING %I::jsonb', 
                       r.table_name, r.column_name, r.column_name);
        
        RAISE NOTICE 'Convertida coluna %%.%% de JSON para JSONB', r.table_name, r.column_name;
    END LOOP;
END $$;
