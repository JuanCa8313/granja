import Dexie, { type EntityTable } from 'dexie';

export type CategoriaGastoHogar =
  | 'mercado'
  | 'servicios'
  | 'educacion'
  | 'salud'
  | 'mantenimiento'
  | 'transporte'
  | 'imprevisto';

export interface GastoHogar {
  id: string;
  fecha: string; // YYYY-MM-DD
  categoria: CategoriaGastoHogar;
  descripcion: string;
  monto: number;
  metodoPago: 'efectivo' | 'banco';
  notas?: string;
  synced: boolean;
  createdAt: string;
}

export interface RetiroUtilidad {
  id: string;
  fecha: string; // YYYY-MM-DD
  origenNegocio: 'gallinas' | 'pollos' | 'cultivos' | 'pescados' | 'general';
  monto: number;
  descripcion: string;
  metodoPago: 'efectivo' | 'banco';
  synced: boolean;
  createdAt: string;
}

export interface MetricasNegocioCache {
  id: string; // 'gallinas' | 'pollos' | 'cultivos' | 'pescados' | 'mosca'
  nombre: string;
  icono: string;
  tagline: string;
  colorGradiente: string;
  kpi1Label: string;
  kpi1Value: string;
  kpi2Label: string;
  kpi2Value: string;
  kpi3Label: string;
  kpi3Value: string;
  estadoBadge: string;
  estadoTipo: 'urgente' | 'activo' | 'proximo';
  subdominioUrl: string;
  puertoLocal: number;
  saldoCajaEstimado: number;
  ultimaActualizacion: string;
}

export class GranjaHubDB extends Dexie {
  gastosHogar!: EntityTable<GastoHogar, 'id'>;
  retirosUtilidad!: EntityTable<RetiroUtilidad, 'id'>;
  metricasCache!: EntityTable<MetricasNegocioCache, 'id'>;

  constructor() {
    super('GranjaHubDB');
    this.version(1).stores({
      gastosHogar: 'id, fecha, categoria, metodoPago, synced',
      retirosUtilidad: 'id, fecha, origenNegocio, synced',
      metricasCache: 'id, estadoTipo, ultimaActualizacion',
    });
  }
}

export const db = new GranjaHubDB();

