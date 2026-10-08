import { Bet, BetStatus, Bankroll } from '../../types';
import { legsToText } from './parlay';

// CSV pensado para Excel en español: separador ";" y decimales con coma.
const SEPARATOR = ';';

const STATUS_LABELS: Record<BetStatus, string> = {
  [BetStatus.PENDING]: 'Pendiente',
  [BetStatus.WON]: 'Ganada',
  [BetStatus.LOST]: 'Perdida',
  [BetStatus.CASH_OUT]: 'Cash out',
  [BetStatus.REFUNDED]: 'Reembolsada',
  [BetStatus.CANCELLED]: 'Anulada',
};

const formatNumber = (n: number): string => n.toFixed(2).replace('.', ',');

/**
 * Escapa un texto para CSV. Además neutraliza textos que Excel interpretaría
 * como fórmula (=, +, -, @), para que una descripción no pueda ejecutar nada.
 */
function textCell(value: string): string {
  let safe = value ?? '';
  if (/^[=+\-@\t\r]/.test(safe)) safe = `'${safe}`;
  if (/[";\n\r]/.test(safe)) safe = `"${safe.replace(/"/g, '""')}"`;
  return safe;
}

export function betsToCsv(bets: Bet[], bankrolls: Bankroll[]): string {
  const bankrollNames = new Map(bankrolls.map(b => [b.id, b.name]));
  const header = ['Fecha', 'Bankroll', 'Casa', 'Deporte', 'Descripción', 'Cuota', 'Importe', 'Freebet', 'Estado', 'Beneficio', 'Selecciones'];

  const rows = [...bets]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(bet => [
      bet.date,
      textCell(bankrollNames.get(bet.bankrollId) ?? bet.bankrollId),
      textCell(bet.bookmaker),
      textCell(bet.sport),
      textCell(bet.description),
      formatNumber(bet.odds),
      formatNumber(bet.stake),
      bet.freebet ? 'Sí' : 'No',
      STATUS_LABELS[bet.status] ?? bet.status,
      bet.status === BetStatus.PENDING ? '' : formatNumber(bet.profit),
      textCell(legsToText(bet.legs)),
    ].join(SEPARATOR));

  return [header.join(SEPARATOR), ...rows].join('\r\n');
}

/** Descarga las apuestas como archivo .csv (abre directamente en Excel). */
export function downloadBetsCsv(bets: Bet[], bankrolls: Bankroll[], fileName: string): void {
  // El BOM (U+FEFF) hace que Excel lea bien las tildes y la ñ
  const blob = new Blob(['\uFEFF' + betsToCsv(bets, bankrolls)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
