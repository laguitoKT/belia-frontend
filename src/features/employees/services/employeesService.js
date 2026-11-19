import axiosClient from '../../../api/axiosClient';
import { toAppointmentStatus } from '../../appointments/services/appointmentStatus';

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const ACTIVE_STATE_ID = 1;
const INACTIVE_STATE_ID = 2;
const BREAKDOWN_MARKER = '[[BELIA_SERVICE_BREAKDOWN]]';

export const getEmployeeInitials = (name = '') => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return 'EM';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

export const formatEmployeeServiceDate = (record) => {
  if (!record) return 'Sin servicios recientes';
  if (record.isToday) return `Hoy, ${record.startTime}`;
  const [year, month, day] = record.date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const monthShort = new Intl.DateTimeFormat('es-MX', { month: 'short' })
    .format(dateObj)
    .replace('.', '');
  return `${String(day).padStart(2, '0')} ${monthShort} ${year}, ${record.startTime}`;
};

const specialtyCategory = (specialty = '') => {
  const value = specialty.toLowerCase();
  if (/uña|manic|pedic/.test(value)) return 'Uñas';
  if (/color/.test(value)) return 'Coloración';
  if (/mirada|ceja|pesta/.test(value)) return 'Mirada';
  if (/cabell|estilist|corte/.test(value)) return 'Cabello';
  if (/maquill/.test(value)) return 'Maquillaje';
  if (/facial/.test(value)) return 'Facial';
  return 'Todas';
};

const timeOnly = (time) => (time || '').slice(0, 5);

const parsePersistedBreakdown = (notes = '') => {
  const markerIndex = String(notes).indexOf(BREAKDOWN_MARKER);
  if (markerIndex < 0) return [];

  try {
    const details = JSON.parse(
      String(notes).slice(markerIndex + BREAKDOWN_MARKER.length).trim()
    );
    return Array.isArray(details) ? details : [];
  } catch (error) {
    console.error('El desglose de servicios del empleado tiene un formato inválido.', error);
    return [];
  }
};

const getAppointmentNotes = (notes = '') => {
  const markerIndex = String(notes).indexOf(BREAKDOWN_MARKER);
  return markerIndex < 0 ? notes : String(notes).slice(0, markerIndex).trim();
};

