import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatCOP,
  formatFechaCorta,
  formatFechaCompleta,
  ordenarMovimientosRecientesPrimero,
  getFechaLocalYYYYMMDD,
} from '../utils.ts';

describe('ordenarMovimientosRecientesPrimero', () => {
  it('coloca un gasto recién registrado (gh-<timestamp>) antes que los históricos (gh-wa-*) de la misma fecha', () => {
    const movimientosDexieReverse = [
      {
        id: 'gh-wa-1327',
        fecha: '2026-10-19',
        createdAt: '2026-10-19T12:00:00.000Z',
        monto: 25000,
      },
      {
        id: 'gh-wa-1328',
        fecha: '2026-10-19',
        createdAt: '2026-10-19T12:00:00.000Z',
        monto: 40000,
      },
      {
        id: 'gh-1792418805000',
        fecha: '2026-10-19',
        createdAt: '2026-10-19T14:10:00.000Z',
        monto: 85000,
      },
    ];

    const copiaOriginal = [...movimientosDexieReverse];
    const ordenados = ordenarMovimientosRecientesPrimero(movimientosDexieReverse);

    assert.deepEqual(movimientosDexieReverse, copiaOriginal);
    assert.equal(ordenados[0].id, 'gh-1792418805000');
    // Y entre los dos históricos con igual createdAt, gh-wa-1328 va antes que gh-wa-1327
    assert.equal(ordenados[1].id, 'gh-wa-1328');
    assert.equal(ordenados[2].id, 'gh-wa-1327');
  });

  it('desempata por timestamp numérico del id cuando fecha y createdAt son idénticos o ausentes', () => {
    const movimientosEmpatados = [
      {
        id: 'gh-wa-50',
        fecha: '2026-10-19',
      },
      {
        id: 'gh-1792418805000-ab12',
        fecha: '2026-10-19',
      },
      {
        id: 'otro-id-sin-numero',
        fecha: '2026-10-19',
      },
      {
        id: 'gh-wa-invalid',
        fecha: '2026-10-19',
      },
    ];

    const ordenados = ordenarMovimientosRecientesPrimero(movimientosEmpatados);
    assert.equal(ordenados[0].id, 'gh-1792418805000-ab12');
    assert.equal(ordenados[1].id, 'gh-wa-50');
  });

  it('ordena múltiples gastos registrados el mismo día del más reciente al más antiguo', () => {
    const movimientos = [
      {
        id: 'gh-1792410001000',
        fecha: '2026-10-19',
        createdAt: '2026-10-19T08:00:00.000Z',
        monto: 10000,
      },
      {
        id: 'gh-1792410003000',
        fecha: '2026-10-19',
        createdAt: '2026-10-19T10:30:00.000Z',
        monto: 30000,
      },
      {
        id: 'gh-1792410002000',
        fecha: '2026-10-19',
        createdAt: '2026-10-19T09:15:00.000Z',
        monto: 20000,
      },
    ];

    const ordenados = ordenarMovimientosRecientesPrimero(movimientos);
    assert.deepEqual(
      ordenados.map((m) => m.id),
      ['gh-1792410003000', 'gh-1792410002000', 'gh-1792410001000']
    );
  });

  it('ordena por fecha descendente cuando los movimientos son de distintos días', () => {
    const movimientos = [
      {
        id: 'gh-1',
        fecha: '2026-10-15',
        createdAt: '2026-10-15T18:00:00.000Z',
        monto: 15000,
      },
      {
        id: 'gh-2',
        fecha: '2026-10-19',
        createdAt: '2026-10-19T08:00:00.000Z',
        monto: 50000,
      },
      {
        id: 'gh-3',
        fecha: '2026-10-17',
        createdAt: '2026-10-17T12:00:00.000Z',
        monto: 30000,
      },
    ];

    const ordenados = ordenarMovimientosRecientesPrimero(movimientos);
    assert.deepEqual(
      ordenados.map((m) => m.id),
      ['gh-2', 'gh-3', 'gh-1']
    );
  });
});

describe('getFechaLocalYYYYMMDD y formateadores', () => {
  it('devuelve la fecha local correcta sin saltar al día siguiente en horas de la noche (UTC-5)', () => {
    const fechaNocheLocal = new Date(2026, 9, 19, 21, 30, 0);
    assert.equal(getFechaLocalYYYYMMDD(fechaNocheLocal), '2026-10-19');
  });

  it('formatea valores en COP y fechas cortas/completas de forma segura', () => {
    assert.ok(formatCOP(50000).includes('50.000'));
    assert.equal(formatFechaCorta(''), '');
    assert.ok(formatFechaCorta('2026-10-19').length > 0);
    assert.ok(formatFechaCorta('2026/10/19').length > 0);
    assert.equal(formatFechaCompleta(''), '');
    assert.ok(formatFechaCompleta('2026-10-19').includes('2026'));
    assert.ok(formatFechaCompleta('2026/10/19').includes('2026'));
  });
});
