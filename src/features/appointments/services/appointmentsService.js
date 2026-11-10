// import axiosClient from '../../../api/axiosClient';
import { getTodayISO } from '../../../utils/dateUtils';
import { getClientInitials } from '../../clients/services/clientsService';

const todayISO = getTodayISO();

// Obtiene una fecha dentro del mismo mes actual para poblar la vista mensual como en el mockup
const getMonthDayISO = (dayNumber) => {
  const [year, month] = todayISO.split('-');
  return `${year}-${month}-${String(dayNumber).padStart(2, '0')}`;
};

let appointmentsStore = [
  {
    id: 101,
    date: todayISO,
    startTime: '09:00',
    endTime: '10:00',
    durationMinutes: 60,
    serviceId: 1,
    service: 'Corte + peinado',
    specification: 'Lavado hidratante, corte en capas largas y secado con ondas suaves.',
    category: 'Cabello',
    price: 450,
    clientId: 1,
    client: 'Sofía Mendoza',
    clientPhone: '55 1234 6678',
    employeeId: 2,
    employee: 'Mariana',
    employeeFullName: 'Mariana Silva',
    status: 'Confirmada',
    theme: 'wine', // 'wine' | 'pink' | 'amber' | 'mint'
  },
  {
    id: 102,
    date: todayISO,
    startTime: '10:30',
    endTime: '11:15',
    durationMinutes: 45,
    serviceId: 3,
    service: 'Manicura gel',
    specification: 'Limpieza profunda de cutícula y esmaltado gel tono nude rosado.',
    category: 'Uñas',
    price: 380,
    clientId: 2,
    client: 'Camila Ruiz',
    clientPhone: '55 3467 9012',
    employeeId: 3,
    employee: 'Paola',
    employeeFullName: 'Paola García',
    status: 'Confirmada',
    theme: 'pink',
  },
  {
    id: 103,
    date: todayISO,
    startTime: '12:00',
    endTime: '13:30',
    durationMinutes: 90,
    serviceId: 2,
    service: 'Tinte completo',
    specification: 'Aplicación de tinte global #7.1 rubio cenizo medio y ampolleta protectora.',
    category: 'Coloración',
    price: 1250,
    clientId: 3,
    client: 'Valeria Torres',
    clientPhone: '55 8765 3321',
    employeeId: 2,
    employee: 'Mariana',
    employeeFullName: 'Mariana Silva',
    status: 'Por confirmar',
    theme: 'amber',
  },
  {
    id: 104,
    date: todayISO,
    startTime: '15:00',
    endTime: '16:00',
    durationMinutes: 60,
    serviceId: 5,
    service: 'Diseño de cejas',
    specification: 'Diseño personalizado con hilo orgánico y laminado de cejas.',
    category: 'Mirada',
    price: 290,
    clientId: 4,
    client: 'Renata Díaz',
    clientPhone: '55 4567 8890',
    employeeId: 2,
    employee: 'Mariana',
    employeeFullName: 'Mariana Silva',
    status: 'Confirmada',
    theme: 'mint',
  },

  {
    id: 105,
    date: getMonthDayISO(8),
    startTime: '11:00',
    endTime: '11:45',
    durationMinutes: 45,
    serviceId: 3,
    service: 'Manicura gel',
    specification: 'Retoque de gel semipermanente.',
    category: 'Uñas',
    price: 380,
    clientId: 5,
    client: 'Lucía Herrera',
    clientPhone: '55 7788 1102',
    employeeId: 3,
    employee: 'Paola',
    employeeFullName: 'Paola García',
    status: 'Confirmada',
    theme: 'pink',
  },
  {
    id: 106,
    date: getMonthDayISO(15),
    startTime: '10:30',
    endTime: '11:30',
    durationMinutes: 60,
    serviceId: 1,
    service: 'Corte + peinado',
    specification: 'Despunte y planchado.',
    category: 'Cabello',
    price: 450,
    clientId: 1,
    client: 'Sofía Mendoza',
    clientPhone: '55 1234 6678',
    employeeId: 2,
    employee: 'Mariana',
    employeeFullName: 'Mariana Silva',
    status: 'Confirmada',
    theme: 'mint',
  },
  {
    id: 107,
    date: getMonthDayISO(23),
    startTime: '13:00',
    endTime: '15:00',
    durationMinutes: 120,
    serviceId: 2,
    service: 'Coloración',
    specification: 'Efecto balayage caramelo.',
    category: 'Coloración',
    price: 1250,
    clientId: 3,
    client: 'Valeria Torres',
    clientPhone: '55 8765 3321',
    employeeId: 4,
    employee: 'Elena',
    employeeFullName: 'Elena Soto',
    status: 'Por confirmar',
    theme: 'amber',
  },
];

// Calcula la hora de término sumando minutos a "HH:mm"
export const calculateEndTime = (startTime = '09:00', durationMinutes = 60) => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + Number(durationMinutes || 60);
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMins = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
};

