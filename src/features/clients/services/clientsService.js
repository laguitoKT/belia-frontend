// import axiosClient from '../../../api/axiosClient';

let clientsStore = [
  {
    id: 1,
    name: 'Sofía Mendoza',
    phone: '55 1234 6678',
    email: 'sofia.m@email.com',
    assignedEmployeeIds: [2], // Atendida por Mariana Silva (id: 2)
    notes: 'Prefiere productos libres de sulfatos y secado con temperatura media.',
    visits: [
      {
        id: 501,
        service: 'Corte, peinado',
        category: 'Cabello',
        price: 650,
        date: '2026-11-06',
        isToday: true,
        startTime: '09:00',
        endTime: '10:00',
        employeeId: 2,
        employee: 'Mariana Silva',
        status: 'Completada',
        notes: 'Corte en capas largas y ondas suaves.',
      },
      {
        id: 502,
        service: 'Hidratación capilar profunda',
        category: 'Cabello',
        price: 580,
        date: '2026-10-14',
        startTime: '11:00',
        endTime: '12:00',
        employeeId: 2,
        employee: 'Mariana Silva',
        status: 'Completada',
        notes: 'Ampolleta de argán aplicada.',
      },
      {
        id: 503,
        service: 'Retoque de raíz',
        category: 'Coloración',
        price: 850,
        date: '2026-09-02',
        startTime: '16:00',
        endTime: '17:30',
        employeeId: 2,
        employee: 'Mariana Silva',
        status: 'Completada',
        notes: 'Tono castaño luminoso #6.0.',
      },
      {
        id: 504,
        service: 'Corte despunte + brushing',
        category: 'Cabello',
        price: 450,
        date: '2026-07-19',
        startTime: '10:30',
        endTime: '11:30',
        employeeId: 2,
        employee: 'Mariana Silva',
        status: 'Completada',
        notes: 'Despunte de mantenimiento.',
      },
    ],
  },
  {
    id: 2,
    name: 'Camila Ruiz',
    phone: '55 3467 9012',
    email: 'camila.r@email.com',
    assignedEmployeeIds: [3], // Atendida por Camila Torres (id: 3)
    notes: 'Alergia leve a monómeros acrílicos tradicionales; usar línea hipoalergénica.',
    visits: [
      {
        id: 505,
        service: 'Manicura gel',
        category: 'Uñas',
        price: 380,
        date: '2026-11-06',
        isToday: true,
        startTime: '10:30',
        endTime: '11:15',
        employeeId: 3,
        employee: 'Camila Torres',
        status: 'Confirmada',
        notes: 'Esmaltado gel tono nude rosado.',
      },
      {
        id: 506,
        service: 'Pedicura spa',
        category: 'Uñas',
        price: 520,
        date: '2026-10-08',
        startTime: '13:00',
        endTime: '14:00',
        employeeId: 3,
        employee: 'Camila Torres',
        status: 'Completada',
        notes: 'Exfoliación con sales minerales.',
      },
      {
        id: 507,
        service: 'Retiro y nivelación rubber',
        category: 'Uñas',
        price: 420,
        date: '2026-09-11',
        startTime: '17:00',
        endTime: '18:00',
        employeeId: 3,
        employee: 'Camila Torres',
        status: 'Completada',
        notes: 'Base fortalecedora con calcio.',
      },
    ],
  },
  {
    id: 3,
    name: 'Valeria Torres',
    phone: '55 8765 3321',
    email: 'valeria.t@email.com',
    assignedEmployeeIds: [2], // Atendida por Mariana Silva (id: 2)
    notes: 'Cabello procesado; requiere protector de enlaces en cada decoloración.',
    visits: [
      {
        id: 508,
        service: 'Tinte completo',
        category: 'Coloración',
        price: 1250,
        date: '2025-05-15',
        startTime: '12:00',
        endTime: '13:30',
        employeeId: 2,
        employee: 'Mariana Silva',
        status: 'Completada',
        notes: 'Tono #7.1 rubio cenizo medio.',
      },
      {
        id: 509,
        service: 'Corte mariposa',
        category: 'Cabello',
        price: 480,
        date: '2025-04-02',
        startTime: '15:00',
        endTime: '16:00',
        employeeId: 2,
        employee: 'Mariana Silva',
        status: 'Completada',
        notes: 'Capas largas con flequillo cortina.',
      },
      {
        id: 510,
        service: 'Tratamiento botox capilar',
        category: 'Cabello',
        price: 950,
        date: '2025-02-18',
        startTime: '11:00',
        endTime: '12:30',
        employeeId: 2,
        employee: 'Mariana Silva',
        status: 'Completada',
        notes: 'Sellado térmico antifrizz.',
      },
    ],
  },
  {
    id: 4,
    name: 'Renata Díaz',
    phone: '55 4567 8890',
    email: 'renata.d@email.com',
    assignedEmployeeIds: [2], 
    notes: 'Piel sensible en zona periocular.',
    visits: [
      {
        id: 511,
        service: 'Cejas, pestañas',
        category: 'Mirada',
        price: 650,
        date: '2025-05-12',
        startTime: '15:00',
        endTime: '16:00',
        employeeId: 2,
        employee: 'Mariana Silva',
        status: 'Completada',
        notes: 'Diseño con hilo y lifting de pestañas.',
      },
      {
        id: 512,
        service: 'Corte y estilizado',
        category: 'Cabello',
        price: 450,
        date: '2025-03-22',
        startTime: '10:00',
        endTime: '11:00',
        employeeId: 2,
        employee: 'Mariana Silva',
        status: 'Completada',
        notes: 'Corte recto clásico.',
      },
    ],
  },
  {
    id: 5,
    name: 'Lucía Herrera',
    phone: '55 7788 1102',
    email: 'lucia.h@email.com',
    assignedEmployeeIds: [3], 
    notes: 'Prefiere citas en horario matutino.',
    visits: [
      {
        id: 513,
        service: 'Pedicura spa',
        category: 'Uñas',
        price: 520,
        date: '2025-05-08',
        startTime: '11:30',
        endTime: '12:30',
        employeeId: 3,
        employee: 'Camila Torres',
        status: 'Completada',
        notes: 'Masaje relajante y esmalte clásico.',
      },
      {
        id: 514,
        service: 'Manicura rusa',
        category: 'Uñas',
        price: 450,
        date: '2025-04-10',
        startTime: '09:30',
        endTime: '10:30',
        employeeId: 3,
        employee: 'Camila Torres',
        status: 'Completada',
        notes: 'Limpieza profunda de cutícula.',
      },
    ],
  },
];

