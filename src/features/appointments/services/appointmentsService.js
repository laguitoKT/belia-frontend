import axiosClient from '../../../api/axiosClient';
import { toAppointmentStatus, toDatabaseAppointmentStatus } from './appointmentStatus';

const BREAKDOWN_MARKER = '[[BELIA_SERVICE_BREAKDOWN]]';

export const calculateEndTime = (startTime = '09:00', durationMinutes = 60) => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + Number(durationMinutes || 0);
  return `${String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0')}:${String(
    totalMinutes % 60
  ).padStart(2, '0')}`;
};

export const resolveAppointmentTheme = (category = '', status = 'Confirmada') => {
  if (status !== 'Confirmada') return 'amber';
  const normalized = category.toLowerCase();
  if (normalized.includes('uña')) return 'pink';
  if (normalized.includes('mirada')) return 'mint';
  if (normalized.includes('cabello') || normalized.includes('color')) return 'wine';
  return 'amber';
};

const parseDetails = (details) => {
  if (Array.isArray(details)) return details;
  if (typeof details !== 'string' || !details.trim()) return [];
  try {
    const parsedDetails = JSON.parse(details);
    return Array.isArray(parsedDetails) ? parsedDetails : [];
  } catch (error) {
    console.error('El desglose de servicios de la cita tiene un formato inválido.', error);
    return [];
  }
};

const getDetailsFromNotes = (notes = '') => {
  const markerIndex = String(notes).indexOf(BREAKDOWN_MARKER);
  if (markerIndex < 0) return [];
  return parseDetails(
    String(notes).slice(markerIndex + BREAKDOWN_MARKER.length).trim()
  );
};

const getAppointmentDetails = (row) => {
  const candidates = [
    row.service_breakdown,
    row.detalles,
    row.detalles_cita,
    row.detalle_servicios,
    row.servicios,
    getDetailsFromNotes(row.especificaciones || row.notas_cita),
  ]
    .map(parseDetails)
    .filter((details) => details.length > 0);

  return candidates.sort((a, b) => b.length - a.length)[0] || [];
};

const getAppointmentNotes = (notes = '') => {
  const markerIndex = String(notes).indexOf(BREAKDOWN_MARKER);
  return markerIndex < 0 ? notes : String(notes).slice(0, markerIndex).trim();
};

const getTimePart = (value) => {
  if (!value) return '';
  return String(value).includes('T')
    ? String(value).split('T').at(-1).slice(0, 5)
    : String(value).slice(0, 5);
};

const mergePayloadBreakdown = (appointment, payload) => {
  const payloadBreakdown = payload.serviceBreakdown;
  if (
    !Array.isArray(payloadBreakdown) ||
    payloadBreakdown.length <= appointment.serviceBreakdown.length
  ) {
    return appointment;
  }

  return {
    ...appointment,
    service: payload.service || appointment.service,
    category: payload.category || appointment.category,
    categories: payload.categories || appointment.categories,
    serviceCategory: payload.category || appointment.serviceCategory,
    endTime: payload.endTime || appointment.endTime,
    durationMinutes: payload.durationMinutes || appointment.durationMinutes,
    price: payload.price ?? appointment.price,
    employee: payload.employee || appointment.employee,
    employeeFullName: payload.employeeFullName || appointment.employeeFullName,
    serviceBreakdown: payloadBreakdown,
  };
};

const toAppointment = (row) => {
  const serviceBreakdown = getAppointmentDetails(row).map((detail, index) => {
    const serviceId = detail.serviceId ?? detail.servicio_id;
    const employeeId = detail.employeeId ?? detail.empleado_id;
    const employeeName =
      detail.employeeName ||
      detail.employee_name ||
      detail.empleado ||
      detail.estilista ||
      '';

    return {
      subKey: `${serviceId || detail.serviceName || detail.servicio}-${employeeId || index}-${index}`,
      serviceId,
      serviceName:
        detail.serviceName ||
        detail.service_name ||
        detail.servicio ||
        detail.nombre_servicio ||
        '',
      category: detail.category || detail.categoria || 'General',
      startTime: detail.startTime || getTimePart(detail.fecha_hora_inicio),
      endTime: detail.endTime || getTimePart(detail.fecha_hora_fin),
      durationMinutes: Number(
        detail.durationMinutes || detail.duration_minutes || detail.duracion_estimada || 0
      ),
      employeeId,
      employeeName,
      employeeShortName: employeeName.split(' ')[0],
    };
  });
  const categories = [...new Set(serviceBreakdown.map((detail) => detail.category))];
  const employeeNames = [
    ...new Set(serviceBreakdown.map((detail) => detail.employeeName)),
  ];
  const serviceNames = serviceBreakdown.map((detail) => detail.serviceName);
  const totalDuration = serviceBreakdown.reduce(
    (total, detail) => total + detail.durationMinutes,
    0
  );
  const status = toAppointmentStatus(row.estado);
  const category = categories.length > 1 ? 'Paquete mixto' : categories[0] || row.categoria;

  return {
    id: row.id_cita,
    date: row.fecha,
    startTime: serviceBreakdown[0]?.startTime || row.hora_inicio,
    endTime: serviceBreakdown.at(-1)?.endTime || row.hora_fin,
    durationMinutes: totalDuration || Number(row.duracion_estimada),
    durationHours: (totalDuration || Number(row.duracion_estimada)) / 60,
    serviceId: serviceBreakdown[0]?.serviceId || row.servicio_id,
    service: serviceNames.join(' + ') || row.servicio,
    specification: getAppointmentNotes(row.especificaciones ?? ''),
    category,
    categories,
    serviceCategory: category,
    price: Number(row.precio),
    clientId: row.cliente_id,
    client: row.cliente,
    clientPhone: row.telefono_cliente || '',
    employeeId: serviceBreakdown[0]?.employeeId || row.empleado_id,
    employee: employeeNames.map((name) => name.split(' ')[0]).join(' + '),
    employeeFullName: employeeNames.join(' | '),
    status,
    theme: resolveAppointmentTheme(category, status),
    serviceBreakdown,
  };
};