// Asigna el tema de color (vino, rosa, ámbar, menta) según categoría y estado
export const resolveAppointmentTheme = (category = '', status = 'Confirmada') => {
  if (status === 'Por confirmar') return 'amber';
  const norm = category.toLowerCase();
  if (norm.includes('uña')) return 'pink';
  if (norm.includes('mirada') || norm.includes('ceja') || norm.includes('pestaña')) return 'mint';
  if (norm.includes('color')) return 'amber';
  return 'wine';
};

const enrichAppointment = (apt) => {
  const durationMins = Number(apt.durationMinutes) || 60;
  return {
    ...apt,
    serviceCategory: apt.category || apt.serviceCategory || 'Cabello',
    category: apt.category || apt.serviceCategory || 'Cabello',
    notes: apt.specification || apt.notes || 'Sin especificaciones adicionales.',
    specification: apt.specification || apt.notes || 'Sin especificaciones adicionales.',
    durationMinutes: durationMins,
    durationHours: apt.durationHours || Number((durationMins / 60).toFixed(1)),
    clientInitials: getClientInitials(apt.client),
    endTime: apt.endTime || calculateEndTime(apt.startTime, durationMins),
    theme: apt.theme || resolveAppointmentTheme(apt.category || apt.serviceCategory, apt.status),
  };
};

export const appointmentsService = {
  /**
   * Obtiene citas filtradas por usuario logueado (y opcionalmente por una fecha específica como en HomePage)
   */
  async getAppointments({ date, user } = {}) {
    // FastAPI: return (await axiosClient.get('/appointments', { params: { date, employee_id: user?.id } })).data;
    return new Promise((resolve) => {
      setTimeout(() => {
        let results = appointmentsStore.map(enrichAppointment);

        // Si se pasa una fecha exacta (ej. desde el módulo de Inicio), filtra ese día
        if (date) {
          results = results.filter((apt) => apt.date === date);
        }

        // Si no es admin, filtra las citas del trabajador logueado o de su categoría
        if (user && user.role !== 'admin') {
          results = results.filter(
            (apt) =>
              apt.employeeId === user.id ||
              apt.category.toLowerCase() === (user.specialtyCategory || '').toLowerCase()
          );
        }

        results.sort((a, b) =>
          `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`)
        );
        resolve(results);
      }, 100);
    });
  },

  async createAppointment(payload) {
    // FastAPI: return (await axiosClient.post('/appointments', payload)).data;
    return new Promise((resolve) => {
      setTimeout(() => {
        const duration = Number(payload.durationMinutes) || 60;
        const endTime = payload.endTime || calculateEndTime(payload.startTime, duration);
        const shortEmpName = (payload.employeeFullName || payload.employee || 'Mariana').split(' ')[0];

        const newApt = enrichAppointment({
          id: Date.now(),
          date: payload.date,
          startTime: payload.startTime,
          endTime,
          durationMinutes: duration,
          serviceId: payload.serviceId || null,
          serviceIds: payload.serviceIds || [],
          service: payload.service,
          specification: payload.specification || 'Servicio estándar agendado.',
          category: payload.category || 'Cabello',
          categories: payload.categories || [payload.category || 'Cabello'],
          price: Number(payload.price) || 450,
          clientId: payload.clientId || null,
          client: payload.client,
          clientPhone: payload.clientPhone,
          employeeId: Number(payload.employeeId) || 2,
          secondaryEmployeeIds: payload.secondaryEmployeeIds || [],
          employee: shortEmpName,
          employeeFullName: payload.employeeFullName || shortEmpName,
          status: payload.status || 'Pendiente',
          theme: resolveAppointmentTheme(payload.category, payload.status),
        });

        appointmentsStore = [...appointmentsStore, newApt];
        resolve(newApt);
      }, 100);
    });
  },

  async updateAppointment(id, payload) {
    // FastAPI: return (await axiosClient.put(`/appointments/${id}`, payload)).data;
    return new Promise((resolve) => {
      setTimeout(() => {
        appointmentsStore = appointmentsStore.map((apt) => {
          if (apt.id !== id) return apt;
          const duration = Number(payload.durationMinutes ?? apt.durationMinutes) || 60;
          const startTime = payload.startTime || apt.startTime;
          const endTime = payload.endTime || calculateEndTime(startTime, duration);
          const shortEmpName = (
            payload.employeeFullName ||
            payload.employee ||
            apt.employee
          ).split(' ')[0];

          return enrichAppointment({
            ...apt,
            ...payload,
            durationMinutes: duration,
            endTime,
            employee: shortEmpName,
            theme: resolveAppointmentTheme(
              payload.category || apt.category,
              payload.status || apt.status
            ),
          });
        });

        resolve(appointmentsStore.find((apt) => apt.id === id));
      }, 100);
    });
  },

  async updateAppointmentStatus(id, nextStatus) {
    return this.updateAppointment(id, { status: nextStatus });
  },

  async deleteAppointment(id) {
    // FastAPI: await axiosClient.delete(`/appointments/${id}`);
    return new Promise((resolve) => {
      setTimeout(() => {
        appointmentsStore = appointmentsStore.filter((apt) => apt.id !== id);
        resolve(true);
      }, 100);
    });
  },
};