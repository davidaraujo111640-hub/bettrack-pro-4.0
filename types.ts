
export enum BetStatus {
  PENDING = 'PENDING',
  WON = 'WON',
  LOST = 'LOST',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  CASH_OUT = 'CASH_OUT'
}

export type Sport = 'Fútbol' | 'Baloncesto' | 'Tenis' | 'eSports' | 'Béisbol' | 'NFL' | 'MMA' | 'Ciclismo' | 'F1' | 'MotoGP' | 'Boxeo' | 'Caballos' | 'Otros';

export interface User {
  id: string;
  email: string;
  name: string;
  plan: 'FREE' | 'PRO';
}

export interface Bankroll {
  id: string;
  name: string;
  initialCapital: number;
  color: string;
  archived?: boolean;
  /** Cuándo se creó (milisegundos): fija el orden de los bankrolls entre dispositivos */
  createdAt?: number;
}

/** Estado de una selección de una combinada. VOID = anulada: no cuenta para la cuota total. */
export type LegStatus = 'PENDING' | 'WON' | 'LOST' | 'VOID';

/** Una selección de una apuesta combinada */
export interface BetLeg {
  description: string;
  /** Cuota de esta selección */
  odds: number;
  status: LegStatus;
}

export interface Bet {
  id: string;
  bankrollId: string;
  date: string;
  bookmaker: string;
  sport: Sport;
  odds: number;
  stake: number;
  status: BetStatus;
  profit: number;
  description: string;
  /** Freebet (apuesta gratis): si se pierde no resta el importe; si se gana, solo cuenta la ganancia neta */
  freebet?: boolean;
  /** Selecciones, si es una combinada (2 o más). `odds` es entonces la cuota total. */
  legs?: BetLeg[];
}

export interface Bookmaker {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
}

export interface BankrollStats {
  totalProfit: number;
  roi: number;
  yield: number;
  winRate: number;
  totalBets: number;
  activeBets: number;
  initialBankroll: number;
  currentBankroll: number;
}
