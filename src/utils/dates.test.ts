import { describe, expect, it } from 'vitest';
import { isoWeek, parseLocalDate, todayLocal } from './dates';

describe('todayLocal', () => {
  it('usa la fecha local, no la UTC', () => {
    // 00:30 hora local del 9 de octubre: en UTC (toISOString) sería todavía el día 8 en España
    expect(todayLocal(new Date(2026, 9, 9, 0, 30))).toBe('2026-10-09');
    expect(todayLocal(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});

describe('parseLocalDate', () => {
  it('crea la fecha a medianoche local', () => {
    const d = parseLocalDate('2026-10-01');
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 9, 1, 0]);
  });
});

describe('isoWeek', () => {
  it('la semana empieza en lunes: domingo y lunes caen en semanas distintas', () => {
    expect(isoWeek(new Date(2026, 9, 4)).week).toBe(40);  // domingo 4 oct 2026
    expect(isoWeek(new Date(2026, 9, 5)).week).toBe(41);  // lunes 5 oct 2026
    expect(isoWeek(new Date(2026, 9, 11)).week).toBe(41); // domingo 11 oct: misma semana que el lunes 5
  });

  it('gestiona el cambio de año', () => {
    expect(isoWeek(new Date(2026, 11, 31))).toEqual({ week: 53, year: 2026 });
    expect(isoWeek(new Date(2027, 0, 1))).toEqual({ week: 53, year: 2026 });
    expect(isoWeek(new Date(2027, 0, 4))).toEqual({ week: 1, year: 2027 });
  });
});
