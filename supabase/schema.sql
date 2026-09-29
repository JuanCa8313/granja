-- ==============================================================================
-- 🚜 GRANJA OS HUB - ESQUEMA DE BALANCE GENERAL Y FINANZAS DEL HOGAR (SUPABASE)
-- ==============================================================================

-- 1. TABLA: GASTOS DEL HOGAR FAMILIAR
CREATE TABLE IF NOT EXISTS granja_gastos_hogar (
    id TEXT PRIMARY KEY,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    categoria TEXT NOT NULL, -- 'mercado', 'servicios', 'educacion', 'salud', 'mantenimiento', 'transporte', 'imprevisto'
    descripcion TEXT NOT NULL,
    monto NUMERIC(12, 2) NOT NULL DEFAULT 0,
    metodo_pago TEXT NOT NULL DEFAULT 'efectivo', -- 'efectivo', 'banco'
    pagado_por TEXT NOT NULL DEFAULT 'Juanca',    -- 'Juanca', 'Alex' (Alias del socio)
    registrado_por TEXT,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_granja_gastos_fecha ON granja_gastos_hogar(fecha);
CREATE INDEX IF NOT EXISTS idx_granja_gastos_pagado ON granja_gastos_hogar(pagado_por);
CREATE INDEX IF NOT EXISTS idx_granja_gastos_categoria ON granja_gastos_hogar(categoria);

-- 2. TABLA: RETIROS DE UTILIDAD DE LAS UNIDADES PRODUCTIVAS AL HOGAR
CREATE TABLE IF NOT EXISTS granja_retiros_utilidad (
    id TEXT PRIMARY KEY,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    origen_negocio TEXT NOT NULL, -- 'gallinas', 'pollos', 'cultivos', 'pescados', 'general'
    monto NUMERIC(12, 2) NOT NULL DEFAULT 0,
    descripcion TEXT NOT NULL,
    metodo_pago TEXT NOT NULL DEFAULT 'efectivo', -- 'efectivo', 'banco'
    destinatario TEXT NOT NULL DEFAULT 'Juanca', -- 'Juanca', 'Alex', 'Hogar'
    registrado_por TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_granja_retiros_fecha ON granja_retiros_utilidad(fecha);
CREATE INDEX IF NOT EXISTS idx_granja_retiros_origen ON granja_retiros_utilidad(origen_negocio);

-- 3. TABLA: MÉTRICAS Y SALDOS DE CAJA DE LAS LÍNEAS DE NEGOCIO
CREATE TABLE IF NOT EXISTS granja_metricas_negocios (
    id TEXT PRIMARY KEY, -- 'gallinas', 'pollos', 'cultivos', 'pescados', 'mosca', 'fertilizantes'
    nombre TEXT NOT NULL,
    icono TEXT NOT NULL,
    tagline TEXT,
    color_gradiente TEXT,
    kpi1_label TEXT,
    kpi1_value TEXT,
    kpi2_label TEXT,
    kpi2_value TEXT,
    kpi3_label TEXT,
    kpi3_value TEXT,
    estado_badge TEXT,
    estado_tipo TEXT, -- 'urgente', 'activo', 'proximo'
    subdominio_url TEXT,
    puerto_local INTEGER,
    saldo_caja_estimado NUMERIC(12, 2) DEFAULT 0,
    ultima_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

-- 4. VISTA: BALANCE CONSOLIDADO DEL HOGAR Y APORTES POR SOCIO
CREATE OR REPLACE VIEW v_granja_balance_consolidado AS
SELECT
    COALESCE((SELECT SUM(monto) FROM granja_retiros_utilidad), 0) AS total_utilidades_ingresadas,
    COALESCE((SELECT SUM(monto) FROM granja_gastos_hogar), 0) AS total_gastos_hogar,
    COALESCE((SELECT SUM(monto) FROM granja_retiros_utilidad), 0) - COALESCE((SELECT SUM(monto) FROM granja_gastos_hogar), 0) AS flujo_libre_hogar,
    COALESCE((SELECT SUM(monto) FROM granja_gastos_hogar WHERE LOWER(pagado_por) LIKE '%juanca%' OR LOWER(pagado_por) LIKE '%camilo%'), 0) AS gastos_puesto_por_juanca,
    COALESCE((SELECT SUM(monto) FROM granja_gastos_hogar WHERE LOWER(pagado_por) LIKE '%alex%' OR LOWER(pagado_por) LIKE '%zapata%'), 0) AS gastos_puesto_por_alex,
    COALESCE((SELECT SUM(saldo_caja_estimado) FROM granja_metricas_negocios), 0) AS caja_total_negocios;

-- 5. HABILITAR SEGURIDAD RLS (Row Level Security)
ALTER TABLE granja_gastos_hogar ENABLE ROW LEVEL SECURITY;
ALTER TABLE granja_retiros_utilidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE granja_metricas_negocios ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Permitir todo anon granja_gastos_hogar" ON granja_gastos_hogar;
    CREATE POLICY "Permitir todo anon granja_gastos_hogar" ON granja_gastos_hogar FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Permitir todo anon granja_retiros_utilidad" ON granja_retiros_utilidad;
    CREATE POLICY "Permitir todo anon granja_retiros_utilidad" ON granja_retiros_utilidad FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Permitir todo anon granja_metricas_negocios" ON granja_metricas_negocios;
    CREATE POLICY "Permitir todo anon granja_metricas_negocios" ON granja_metricas_negocios FOR ALL USING (true) WITH CHECK (true);
END $$;

-- 6. SEMBRADO INICIAL DE LÍNEAS DE NEGOCIO (SI ESTÁ VACÍO)
INSERT INTO granja_metricas_negocios (id, nombre, icono, tagline, color_gradiente, kpi1_label, kpi1_value, kpi2_label, kpi2_value, kpi3_label, kpi3_value, estado_badge, estado_tipo, subdominio_url, puerto_local, saldo_caja_estimado)
VALUES
  ('gallinas', 'Gallinas Ponedoras', '🐔', 'Producción de huevo diario & flujo de caja continuo', 'from-amber-500 to-orange-600', 'Postura Hoy', '92% (520 huevos)', 'Bodega', '34 canastas', 'Ventas Semana', '$1.420.000 COP', 'En Producción', 'activo', 'https://gallinas.somosgranja.com', 3000, 890000),
  ('pollos', 'Pollos de Engorde', '🍗', 'Lote 1 (50 pollos Ross 308) a 2.200 msnm', 'from-orange-500 to-amber-600', 'Edad', '8.5 Semanas', 'Peso Promedio', '2.85 kg', 'Conversión', '1.85 FCR', '¡Cosecha Urgente!', 'urgente', 'https://pollos.somosgranja.com', 3001, 450000),
  ('cultivos', 'Huerto & Cultivos', '🌱', 'Cilantro fresco, plátanos, bananos y fríjoles andinos', 'from-emerald-500 to-teal-600', 'Cilantro Listo', '8.0 kg', 'Musáceas', '40 matas', 'Ciclo Frijol', 'Floración', 'Cosecha Cilantro Hoy', 'urgente', 'https://cultivos.somosgranja.com', 3002, 120000),
  ('pescados', 'Piscicultura Andina', '🐟', 'Trucha Arcoíris en agua fría y Tilapia en invernadero', 'from-cyan-500 to-blue-600', 'Truchas (5 meses)', 'Plato (250g)', 'Tilapias (3 meses)', 'Alevinos (80g)', 'Oxígeno / Temp', '8.2 ppm • 14°C', 'Muestreo Próximo', 'activo', 'https://pescados.somosgranja.com', 3004, 320000),
  ('mosca', 'Mosca Soldado Negra', '🪰', 'Bioconversión de residuos orgánicos a 40% proteína viva', 'from-lime-600 to-emerald-700', 'Producción Diaria', '4.5 kg larva', 'Ahorro Purina', '25% global', 'Pie de Cría', 'Estable', 'Operando al 100%', 'activo', 'https://mosca.somosgranja.com', 3005, 0),
  ('fertilizantes', 'Abonos & Compostaje', '🌿', 'Compostaje térmico de gallinaza y frass BSF', 'from-teal-600 to-green-700', 'Pilas en Maduración', '2 pilas (1.5 ton)', 'Bultos Listos', '18 bultos 50kg', 'Uso Propio', 'Huerto y Frutales', 'Maduración Fase 2', 'activo', 'https://fertilizantes.somosgranja.com', 3006, 90000)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  icono = EXCLUDED.icono,
  tagline = EXCLUDED.tagline,
  subdominio_url = EXCLUDED.subdominio_url;
