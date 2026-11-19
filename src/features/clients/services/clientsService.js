import axiosClient from '../../../api/axiosClient';
import { getTodayISO } from '../../../utils/dateUtils';
import { toAppointmentStatus } from '../../appointments/services/appointmentStatus';

const BREAKDOWN_MARKER = '[[BELIA_SERVICE_BREAKDOWN]]';

export const getClientInitials = (name = '') => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return 'CL';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

export const formatVisitDateTime = (visit) => {
  if (!visit) return 'Sin visitas registradas';
  if (visit.isToday) return `Hoy, ${visit.startTime}`;
  const [year, month, day] = visit.date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const monthShort = new Intl.DateTimeFormat('es-MX', { month: 'short' })
    .format(dateObj)
    .replace('.', '');
  return `${String(day).padStart(2, '0')} ${monthShort} ${year}, ${visit.startTime}`;
};

const enrichClient = (row, visits) => {
  const sortedVisits = [...visits].sort((a, b) =>
    `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`)
  );
  const latestVisit = sortedVisits[0] || null;

  return {
    id: row.id_cliente,
    name: row.nombre_completo,
    phone: row.telefono,
    email: row.correo || '',
    notes: row.notas || '',
    assignedEmployeeIds: [...new Set(sortedVisits.flatMap((visit) =>
      visit.serviceBreakdown?.length
        ? visit.serviceBreakdown.map((detail) => detail.employeeId)
        : [visit.employeeId]
    ))],
    visits: sortedVisits,
    initials: getClientInitials(row.nombre_completo),
    lastService: latestVisit?.service || 'Nuevo cliente',
    lastCategory: latestVisit?.category || 'General',
    lastVisitFormatted: formatVisitDateTime(latestVisit),
  };
};

const parsePersistedBreakdown = (notes = '') => {
  const markerIndex = String(notes).indexOf(BREAKDOWN_MARKER);
  if (markerIndex < 0) return [];

  try {
    const details = JSON.parse(
      String(notes).slice(markerIndex + BREAKDOWN_MARKER.length).trim()
    );
    return Array.isArray(details) ? details : [];
  } catch (error) {
    console.error('El desglose de servicios del historial tiene un formato inválido.', error);
    return [];
  }
};

const getAppointmentNotes = (notes = '') => {
  const markerIndex = String(notes).indexOf(BREAKDOWN_MARKER);
  return markerIndex < 0 ? notes : String(notes).slice(0, markerIndex).trim();
};

const appointmentVisits = (appointment) => {
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
  const serviceNames = details.map((detail) => detail.serviceName).filter(Boolean);
  const categories = [...new Set(details.map((detail) => detail.category).filter(Boolean))];
  const employeeNames = [
    ...new Set(details.map((detail) => detail.employeeName).filter(Boolean)),
  ];

  return [{
    id: appointment.id_cita,
    appointmentId: appointment.id_cita,
    service: serviceNames.join(' + ') || appointment.servicio,
    category: categories.length > 1 ? 'Paquete mixto' : categories[0] || appointment.categoria,
    price: Number(appointment.precio),
    date: appointment.fecha,
    isToday: appointment.fecha === getTodayISO(),
    startTime: details[0].startTime || appointment.hora_inicio,
    endTime: details[details.length - 1].endTime || appointment.hora_fin,
    employeeId: details[0].employeeId || appointment.empleado_id,
    employee: employeeNames.join(' | ') || appointment.estilista,
    status: toAppointmentStatus(appointment.estado),
    notes: getAppointmentNotes(notes),
    serviceBreakdown: details,
  }];
};

export const clientsService = {
  async getClients({ user } = {}) {
    const [clientResponse, appointmentResponse] = await Promise.all([
      axiosClient.get('/clientes/', { params: { limit: 500 } }),
      axiosClient.get('/api/v1/agenda/citas'),
    ]);
    const appointments = appointmentResponse.data;
    let clients = clientResponse.data.map((client) =>
      enrichClient(
        client,
        appointments
          .filter((appointment) => appointment.cliente_id === client.id_cliente)
          .flatMap(appointmentVisits)
      )
    );

    if (user && user.role !== 'admin') {
      clients = clients.filter(
        (client) =>
          client.assignedEmployeeIds.includes(user.id) ||
          client.visits.some(
            (visit) =>
              visit.category.toLowerCase() ===
              (user.specialtyCategory || '').toLowerCase()
          )
      );
    }
    return clients;
  },

  async createClient(payload) {
    const created = (
      await axiosClient.post('/clientes/', {
        nombre_completo: payload.name,
        telefono: payload.phone,
        correo: payload.email || null,
        notas: payload.notes || null,
      })
    ).data;
    return enrichClient(created, []);
  },

  async updateClient(id, payload) {
    const updated = (
      await axiosClient.patch(`/clientes/${id}`, {
        nombre_completo: payload.name,
        telefono: payload.phone,
        correo: payload.email || null,
        notas: payload.notes || null,
      })
    ).data;
    const appointments = (
      await axiosClient.get('/api/v1/agenda/citas', {
        params: { cliente_id: id },
      })
    ).data;
    return enrichClient(
      updated,
      appointments.flatMap(appointmentVisits)
    );
  },

  async deleteClient(id) {
    await axiosClient.delete(`/clientes/${id}`);
  },
};
