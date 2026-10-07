import { describe, expect, it } from 'vitest';
import { readLocalData } from './localData';

const fake = (entries: Record<string, string>) => {
  const keys = Object.keys(entries);
  return { length: keys.length, key: (i: number) => keys[i] ?? null, getItem: (k: string) => entries[k] ?? null };
};

const bet = (id: string) => ({ id, bankrollId: 'default', date: '2025-01-01', odds: 2, stake: 10, status: 'WON', profit: 10 });
const bankroll = { id: 'default', name: 'Principal', initialCapital: 500 };

describe('readLocalData', () => {
  it('lee los datos con los nombres actuales', () => {
    const d = readLocalData(fake({
      bet_track_bets: JSON.stringify([bet('a'), bet('b')]),
      bt_bankrolls: JSON.stringify([bankroll]),
      bt_bookmakers: JSON.stringify([{ id: 'bet365', name: 'Bet365', icon: '', enabled: true }]),
    }));
    expect(d.bets).toHaveLength(2);
    expect(d.bankrolls).toHaveLength(1);
    expect(d.bookmakers).toHaveLength(1);
  });

  it('reconoce apuestas guardadas con un nombre antiguo', () => {
    const d = readLocalData(fake({ misApuestas2024: JSON.stringify([bet('a'), bet('b'), bet('c')]) }));
    expect(d.bets).toHaveLength(3);
  });

  it('recupera una copia guardada como objeto y se queda con la lista más larga', () => {
    const d = readLocalData(fake({
      bet_track_bets: JSON.stringify([]),
      bt_local_backup: JSON.stringify({ bets: [bet('a'), bet('b')], bankrolls: [bankroll], bookmakers: [] }),
      otra: JSON.stringify([bet('x')]),
    }));
    expect(d.bets).toHaveLength(2);
    expect(d.bankrolls).toHaveLength(1);
  });

  it('ignora lo que no se puede leer o no es de la app', () => {
    const d = readLocalData(fake({ roto: '{no es json', numero: '42', lista: JSON.stringify([1, 2, 3]), 'bt_sync_queue:u1': JSON.stringify([bet('q')]) }));
    expect(d).toEqual({ bets: [], bankrolls: [], bookmakers: [] });
  });
});

describe('rescate de datos', () => {
  it('lo rescatado se convierte en una copia de seguridad que Importar acepta', async () => {
    const { buildBackup, parseBackup } = await import('./backup');
    const local = readLocalData(fake({ viejas: JSON.stringify([{ ...bet('a'), bookmaker: 'Bet365', sport: 'Fútbol', description: 'x' }]) }));
    const backup = buildBackup({ bets: local.bets, bankrolls: [{ id: 'default', name: 'Bankroll Principal', initialCapital: 1000, color: '#e2001a' }], bookmakers: local.bookmakers });
    const parsed = parseBackup(JSON.stringify(backup));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.data.bets).toHaveLength(1);
  });
});
