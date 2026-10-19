const fs = require('fs');
const path = require('path');

const inputFilePath = 'c:/Users/ASUS/Downloads/WhatsApp Chat with Finance/WhatsApp Chat with Finance.txt';
const outputSqlPath = path.resolve(__dirname, '../supabase/import_whatsapp_finance.sql');
const outputJsonPath = path.resolve(__dirname, '../src/lib/whatsappHistoricalData.json');

if (!fs.existsSync(inputFilePath)) {
  console.error(`Error: No se encontró el archivo de WhatsApp en: ${inputFilePath}`);
  process.exit(1);
}

const content = fs.readFileSync(inputFilePath, 'utf8');
const lines = content.split(/\r?\n/);

console.log(`Procesando ${lines.length} líneas del chat de WhatsApp...`);

function clasificarCategoria(texto) {
  const t = texto.toLowerCase();

  // 1. Granja: Vaca
  if (t.includes('vaca') || t.includes('vaquita') || t.includes('terner')) {
    return 'vaca';
  }

  // 2. Granja: Tilapia
  if (t.includes('tilapia')) {
    return 'tilapia';
  }

  // 3. Granja: Trucha y Peces
  if (t.includes('trucha') || t.includes('cuido peces') || t.includes('peces')) {
    return 'trucha';
  }

  // 4. Granja: Gallinas (aserrín, bebederos, gallinas)
  if (
    t.includes('gallina') ||
    t.includes('aserrin') ||
    t.includes('aserrín') ||
    t.includes('bebedero')
  ) {
    return 'gallinas';
  }

  // 5. Granja: Pollos (crianza: cuido pollas, cuido pollos, pollas, pollitos)
  if (
    t.includes('cuido pollo') ||
    t.includes('cuido polla') ||
    t.includes('pollas') ||
    t.includes('pollitos') ||
    (t.includes('pollo') && t.includes('cuido'))
  ) {
    return 'pollos';
  }

  // 6. Granja: Cultivo (semillas, cal, fumigada, round up, etc.)
  if (
    t.includes('semilla') ||
    t.includes('cal agrícola') ||
    t.includes('cal agricola') ||
    (t.includes('cal ') && !t.includes('caldo') && !t.includes('calentador') && !t.includes('cafelate')) ||
    t.includes('matamaleza') ||
    t.includes('round up') ||
    t.includes('fumigada') ||
    t.includes('caliman') ||
    (t.includes('abono') && (t.includes('7.000') || t.includes('tierra') || t.includes('planta')))
  ) {
    return 'cultivo';
  }

  // 7. Créditos y préstamos (cuota, crédito, banco, tarjeta, préstamo, leasing)
  if (
    t.includes('crédito') ||
    t.includes('credito') ||
    t.includes('prestamo') ||
    t.includes('préstamo') ||
    t.includes('cuota') ||
    t.includes('hipoteca') ||
    t.includes('leasing') ||
    t.includes('tarjeta de credito') ||
    t.includes('tarjeta de crédito')
  ) {
    return 'creditos';
  }

  // Servicios
  if (
    t.includes('agua') ||
    t.includes('epm') ||
    t.includes('luz') ||
    t.includes('energia') ||
    t.includes('energía') ||
    t.includes('alcantarillado') ||
    t.includes('internet') ||
    t.includes('claro') ||
    t.includes('administración') ||
    t.includes('administracion') ||
    t.includes('gas') ||
    t.includes('starlink')
  ) {
    return 'servicios';
  }

  // Transporte
  if (
    t.includes('gasolina') ||
    t.includes('peaje') ||
    t.includes('peajes') ||
    t.includes('pasaje') ||
    t.includes('pasajes') ||
    t.includes('carro') ||
    t.includes('moto') ||
    t.includes('uber') ||
    t.includes('taxi')
  ) {
    return 'transporte';
  }

  // Salud
  if (
    t.includes('farmacia') ||
    t.includes('drogueria') ||
    t.includes('droguería') ||
    t.includes('droga') ||
    t.includes('odontología') ||
    t.includes('odontologia') ||
    t.includes('medico') ||
    t.includes('médico') ||
    t.includes('medicina') ||
    t.includes('pastillas') ||
    t.includes('vitamina') ||
    t.includes('magnesio') ||
    t.includes('altamisa') ||
    t.includes('propóleo') ||
    t.includes('propoleo') ||
    t.includes('desodorante') ||
    t.includes('talco') ||
    t.includes('algodón') ||
    t.includes('algodon') ||
    t.includes('masaje')
  ) {
    return 'salud';
  }

  // Mantenimiento hogar / varios
  if (
    t.includes('adobe') ||
    t.includes('tubo') ||
    t.includes('abrazadera') ||
    t.includes('ferreteria') ||
    t.includes('ferretería') ||
    t.includes('arreglo') ||
    t.includes('parrillas') ||
    t.includes('rayador') ||
    t.includes('espejo') ||
    t.includes('tablitas') ||
    t.includes('pila') ||
    t.includes('almuada') ||
    t.includes('almohada') ||
    t.includes('cuido gata') ||
    t.includes('grapas') ||
    t.includes('beyot') ||
    t.includes('gurbia')
  ) {
    return 'mantenimiento';
  }

  // Mercado / Comida
  if (
    t.includes('d1') ||
    t.includes('verdura') ||
    t.includes('carne') ||
    t.includes('pollo') ||
    t.includes('queso') ||
    t.includes('quesito') ||
    t.includes('arepa') ||
    t.includes('arepas') ||
    t.includes('almuerzo') ||
    t.includes('pechuga') ||
    t.includes('costilla') ||
    t.includes('morcilla') ||
    t.includes('chorizo') ||
    t.includes('chorizos') ||
    t.includes('som store') ||
    t.includes('sol store') ||
    t.includes('tintos') ||
    t.includes('café') ||
    t.includes('cafe') ||
    t.includes('cafelate') ||
    t.includes('aromática') ||
    t.includes('aromatica') ||
    t.includes('aromaticas') ||
    t.includes('helado') ||
    t.includes('helados') ||
    t.includes('jaleas') ||
    t.includes('mantequilla') ||
    t.includes('parmesano') ||
    t.includes('brocoli') ||
    t.includes('brócoli') ||
    t.includes('coliflor') ||
    t.includes('tomate') ||
    t.includes('cebolla') ||
    t.includes('aguacate') ||
    t.includes('chia') ||
    t.includes('girasol') ||
    t.includes('gelatina') ||
    t.includes('empanada') ||
    t.includes('pasteles') ||
    t.includes('piza') ||
    t.includes('pizza') ||
    t.includes('torta') ||
    t.includes('aseo') ||
    t.includes('mercado')
  ) {
    return 'mercado';
  }

  return 'imprevisto';
}

