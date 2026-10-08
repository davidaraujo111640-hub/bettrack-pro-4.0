const pad = (n: number) => String(n).padStart(2, '0');

/** Fecha de hoy en la zona horaria del usuario, como "AAAA-MM-DD" (toISOString usa UTC y de madrugada daría el día anterior). */
export function todayLocal(now = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Convierte "AAAA-MM-DD" en una fecha a medianoche LOCAL (new Date('2026-10-01') sería medianoche UTC). */
export function parseLocalDate(value: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value);
}

/** Semana ISO 8601 (empieza en lunes; la semana 1 es la que contiene el primer jueves del año). */
export function isoWeek(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  return { week: Math.ceil(((d.getTime() - yearStart) / 86400000 + 1) / 7), year: d.getUTCFullYear() };
}
