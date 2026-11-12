import axiosClient from '../../../api/axiosClient';
import { getTodayISO } from '../../../utils/dateUtils';

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
    assignedEmployeeIds: [...new Set(sortedVisits.map((visit) => visit.employeeId))],
    visits: sortedVisits,
    initials: getClientInitials(row.nombre_completo),
    lastService: latestVisit?.service || 'Nuevo cliente',
    lastCategory: latestVisit?.category || 'General',
    lastVisitFormatted: formatVisitDateTime(latestVisit),
  };
};

const appointmentVisits = (appointment) => {
  const details = appointment.service_breakdown?.length
    ? appointment.service_breakdown
    : [
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

  return details.map((detail, index) => ({
    id: `${appointment.id_cita}-${detail.serviceId}-${index}`,
    appointmentId: appointment.id_cita,
    service: detail.serviceName,
    category: detail.category,
    price: Number(detail.price),
    date: appointment.fecha,
    isToday: appointment.fecha === getTodayISO(),
    startTime: detail.startTime,
    endTime: detail.endTime,
    employeeId: detail.employeeId,
    employee: detail.employeeName,
    status: appointment.estado,
    notes: appointment.specification || '',
  }));
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