function limpiarDescripcion(texto, montoStr) {
  let d = texto;
  // Remover sufijos como <This message was edited>
  d = d.replace(/<This message was edited>/gi, '').trim();

  // Si dice 'Abono $ 500.000', poner 'Abono a cuentas del hogar'
  if (d.toLowerCase().startsWith('abono')) {
    if (d.length <= montoStr.length + 10) {
      return 'Abono a cuentas del hogar';
    }
  }

  // Remover el número y el símbolo de pesos del final o del medio si es posible
  d = d.replace(/\$?\s*[0-9]{1,3}(?:[.,]\s*[0-9]{3})+/g, '');
  d = d.replace(/\$\s*[0-9]+/g, '');
  d = d.replace(/[$]/g, '');
  d = d.trim();
  // Limpiar espacios dobles o signos finales
  d = d.replace(/\s+/g, ' ').replace(/[-:,]+$/, '').trim();

  if (!d || d.length < 2) {
    return 'Gasto común del hogar';
  }

  // Capitalizar primera letra
  return d.charAt(0).toUpperCase() + d.slice(1);
}

const gastos = [];
const abonos = [];
let itemIdx = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  const headerMatch = line.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4}),\s*([^-\n]+)-\s*([^:]+):\s*(.*)$/);
  if (!headerMatch) continue;

  const [_, m, d, yRaw, time, senderRaw, textRaw] = headerMatch;
  const sender = senderRaw.trim();
  let text = textRaw.trim();

  // Omitir mensajes de sistema o multimedia
  if (
    text === '<Media omitted>' ||
    text.includes('This message was deleted') ||
    text.includes('You deleted this message') ||
    text.includes('Messages and calls are end-to-end encrypted') ||
    text.includes('created group') ||
    text.includes('added to the community') ||
    text.includes('changed this group')
  ) {
    continue;
  }

  // Formatear Fecha: YYYY-MM-DD
  const anio = yRaw.length === 2 ? `20${yRaw}` : yRaw;
  const mes = m.padStart(2, '0');
  const dia = d.padStart(2, '0');
  const fechaISO = `${anio}-${mes}-${dia}`;

  // Extraer monto
  const numMatch = text.match(/(?:[$]\s*)?([0-9]{1,3}(?:[.,]\s*[0-9]{3})+|[0-9]{3,8})/);
  if (!numMatch) continue;

  let rawDigits = numMatch[1].replace(/[.,\s]/g, '');
  let monto = parseInt(rawDigits, 10);

  // Manejo de errata con 4 ceros como $ 55.0000 -> 55000
  if (numMatch[1].endsWith('.0000') || (rawDigits.endsWith('0000') && rawDigits.length === 6 && monto >= 500000 && monto < 600000)) {
    if (text.includes('55.0000')) {
      monto = 55000;
    }
  }

  if (monto < 500) continue; // Descartar números muy pequeños aislados

  itemIdx++;
  const isCamilo = sender.includes('Camilo');
  const lowerText = text.toLowerCase();

  // Determinar si es un Abono entre socios
  const esAbonoSocio =
    (isCamilo && lowerText.includes('abono') && !lowerText.includes('gallinas') && !lowerText.includes('carretera')) ||
    (!isCamilo && (lowerText.startsWith('cami abono') || lowerText.startsWith('abono cami') || lowerText.startsWith('camilo abono')));

  if (esAbonoSocio) {
    abonos.push({
      id: `ab-wa-${itemIdx}`,
      fecha: fechaISO,
      monto: monto,
      pagadoPor: 'Camilo',
      recibidoPor: 'Alex',
      metodoPago: 'banco',
      descripcion: `Abono de Camilo a Alex (${fechaISO})`,
      notas: text,
      synced: true,
      createdAt: new Date(`${fechaISO}T12:00:00Z`).toISOString(),
    });
  } else {
    // Es un Gasto del Hogar
    let pagadoPor = isCamilo ? 'Juanca' : 'Alex';
    if (lowerText.includes('pago cami') || lowerText.includes('pago camilo')) {
      pagadoPor = 'Juanca';
    }

    const categoria = clasificarCategoria(text);
    const descripcion = limpiarDescripcion(text, numMatch[0]);

    gastos.push({
      id: `gh-wa-${itemIdx}`,
      fecha: fechaISO,
      categoria: categoria,
      descripcion: descripcion,
      monto: monto,
      metodoPago: 'efectivo',
      pagadoPor: pagadoPor,
      registradoPor: sender,
      notas: text !== descripcion ? text : null,
      synced: true,
      createdAt: new Date(`${fechaISO}T12:00:00Z`).toISOString(),
    });
  }
}

