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
export function getWeekDaysFromDate(isoDateString) {
  const current = parseLocalDate(isoDateString);
  const dayOfWeek = current.getDay(); // 0 es Domingo, 1 es Lunes...

  // Calcular cuántos días restar para llegar al Lunes de esa misma semana
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(current);
  monday.setDate(current.getDate() + diffToMonday);

  // Generar de Lunes (0) a Viernes (4)
  return Array.from({ length: 5 }, (_, index) => {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + index);
    const fullDate = toISODate(dayDate);

    return {
      label: SHORT_DAYS[index],
      number: String(dayDate.getDate()),
      fullDate,
      displayDate: formatDisplayDate(fullDate),
    };
  });
}