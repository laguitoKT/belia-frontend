import axiosClient from '../../../api/axiosClient';

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

const toAppointment = (row) => {
  const serviceBreakdown = (row.service_breakdown || []).map((detail, index) => ({
    subKey: `${detail.serviceId}-${detail.employeeId}-${index}`,
    serviceId: detail.serviceId,
    serviceName: detail.serviceName,
    category: detail.category,
    startTime: detail.startTime,
    endTime: detail.endTime,
    durationMinutes: Number(detail.durationMinutes),
    employeeId: detail.employeeId,
    employeeName: detail.employeeName,
    employeeShortName: (detail.employeeName || '').split(' ')[0],
  }));
  const categories = [...new Set(serviceBreakdown.map((detail) => detail.category))];
  const employeeNames = [
    ...new Set(serviceBreakdown.map((detail) => detail.employeeName)),
  ];
  const serviceNames = serviceBreakdown.map((detail) => detail.serviceName);
  const totalDuration = serviceBreakdown.reduce(
    (total, detail) => total + detail.durationMinutes,
    0
  );
  const status = row.estado === 'Pendiente' ? 'Por confirmar' : row.estado;
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
    specification: row.specification || '',
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
  const stateName =
    payload.status === 'Por confirmar' ? 'Pendiente' : payload.status || 'Pendiente';
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
    notas_detalles: payload.specification || null,
    precio_total: Number.isFinite(Number(payload.price))
      ? Number(payload.price)
      : null,
    detalles,
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
    return getAppointmentFromView(created.id_cita);
  },

  async updateAppointment(id, payload) {
    const data = await toDatabasePayload(payload);
    await axiosClient.patch(`/citas/${id}`, data);
    return getAppointmentFromView(id);
  },

  async updateAppointmentStatus(id, nextStatus) {
    const appointment = await getAppointmentFromView(id);
    return this.updateAppointment(id, { ...appointment, status: nextStatus });
  },

  async deleteAppointment(id) {
    await axiosClient.delete(`/citas/${id}`);
  },
};
