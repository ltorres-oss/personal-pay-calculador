-- ==============================================================================
-- SCHEMA SUPABASE: PERSONAL PAY CALCULADOR & SIMULADOR DE PROMESAS
-- Ejecutar este script en el SQL Editor de tu proyecto en Supabase
-- ==============================================================================

-- 1. TABLA PRINCIPAL DE CRÉDITOS Y CUOTAS (Base Diaria)
-- Esta tabla se reemplaza íntegramente con cada nueva caída diaria
CREATE TABLE IF NOT EXISTS public.credits (
    id BIGSERIAL PRIMARY KEY,
    agencia TEXT,
    id_comercio TEXT,
    cuil TEXT NOT NULL,
    articulo TEXT,
    nro_credito TEXT,
    id_solicitud TEXT,
    nro_cuota INT DEFAULT 0,
    fecha_compra TEXT,
    total_cuotas INT DEFAULT 0,
    capital NUMERIC(15, 2) DEFAULT 0,
    intereses_compensatorio NUMERIC(15, 2) DEFAULT 0,
    intereses_devengado NUMERIC(15, 2) DEFAULT 0,
    iva_intereses_compensatorio NUMERIC(15, 2) DEFAULT 0,
    gastos NUMERIC(15, 2) DEFAULT 0,
    iva_gastos NUMERIC(15, 2) DEFAULT 0,
    punitorios NUMERIC(15, 2) DEFAULT 0,
    iva_punitorios NUMERIC(15, 2) DEFAULT 0,
    importe_total NUMERIC(15, 2) DEFAULT 0,
    proximo_vto TEXT,
    dias_de_mora INT DEFAULT 0,
    fecha_cobro TEXT,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    rango_etario TEXT,
    edad INT DEFAULT 0,
    flag_empleado TEXT,
    city TEXT,
    province TEXT,
    document_number TEXT,
    codigo_riesgo TEXT,
    phone_number TEXT,
    phone_number_164 TEXT,
    flag_deudor_extrapay TEXT,
    tna_credito NUMERIC(10, 4) DEFAULT 0,
    comercio_de_compra TEXT,
    convergencia TEXT,
    repeaters TEXT,
    nse TEXT,
    bk TEXT,
    max_dias_mora_por_cuil INT DEFAULT 0,
    bk_automatico TEXT,
    tipo_producto TEXT,
    fecha_asignacion TEXT,
    fecha_fin_asignacion TEXT,
    n_nomina TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices B-Tree de alta velocidad para búsquedas en < 10ms
CREATE INDEX IF NOT EXISTS idx_credits_cuil ON public.credits (cuil);
CREATE INDEX IF NOT EXISTS idx_credits_dni ON public.credits (document_number);
CREATE INDEX IF NOT EXISTS idx_credits_phone ON public.credits (phone_number);
CREATE INDEX IF NOT EXISTS idx_credits_last_name ON public.credits (last_name);
CREATE INDEX IF NOT EXISTS idx_credits_nro_credito ON public.credits (nro_credito);

-- 2. TABLA DE METADATOS DE BASE DIARIA
CREATE TABLE IF NOT EXISTS public.base_metadata (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    total_records INT NOT NULL,
    total_unique_cuils INT NOT NULL,
    imported_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- 3. TABLA DE USUARIOS Y ROLES (Control de Acceso / Whitelist)
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    password_hash TEXT, -- Para autenticación con contraseña si aplica
    role TEXT DEFAULT 'operador' CHECK (role IN ('admin', 'operador')) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    invited_by TEXT DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    last_login_at TIMESTAMPTZ
);

-- 4. TABLA DE BACKLOG Y AUDITORÍA DE CONSULTAS (Historial por usuario)
CREATE TABLE IF NOT EXISTS public.simulation_history (
    id BIGSERIAL PRIMARY KEY,
    cuil TEXT NOT NULL,
    client_name TEXT,
    operator_email TEXT NOT NULL,
    operator_name TEXT,
    dias_promesa INT NOT NULL,
    total_cuotas INT NOT NULL,
    monto_total_original NUMERIC(15, 2) NOT NULL,
    deuda_con_promesa NUMERIC(15, 2) NOT NULL,
    calculo_reintegro NUMERIC(15, 2) NOT NULL,
    monto_final_pago_deuda NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sim_history_cuil ON public.simulation_history (cuil);
CREATE INDEX IF NOT EXISTS idx_sim_history_operator ON public.simulation_history (operator_email);
CREATE INDEX IF NOT EXISTS idx_sim_history_created_at ON public.simulation_history (created_at DESC);

-- 5. FUNCIÓN SQL PARA REEMPLAZO ATÓMICO (Borrado completo antes de insertar nueva base)
CREATE OR REPLACE FUNCTION public.truncate_and_prepare_credits()
RETURNS void AS $$
BEGIN
    TRUNCATE TABLE public.credits RESTART IDENTITY;
    UPDATE public.base_metadata SET is_active = FALSE WHERE is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. USUARIOS INICIALES DE EJEMPLO (Se insertan si la tabla está vacía)
INSERT INTO public.users (email, name, role, is_active, invited_by)
VALUES 
    ('admin@personalpay.com.ar', 'Administrador Principal', 'admin', TRUE, 'system'),
    ('operador@personalpay.com.ar', 'Operador Demo', 'operador', TRUE, 'system')
ON CONFLICT (email) DO NOTHING;