console.log(`\n Extracción completada con éxito:`);
console.log(`- Gastos del Hogar extraídos: ${gastos.length}`);
console.log(`- Abonos entre socios extraídos: ${abonos.length}`);
console.log(`- Total de transacciones: ${gastos.length + abonos.length}`);

// 1. Guardar archivo JSON para el PWA
const jsonData = {
  version: 1,
  generadoEl: new Date().toISOString(),
  gastos,
  abonos,
};
fs.writeFileSync(outputJsonPath, JSON.stringify(jsonData, null, 2), 'utf8');
console.log(`Archivo JSON local generado en: ${outputJsonPath}`);

// 2. Generar archivo SQL completo para Supabase
let sql = `-- ==============================================================================
-- 🚜 GRANJA OS HUB - IMPORTACIÓN HISTÓRICA COMPLETA DE WHATSAPP (2024 - 2026)
-- Generado automáticamente desde: WhatsApp Chat with Finance.txt
-- Total Gastos: ${gastos.length} | Total Abonos: ${abonos.length}
-- ==============================================================================

-- 1. CREACIÓN DE TABLAS SI NO EXISTEN
CREATE TABLE IF NOT EXISTS granja_gastos_hogar (
    id TEXT PRIMARY KEY,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    categoria TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    monto NUMERIC(12, 2) NOT NULL DEFAULT 0,
    metodo_pago TEXT NOT NULL DEFAULT 'efectivo',
    pagado_por TEXT NOT NULL DEFAULT 'Juanca',
    registrado_por TEXT,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS granja_abonos_socios (
    id TEXT PRIMARY KEY,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    monto NUMERIC(12, 2) NOT NULL DEFAULT 0,
    pagado_por TEXT NOT NULL,
    recibido_por TEXT NOT NULL,
    metodo_pago TEXT NOT NULL DEFAULT 'efectivo',
    descripcion TEXT,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS granja_retiros_utilidad (
    id TEXT PRIMARY KEY,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    origen_negocio TEXT NOT NULL,
    monto NUMERIC(12, 2) NOT NULL DEFAULT 0,
    descripcion TEXT NOT NULL,
    metodo_pago TEXT NOT NULL DEFAULT 'efectivo',
    destinatario TEXT NOT NULL DEFAULT 'Juanca',
    registrado_por TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. HABILITAR SEGURIDAD RLS
ALTER TABLE granja_gastos_hogar ENABLE ROW LEVEL SECURITY;
ALTER TABLE granja_abonos_socios ENABLE ROW LEVEL SECURITY;
ALTER TABLE granja_retiros_utilidad ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Permitir todo anon granja_gastos_hogar" ON granja_gastos_hogar;
    CREATE POLICY "Permitir todo anon granja_gastos_hogar" ON granja_gastos_hogar FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Permitir todo anon granja_abonos_socios" ON granja_abonos_socios;
    CREATE POLICY "Permitir todo anon granja_abonos_socios" ON granja_abonos_socios FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Permitir todo anon granja_retiros_utilidad" ON granja_retiros_utilidad;
    CREATE POLICY "Permitir todo anon granja_retiros_utilidad" ON granja_retiros_utilidad FOR ALL USING (true) WITH CHECK (true);
END $$;

-- 3. LIMPIEZA DE DATOS PREVIOS (REEMPLAZO LIMPIO APROBADO)
TRUNCATE TABLE granja_gastos_hogar;
TRUNCATE TABLE granja_abonos_socios;

-- 4. INSERCIÓN DE GASTOS DEL HOGAR (${gastos.length} REGISTROS)
INSERT INTO granja_gastos_hogar (id, fecha, categoria, descripcion, monto, metodo_pago, pagado_por, registrado_por, notas, created_at)
VALUES
`;