const enrichEmployee = (employee, schedules, appointments) => {
  const employeeSchedules = schedules
    .filter((schedule) => schedule.empleado_id === employee.id_empleado)
    .sort((a, b) => a.dia - b.dia);
  const workDaysList = employeeSchedules.map((schedule) => DAYS[schedule.dia]);
  const startTimes = employeeSchedules.map((schedule) => timeOnly(schedule.hora_entrada));
  const endTimes = employeeSchedules.map((schedule) => timeOnly(schedule.hora_salida));
  const startTime = startTimes.sort()[0] || '';
  const endTime = endTimes.sort().at(-1) || '';
  const workDays = workDaysList.join(', ') || 'Sin horario';
  const serviceHistory = appointments
    .flatMap((appointment) => {
      const notes = appointment.especificaciones ?? '';
      const detailsCandidates = [
        appointment.service_breakdown,
        parsePersistedBreakdown(notes),
      ].filter((details) => Array.isArray(details) && details.length > 0);
      const details = detailsCandidates[0] || [
        {
          serviceId: appointment.servicio_id,
          serviceName: appointment.servicio,
          category: appointment.categoria,
          price: appointment.precio,
          startTime: appointment.hora_inicio,
          endTime: appointment.hora_fin,
          employeeId: appointment.empleado_id,
          employeeName: appointment.estilista,
        },
      ];
      const employeeDetails = details.filter(
        (detail) => String(detail.employeeId) === String(employee.id_empleado)
      );
      if (employeeDetails.length === 0) return [];

      const categories = [
        ...new Set(employeeDetails.map((detail) => detail.category).filter(Boolean)),
      ];
      return [{
          id: appointment.id_cita,
          service: employeeDetails.map((detail) => detail.serviceName).filter(Boolean).join(' + '),
          category: categories.length > 1 ? 'Paquete mixto' : categories[0] || appointment.categoria,
          client: appointment.cliente,
          clientPhone: appointment.telefono_cliente || '',
          price: Number(appointment.precio),
          date: appointment.fecha,
          startTime: employeeDetails[0].startTime || appointment.hora_inicio,
          endTime: employeeDetails.at(-1).endTime || appointment.hora_fin,
          status: toAppointmentStatus(appointment.estado),
          notes: getAppointmentNotes(notes),
          serviceBreakdown: employeeDetails,
        }];
    })
    .sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`));

  return {
    id: employee.id_empleado,
    name: employee.nombre_completo,
    phone: employee.telefono || '',
    email: employee.correo,
    specialty: employee.especialidad || '',
    specialtyCategory: specialtyCategory(employee.especialidad || ''),
    workDays,
    workDaysList,
    schedules: employeeSchedules.map((schedule) => ({
      day: schedule.dia,
      startTime: timeOnly(schedule.hora_entrada),
      endTime: timeOnly(schedule.hora_salida),
    })),
    startTime,
    endTime,
    active: employee.estado_id === ACTIVE_STATE_ID,
    initials: getEmployeeInitials(employee.nombre_completo),
    scheduleFormatted: `${workDays} · ${startTime} – ${endTime}`,
    serviceHistory,
  };
};

const toDatabasePayload = (payload) => {
  const data = {};
  if (payload.name !== undefined) data.nombre_completo = payload.name;
  if (payload.phone !== undefined) data.telefono = payload.phone || null;
  if (payload.email !== undefined) data.correo = payload.email;
  if (payload.specialty !== undefined) data.especialidad = payload.specialty;
  if (payload.password) data.password = payload.password;
  if (payload.active !== undefined) {
    data.estado_id = payload.active ? ACTIVE_STATE_ID : INACTIVE_STATE_ID;
  }
  if (payload.workDaysList !== undefined) {
    const start = payload.startTime;
    const end = payload.endTime;
    if (payload.workDaysList.length && (!start || !end)) {
      throw new Error('El horario requiere hora de entrada y salida.');
    }
    data.horarios = payload.workDaysList.map((day) => ({
      dia: DAYS.indexOf(day),
      hora_entrada: start,
      hora_salida: end,
    }));
    if (data.horarios.some((schedule) => schedule.dia < 0)) {
      throw new Error('El formulario incluye un día de trabajo desconocido.');
    }
  }
  return data;
};

const loadEmployees = async () => {
  const [employeeResponse, scheduleResponse, appointmentResponse] = await Promise.all([
    axiosClient.get('/empleados/', { params: { limit: 500 } }),
    axiosClient.get('/horarios/', { params: { limit: 500 } }),
    axiosClient.get('/api/v1/agenda/citas'),
  ]);
  return employeeResponse.data.map((employee) =>
    enrichEmployee(employee, scheduleResponse.data, appointmentResponse.data)
  );
};

export const employeesService = {
  async getEmployees() {
    return loadEmployees();
  },

  async createEmployee(payload) {
    if (!payload.password) {
      throw new Error('Debes establecer una contraseña para el nuevo empleado.');
    }
    const created = (
      await axiosClient.post('/empleados/', {
        ...toDatabasePayload(payload),
        rol: 'Empleado',
        estado_id: ACTIVE_STATE_ID,
      })
    ).data;
    const employees = await loadEmployees();
    const employee = employees.find((item) => item.id === created.id_empleado);
    if (!employee) throw new Error('El empleado se creó, pero no se pudo cargar.');
    return employee;
  },

  async updateEmployee(id, payload) {
    await axiosClient.patch(`/empleados/${id}`, toDatabasePayload(payload));
    const employees = await loadEmployees();
    const employee = employees.find((item) => item.id === Number(id));
    if (!employee) throw new Error('No se encontró el empleado actualizado.');
    return employee;
  },

  async deleteEmployee(id) {
    await axiosClient.delete(`/empleados/${id}`);
  },
};
