const SHORT_DAYS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

// Obtiene la fecha local actual en formato YYYY-MM-DD
export function getTodayISO() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Convierte un string YYYY-MM-DD a un objeto Date local sin desfase de zona horaria
export function parseLocalDate(isoDateString) {
  const [year, month, day] = isoDateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Formatea un objeto Date a YYYY-MM-DD
export function toISODate(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const toISODateString = toISODate;

export function addDays(isoDateString, days) {
  const date = parseLocalDate(isoDateString);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function formatLongDate(isoDateString) {
  return new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parseLocalDate(isoDateString));
}

// Formatea para el botón superior, ej: "Lunes, 2 noviembre"
export function formatDisplayDate(isoDateString) {
  const date = parseLocalDate(isoDateString);
  const weekday = new Intl.DateTimeFormat('es-MX', { weekday: 'long' }).format(date);
  const day = date.getDate();
  const month = new Intl.DateTimeFormat('es-MX', { month: 'long' }).format(date);

  const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${capitalizedWeekday}, ${day} ${month}`;
}

// Genera dinámicamente los 5 días hábiles (LUN a VIE) de la semana a la que pertenece la fecha dada
export const getWeekDaysFromDate = (isoDateString) => {
  const [year, month, day] = isoDateString.split('-').map(Number);
  const baseDate = new Date(year, month - 1, day);

  // Calcula el lunes de la semana correspondiente a la fecha recibida
  const dayOfWeek = baseDate.getDay(); // 0 = Dom, 1 = Lun, ..., 6 = Sáb
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() + diffToMonday);

  const labels = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

  return Array.from({ length: 7 }, (_, i) => {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);

    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');

    return {
      label: labels[i],
      number: current.getDate(),
      fullDate: `${y}-${m}-${d}`,
    };
  });
};