import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

test('guarda y recupera selecciones de servicios y paquetes, y cambia solo el estado', async () => {
  const server = await createServer({ server: { middlewareMode: true }, logLevel: 'silent' });
  try {
    const { default: client } = await server.ssrLoadModule('/src/api/axiosClient.js');
    const { appointmentsService } = await server.ssrLoadModule(
      '/src/features/appointments/services/appointmentsService.js'
    );
    const original = { get: client.get, post: client.post, patch: client.patch };
    const sent = [];
    const row = {
      id_cita: 10, fecha: '2027-01-05', estado: 'Por Completar',
      categoria: 'Cabello', precio: 850, precio_total: 850,
      especificaciones: 'Notas', cliente_id: 1, cliente: 'Cliente',
      service_breakdown: [
        { serviceId: 1, serviceName: 'Corte', category: 'Cabello', startTime: '09:00',
          endTime: '09:45', durationMinutes: 45, employeeId: 1, employeeName: 'Ana',
          selectionId: 11, packageId: null, selectionName: 'Corte', selectionPrice: 350 },
        { serviceId: 1, serviceName: 'Corte', category: 'Cabello', startTime: '09:45',
          endTime: '10:30', durationMinutes: 45, employeeId: 1, employeeName: 'Ana',
          selectionId: 12, packageId: 4, selectionName: 'Paquete Total', selectionPrice: 500 },
        { serviceId: 2, serviceName: 'Manicura', category: 'Uñas', startTime: '10:30',
          endTime: '11:30', durationMinutes: 60, employeeId: 2, employeeName: 'Laura',
          selectionId: 12, packageId: 4, selectionName: 'Paquete Total', selectionPrice: 500 },
      ],
    };
    client.get = async (url) => {
      if (url === '/api/v1/catalogo/referencias') {
        return { data: { estados: [
          { nombre: 'Por Completar', id_estado: 3 },
          { nombre: 'Completada', id_estado: 4 },
        ] } };
      }
      if (url === '/api/v1/agenda/citas') return { data: [row] };
      throw new Error(`GET inesperado: ${url}`);
    };
    client.post = async (url, data) => {
      sent.push({ url, data });
      return { data: { id_cita: 10 } };
    };
    client.patch = async (url, data) => {
      sent.push({ url, data });
      return { data: {} };
    };
    try {
      const slots = row.service_breakdown.map((detail) => ({
        serviceId: detail.serviceId, employeeId: detail.employeeId,
        startTime: detail.startTime, endTime: detail.endTime,
      }));
      const payload = {
        clientId: 1, status: 'Pendiente', date: row.fecha, specification: 'Notas',
        agreedTotal: 850, serviceBreakdown: slots,
        selections: [
          { serviceId: 1, price: 350, details: slots.slice(0, 1) },
          { packageId: 4, price: 500, details: slots.slice(1) },
        ],
      };
      const result = await appointmentsService.createAppointment(payload);
      assert.equal(sent[0].data.notas_cita, 'Notas');
      assert.equal(sent[0].data.precio_total, 850);
      assert.equal(sent[0].data.selecciones[1].paquete_id, 4);
      assert.deepEqual(sent[0].data.selecciones[1].detalles.map((d) => d.servicio_id), [1, 2]);
      assert.equal(sent[0].data.selecciones[1].detalles[1].fecha_hora_inicio, '2027-01-05T10:30:00');
      assert.deepEqual(result.selections.map((s) => [s.serviceId, s.packageId, s.price, s.details.length]),
        [[1, null, 350, 1], [null, 4, 500, 2]]);
      assert.equal(result.service, 'Corte + Paquete Total');
      const edited = await appointmentsService.updateAppointment(10, payload);
      assert.equal(sent[1].data.selecciones[1].precio_acordado, 500);
      assert.equal(edited.selections[1].details.length, 2);
      await appointmentsService.updateAppointmentStatus(10, 'Confirmada');
      assert.deepEqual(sent[2].data, { estado_id: 4 });
    } finally {
      Object.assign(client, original);
    }
  } finally {
    await server.close();
  }
});