// Genera las iniciales a partir del nombre (ej. "Sofía Mendoza" -> "SM")
export const getClientInitials = (name = '') => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return 'CL';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

// Formatea la fecha y hora de una visita (ej. "Hoy, 09:00" o "15 may 2025, 12:00")
export const formatVisitDateTime = (visit) => {
  if (!visit) return 'Sin visitas registradas';
  if (visit.isToday) {
    return `Hoy, ${visit.startTime}`;
  }
  const [year, month, day] = visit.date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const monthShort = new Intl.DateTimeFormat('es-MX', { month: 'short' })
    .format(dateObj)
    .replace('.', '');
  const formattedDay = String(day).padStart(2, '0');
  return `${formattedDay} ${monthShort} ${year}, ${visit.startTime}`;
};

// Agrega propiedades derivadas al cliente, como iniciales, visitas ordenadas y última visita
const enrichClient = (client) => {
  const sortedVisits = [...(client.visits || [])].sort((a, b) =>
    `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`)
  );
  const latestVisit = sortedVisits[0] || null;

  return {
    ...client,
    initials: getClientInitials(client.name),
    visits: sortedVisits,
    lastService: latestVisit ? latestVisit.service : 'Nuevo cliente',
    lastCategory: latestVisit ? latestVisit.category : 'General',
    lastVisitFormatted: formatVisitDateTime(latestVisit),
  };
};

export const clientsService = {
  /**
   * Obtiene clientes según el usuario autenticado:
   * - Admin: ve todos los clientes del salón.
   * - Usuario/Estilista: ve únicamente los clientes atendidos por ese usuario (employeeId === user.id).
   */
  async getClients({ user } = {}) {
    // FastAPI:
    // const params = user?.role !== 'admin' ? { employee_id: user?.id } : {};
    // return (await axiosClient.get('/clients', { params })).data;

    return new Promise((resolve) => {
      setTimeout(() => {
        let list = clientsStore.map(enrichClient);

        if (user && user.role !== 'admin') {
          list = list.filter(
            (client) =>
              client.assignedEmployeeIds?.includes(user.id) ||
              client.visits?.some((v) => v.employeeId === user.id)
          );
        }

        resolve(list);
      }, 100);
    });
  },

  async createClient(payload, currentUser) {
    // FastAPI: return (await axiosClient.post('/clients', payload)).data;
    return new Promise((resolve) => {
      setTimeout(() => {
        const assignedEmployeeId = currentUser?.role !== 'admin' ? currentUser?.id : Number(payload.employeeId) || 2;
        const assignedEmployeeName =
          assignedEmployeeId === 3 ? 'Camila Torres' : 'Mariana Silva';

        const initialVisit = payload.initialService
          ? [
              {
                id: Date.now() + 1,
                service: payload.initialService,
                category: payload.initialCategory || 'Cabello',
                price: Number(payload.initialPrice) || 450,
                date: '2026-11-06',
                isToday: true,
                startTime: payload.initialTime || '10:00',
                endTime: '11:00',
                employeeId: assignedEmployeeId,
                employee: assignedEmployeeName,
                status: 'Confirmada',
                notes: payload.notes || 'Primera visita registrada.',
              },
            ]
          : [];

        const newClient = {
          id: Date.now(),
          name: payload.name,
          phone: payload.phone,
          email: payload.email,
          notes: payload.notes || '',
          assignedEmployeeIds: [assignedEmployeeId],
          visits: initialVisit,
        };

        clientsStore = [newClient, ...clientsStore];
        resolve(enrichClient(newClient));
      }, 100);
    });
  },

  async updateClient(id, payload) {
    // FastAPI: return (await axiosClient.put(`/clients/${id}`, payload)).data;
    return new Promise((resolve) => {
      setTimeout(() => {
        clientsStore = clientsStore.map((c) =>
          c.id === id
            ? {
                ...c,
                name: payload.name,
                phone: payload.phone,
                email: payload.email,
                notes: payload.notes ?? c.notes,
              }
            : c
        );
        const found = clientsStore.find((c) => c.id === id);
        resolve(enrichClient(found));
      }, 100);
    });
  },

  async deleteClient(id) {
    // FastAPI: await axiosClient.delete(`/clients/${id}`);
    return new Promise((resolve) => {
      setTimeout(() => {
        clientsStore = clientsStore.filter((c) => c.id !== id);
        resolve(true);
      }, 100);
    });
  },
};