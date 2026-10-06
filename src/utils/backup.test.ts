import { describe, it, expect } from 'vitest';
import { Bet, BetStatus, Bankroll, Bookmaker } from '../../types';
import { buildBackup, parseBackup, BACKUP_VERSION } from './backup';

const bankrolls: Bankroll[] = [
  { id: 'b1', name: 'Principal', initialCapital: 1000, color: '#e2001a' },
  { id: 'b2', name: 'Viejo', initialCapital: 500, color: '#fff', archived: true },
];
const bookmakers: Bookmaker[] = [{ id: 'bet365', name: 'Bet365', icon: 'x', enabled: true }];
const bets: Bet[] = [
  { id: '1', bankrollId: 'b1', date: '2026-10-01', bookmaker: 'Bet365', sport: 'Fútbol', odds: 2, stake: 10, status: BetStatus.WON, profit: 10, description: 'A' },
  { id: '2', bankrollId: 'b1', date: '2026-10-02', bookmaker: 'Bet365', sport: 'Tenis', odds: 1.5, stake: 20, status: BetStatus.LOST, profit: -20, description: 'B' },
  { id: '3', bankrollId: 'b1', date: '2026-10-03', bookmaker: 'Bet365', sport: 'Tenis', odds: 1.5, stake: 5, status: BetStatus.PENDING, profit: 0, description: 'C' },
];

describe('buildBackup', () => {
  const backup = buildBackup({ bets, bankrolls, bookmakers }, new Date('2026-10-06T12:00:00Z'));

  it('incluye todos los datos y la versión', () => {
    expect(backup.version).toBe(BACKUP_VERSION);
    expect(backup.exportDate).toBe('2026-10-06T12:00:00.000Z');
    expect(backup.bets).toHaveLength(3);
    expect(backup.bankrolls).toHaveLength(2);
    expect(backup.bookmakers).toHaveLength(1);
  });

  it('incluye un resumen de estadísticas global y por bankroll', () => {
    expect(backup.resumen.global).toMatchObject({ apuestas: 3, pendientes: 1, beneficio: -10, totalApostado: 30, acierto: 50 });
    expect(backup.resumen.global.yield).toBeCloseTo(-33.33, 2);
    expect(backup.resumen.global.roi).toBe(-1);
    expect(backup.resumen.porBankroll[1]).toMatchObject({ bankroll: 'Viejo', archivado: true, apuestas: 0 });
  });
});

describe('parseBackup', () => {
  it('recupera exactamente lo que se exportó (ida y vuelta)', () => {
    const text = JSON.stringify(buildBackup({ bets, bankrolls, bookmakers }));
    const result = parseBackup(text);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.bets).toEqual(bets);
    expect(result.data.bankrolls).toEqual(bankrolls.map(b => ({ ...b, archived: !!b.archived })));
    expect(result.data.bookmakers).toEqual(bookmakers);
  });

  it('acepta copias antiguas sin casas de apuestas ni versión', () => {
    const result = parseBackup(JSON.stringify({ bankrolls, bets, exportDate: '2026-01-01' }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.bookmakers).toBeUndefined();
  });

  it('rechaza archivos que no son JSON', () => {
    expect(parseBackup('hola').ok).toBe(false);
  });

  it('rechaza JSON sin el formato de BetTrack', () => {
    expect(parseBackup(JSON.stringify({ foo: 1 })).ok).toBe(false);
  });

  it('rechaza copias sin bankrolls', () => {
    expect(parseBackup(JSON.stringify({ bankrolls: [], bets: [] })).ok).toBe(false);
  });

  it('indica qué apuesta está dañada', () => {
    const broken = [...bets, { id: '4', bankrollId: 'b1', date: '2026-10-04', odds: 'dos', stake: 5, status: 'WON', profit: 5 }];
    const result = parseBackup(JSON.stringify({ bankrolls, bets: broken }));
    expect(result).toEqual({ ok: false, error: 'La apuesta nº 4 de la copia está incompleta o dañada.' });
  });

  it('rechaza estados desconocidos', () => {
    const broken = [{ ...bets[0], status: 'GANADA' }];
    expect(parseBackup(JSON.stringify({ bankrolls, bets: broken })).ok).toBe(false);
  });

  it('rechaza copias de una versión futura', () => {
    expect(parseBackup(JSON.stringify({ version: BACKUP_VERSION + 1, bankrolls, bets })).ok).toBe(false);
  });
});
