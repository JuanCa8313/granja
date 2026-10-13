const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const url = 'https://kwvknzlhgwmvgdzqhoxn.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3dmtuemxoZ3dtdmdkenFob3huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwODM3ODMsImV4cCI6MjEwNDY1OTc4M30.pKdbofKamM-TxKpTzM7XmaQwkKw-RMxafJn-7DdFQ10';
const supabase = createClient(url, key);

const jsonPath = path.resolve(__dirname, '../src/lib/whatsappHistoricalData.json');

async function upload() {
  if (!fs.existsSync(jsonPath)) {
    console.error('No se encontró whatsappHistoricalData.json. Ejecuta primero importWhatsAppFinance.js');
    return;
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Iniciando subida a Supabase: ${data.gastos.length} gastos y ${data.abonos.length} abonos...`);

  // Subir Gastos en lotes de 100
  const BATCH_SIZE = 100;
  let gastosSubidos = 0;

  for (let i = 0; i < data.gastos.length; i += BATCH_SIZE) {
    const batch = data.gastos.slice(i, i + BATCH_SIZE).map((g) => ({
      id: g.id,
      fecha: g.fecha,
      categoria: g.categoria,
      descripcion: g.descripcion,
      monto: g.monto,
      metodo_pago: g.metodoPago,
      pagado_por: g.pagadoPor,
      registrado_por: g.registradoPor,
      notas: g.notas,
      created_at: g.createdAt,
    }));

    const { error } = await supabase.from('granja_gastos_hogar').upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error(`Error en lote de gastos (${i} - ${i + batch.length}):`, error.message);
      console.log('Nota: Si las tablas aún no existen en Supabase, ejecuta primero el script SQL: supabase/import_whatsapp_finance.sql en el SQL Editor de Supabase.');
      break;
    }
    gastosSubidos += batch.length;
    console.log(`Gastos: ${gastosSubidos} / ${data.gastos.length} subidos.`);
  }

  // Subir Abonos en lotes de 100
  let abonosSubidos = 0;
  for (let i = 0; i < data.abonos.length; i += BATCH_SIZE) {
    const batch = data.abonos.slice(i, i + BATCH_SIZE).map((a) => ({
      id: a.id,
      fecha: a.fecha,
      monto: a.monto,
      pagado_por: a.pagadoPor,
      recibido_por: a.recibidoPor,
      metodo_pago: a.metodoPago,
      descripcion: a.descripcion,
      notas: a.notas,
      created_at: a.createdAt,
    }));

    const { error } = await supabase.from('granja_abonos_socios').upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error(`Error en lote de abonos (${i} - ${i + batch.length}):`, error.message);
      break;
    }
    abonosSubidos += batch.length;
    console.log(`Abonos: ${abonosSubidos} / ${data.abonos.length} subidos.`);
  }

  console.log(`\nProceso completado. Total subido: ${gastosSubidos} gastos y ${abonosSubidos} abonos.`);
}

upload();
