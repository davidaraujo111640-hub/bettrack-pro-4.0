import { describe, it, expect } from 'vitest';
import { Bet, BetStatus, Bankroll } from '../../types';
import { betsToCsv } from './exportCsv';

const bankrolls: Bankroll[] = [{ id: 'b1', name: 'Principal', initialCapital: 1000, color: '#e2001a' }];

const bet = (overrides: Partial<Bet>): Bet => ({
  id: 'x',
  bankrollId: 'b1',
  date: '2026-10-01',
  bookmaker: 'Bet365',
  sport: 'Fútbol',
  odds: 1.85,
  stake: 10,
  status: BetStatus.WON,
  profit: 8.5,
  description: 'Real Madrid gana',
  ...overrides,
});

describe('betsToCsv', () => {
  it('genera cabecera y filas con ; y decimales con coma', () => {
    const lines = betsToCsv([bet({})], bankrolls).split('\r\n');
    expect(lines[0]).toBe('Fecha;Bankroll;Casa;Deporte;Descripción;Cuota;Importe;Freebet;Estado;Beneficio');
    expect(lines[1]).toBe('2026-10-01;Principal;Bet365;Fútbol;Real Madrid gana;1,85;10,00;No;Ganada;8,50');
  });

  it('ordena por fecha ascendente', () => {
    const csv = betsToCsv([bet({ date: '2026-10-05', id: 'a' }), bet({ date: '2026-09-01', id: 'b' })], bankrolls);
    const dates = csv.split('\r\n').slice(1).map(l => l.split(';')[0]);
    expect(dates).toEqual(['2026-09-01', '2026-10-05']);
  });

  it('deja vacío el beneficio de las pendientes', () => {
    const line = betsToCsv([bet({ status: BetStatus.PENDING, profit: 0 })], bankrolls).split('\r\n')[1];
    expect(line.endsWith(';Pendiente;')).toBe(true);
  });

  it('escapa ; y comillas en los textos', () => {
    const line = betsToCsv([bet({ description: 'Over 2.5; "doble"' })], bankrolls).split('\r\n')[1];
    expect(line).toContain('"Over 2.5; ""doble"""');
  });

  it('neutraliza textos que Excel ejecutaría como fórmula', () => {
    const line = betsToCsv([bet({ description: '=HYPERLINK("http://x")' })], bankrolls).split('\r\n')[1];
    expect(line).toContain(`"'=HYPERLINK(""http://x"")"`);
  });
});