const escapeSql = (str) => {
  if (!str) return 'NULL';
  return `'${str.replace(/'/g, "''")}'`;
};

const gastoRows = gastos.map((g) => {
  return `  (${escapeSql(g.id)}, '${g.fecha}', '${g.categoria}', ${escapeSql(g.descripcion)}, ${g.monto}, '${g.metodoPago}', '${g.pagadoPor}', ${escapeSql(g.registradoPor)}, ${escapeSql(g.notas)}, '${g.createdAt}')`;
});

sql += gastoRows.join(',\n') + ';\n\n';

sql += `-- 5. INSERCIÓN DE ABONOS ENTRE SOCIOS (${abonos.length} REGISTROS)\n`;
sql += `INSERT INTO granja_abonos_socios (id, fecha, monto, pagado_por, recibido_por, metodo_pago, descripcion, notas, created_at)\nVALUES\n`;

const abonoRows = abonos.map((a) => {
  return `  (${escapeSql(a.id)}, '${a.fecha}', ${a.monto}, '${a.pagadoPor}', '${a.recibidoPor}', '${a.metodoPago}', ${escapeSql(a.descripcion)}, ${escapeSql(a.notas)}, '${a.createdAt}')`;
});

sql += abonoRows.join(',\n') + ';\n';

fs.writeFileSync(outputSqlPath, sql, 'utf8');
console.log(`Archivo SQL maestro generado en: ${outputSqlPath}`);
console.log(`\n¡Listo! El SQL y los datos JSON han sido generados exitosamente.`);