export async function seedInitialGranjaData(): Promise<void> {
  const metricasCount = await db.metricasCache.count();
  if (metricasCount === 0) {
    const defaultMetrics: MetricasNegocioCache[] = [
      {
        id: 'gallinas',
        nombre: 'Gallinas Ponedoras',
        icono: '🐔',
        tagline: 'Producción de huevo diario & flujo de caja continuo',
        colorGradiente: 'from-amber-500 to-orange-600',
        kpi1Label: 'Postura Hoy',
        kpi1Value: '92% (520 huevos)',
        kpi2Label: 'Bodega',
        kpi2Value: '34 canastas',
        kpi3Label: 'Ventas Semana',
        kpi3Value: '$1.420.000 COP',
        estadoBadge: 'En Producción',
        estadoTipo: 'activo',
        subdominioUrl: 'https://gallinas.somosgranja.com',
        puertoLocal: 3000,
        saldoCajaEstimado: 890000,
        ultimaActualizacion: new Date().toISOString(),
      },
      {
        id: 'pollos',
        nombre: 'Pollos de Engorde',
        icono: '🍗',
        tagline: 'Lote 1 (50 pollos Ross 308) a 2.200 msnm',
        colorGradiente: 'from-orange-500 to-amber-600',
        kpi1Label: 'Edad del Lote',
        kpi1Value: '60 días (2 meses)',
        kpi2Label: 'Aves Vivas',
        kpi2Value: '48 pollos (2 bajas)',
        kpi3Label: 'Acción Requerida',
        kpi3Value: 'Sacrificio / Venta YA',
        estadoBadge: 'Alerta Cosecha',
        estadoTipo: 'urgente',
        subdominioUrl: 'https://pollos.somosgranja.com',
        puertoLocal: 3001,
        saldoCajaEstimado: 320000,
        ultimaActualizacion: new Date().toISOString(),
      },
      {
        id: 'cultivos',
        nombre: 'Cultivos & Huerto',
        icono: '🌱',
        tagline: 'Cilantro fresco, plátano, banano y frijol andino',
        colorGradiente: 'from-emerald-600 to-green-700',
        kpi1Label: 'Cilantro Listo',
        kpi1Value: '8 kg cosecha urgente',
        kpi2Label: 'Siembras Recientes',
        kpi2Value: '20 plátanos + 20 bananos',
        kpi3Label: 'Abono Orgánico',
        kpi3Value: 'Gallinaza + Frass ($0)',
        estadoBadge: 'Cosecha Lista',
        estadoTipo: 'urgente',
        subdominioUrl: 'https://cultivos.somosgranja.com',
        puertoLocal: 3002,
        saldoCajaEstimado: 120000,
        ultimaActualizacion: new Date().toISOString(),
      },
      {
        id: 'pescados',
        nombre: 'Piscicultura',
        icono: '🐟',
        tagline: 'Truchas arcoíris (agua fría) y Tilapias en invernadero',
        colorGradiente: 'from-cyan-600 to-blue-700',
        kpi1Label: 'Truchas',
        kpi1Value: '5 meses (260g - Talla plato)',
        kpi2Label: 'Tilapias',
        kpi2Value: '3 meses (Invernadero)',
        kpi3Label: 'Cosecha Prevista',
        kpi3Value: 'Próximas 2 semanas',
        estadoBadge: 'En Engorde',
        estadoTipo: 'activo',
        subdominioUrl: 'https://pescados.somosgranja.com',
        puertoLocal: 3004,
        saldoCajaEstimado: 0,
        ultimaActualizacion: new Date().toISOString(),
      },
      {
        id: 'mosca',
        nombre: 'Mosca Soldado Negra',
        icono: '🪰',
        tagline: 'Bioconversión de residuos a proteína 40% para aves y peces',
        colorGradiente: 'from-stone-600 to-slate-700',
        kpi1Label: 'Fase Biológica',
        kpi1Value: 'Adultos ovipositando',
        kpi2Label: 'Ahorro Purina',
        kpi2Value: '25% concentrado ($0)',
        kpi3Label: 'Subproducto',
        kpi3Value: 'Frass NPK para huerto',
        estadoBadge: 'Ciclo Abierto',
        estadoTipo: 'activo',
        subdominioUrl: 'https://mosca.somosgranja.com',
        puertoLocal: 3005,
        saldoCajaEstimado: 0,
        ultimaActualizacion: new Date().toISOString(),
      },
    ];

    await db.metricasCache.bulkAdd(defaultMetrics);
  }

  const gastosCount = await db.gastosHogar.count();
  if (gastosCount === 0) {
    const today = new Date().toISOString().split('T')[0];
    const initialGastos: GastoHogar[] = [
      {
        id: 'gh-1',
        fecha: today,
        categoria: 'mercado',
        descripcion: 'Mercado básico en el pueblo para la casa',
        monto: 160000,
        metodoPago: 'efectivo',
        synced: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'gh-2',
        fecha: today,
        categoria: 'servicios',
        descripcion: 'Factura de energía de la casa',
        monto: 75000,
        metodoPago: 'banco',
        synced: true,
        createdAt: new Date().toISOString(),
      },
    ];

    const initialRetiros: RetiroUtilidad[] = [
      {
        id: 'ret-1',
        fecha: today,
        origenNegocio: 'gallinas',
        monto: 300000,
        descripcion: 'Retiro de utilidades semanales de venta de huevos',
        metodoPago: 'efectivo',
        synced: true,
        createdAt: new Date().toISOString(),
      },
    ];

    await db.gastosHogar.bulkAdd(initialGastos);
    await db.retirosUtilidad.bulkAdd(initialRetiros);
  }
}

export const seedInitialFincaData = seedInitialGranjaData;