const getReferences = async () =>
  (await axiosClient.get('/api/v1/catalogo/referencias')).data;

const toDatabasePayload = async (payload) => {
  const references = await getReferences();
  const stateName = toDatabaseAppointmentStatus(payload.status || 'Pendiente');
  const state = references.estados.find(
    (item) => item.nombre.toLowerCase() === stateName.toLowerCase()
  );
  if (!state) throw new Error(`No existe el estado "${stateName}" en la base de datos.`);

  const serviceRows = (await axiosClient.get('/api/v1/catalogo/servicios')).data;
  const inputDetails = payload.serviceBreakdown?.length
    ? payload.serviceBreakdown
    : [
        {
          serviceId: payload.serviceId,
          serviceName: payload.service,
          employeeId: payload.employeeId,
          startTime: payload.startTime,
          endTime:
            payload.endTime ||
            calculateEndTime(payload.startTime, payload.durationMinutes || 60),
        },
      ];
  const details = inputDetails.map((detail) => {
    const service = detail.serviceId
      ? serviceRows.find(
          (row) => Number(row.id_servicio) === Number(detail.serviceId)
        )
      : serviceRows.find(
          (row) =>
            row.servicio.toLowerCase() ===
            String(detail.serviceName).toLowerCase()
        );
    if (!service) {
      throw new Error(
        `No se encontró el servicio "${detail.serviceName || detail.serviceId}" en el catálogo de la base de datos.`
      );
    }
    return {
      servicio_id: service.id_servicio,
      empleado_id: Number(detail.employeeId),
      fecha_hora_inicio: `${payload.date}T${detail.startTime}:00`,
      fecha_hora_fin: `${payload.date}T${detail.endTime}:00`,
    };
  });
  const first = details[0];
  return {
    cliente_id: Number(payload.clientId),
    empleado_id: first.empleado_id,
    servicio_id: first.servicio_id,
    estado_id: state.id_estado,
    fecha_hora_inicio: first.fecha_hora_inicio,
    fecha_hora_fin: first.fecha_hora_fin,
    notas_cita: payload.serviceBreakdown?.length
      ? `${payload.specification || ''}\n${BREAKDOWN_MARKER}${JSON.stringify(
          payload.serviceBreakdown
        )}`
      : payload.specification || null,
    precio_total: Number.isFinite(Number(payload.price))
      ? Number(payload.price)
      : null,
    detalles: details,
  };
};

const getAppointmentFromView = async (id) => {
  const rows = (
    await axiosClient.get('/api/v1/agenda/citas', { params: { id_cita: id } })
  ).data;
  const row = rows.find((item) => item.id_cita === Number(id));
  if (!row) throw new Error('No se encontró la cita en la agenda.');
  return toAppointment(row);
};

export const appointmentsService = {
  async getAppointments({ date, user } = {}) {
    const params = date ? { desde: date, hasta: date } : {};
    const rows = (await axiosClient.get('/api/v1/agenda/citas', { params })).data;
    let appointments = rows.map(toAppointment);
    if (user && user.role !== 'admin') {
      appointments = appointments.filter(
        (appointment) =>
          appointment.employeeId === user.id ||
          appointment.serviceBreakdown.some(
            (detail) => detail.employeeId === user.id
          ) ||
          appointment.category.toLowerCase() ===
            (user.specialtyCategory || '').toLowerCase()
      );
    }
    return appointments;
  },

  async createAppointment(payload) {
    const data = await toDatabasePayload(payload);
    const created = (await axiosClient.post('/citas/', data)).data;
    const appointment = await getAppointmentFromView(created.id_cita);
    return mergePayloadBreakdown(appointment, payload);
  },

  async updateAppointment(id, payload) {
    const data = await toDatabasePayload(payload);
    await axiosClient.patch(`/citas/${id}`, data);
    const appointment = await getAppointmentFromView(id);
    return mergePayloadBreakdown(appointment, payload);
  },

  async updateAppointmentStatus(id, nextStatus) {
    const appointment = await getAppointmentFromView(id);
    return this.updateAppointment(id, { ...appointment, status: nextStatus });
  },

  async deleteAppointment(id) {
    await axiosClient.delete(`/citas/${id}`);
  },
};
