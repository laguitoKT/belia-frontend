// import axiosClient from '../../../api/axiosClient';

let employeesStore = [
  {
    id: 2,
    name: 'Mariana Silva',
    phone: '55 1298 7781',
    email: 'mariana@aurora.mx',
    specialty: 'Estilista senior',
    specialtyCategory: 'Cabello',
    workDays: 'Lun – Vie',
    workDaysList: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'],
    startTime: '09:00',
    endTime: '18:00',
    active: true,
    serviceHistory: [
      {
        id: 701,
        service: 'Corte y estilizado',
        category: 'Cabello',
        client: 'Sofía Mendoza',
        clientPhone: '55 1234 6678',
        price: 450,
        date: '2026-11-06',
        isToday: true,
        startTime: '09:00',
        endTime: '10:00',
        status: 'Completada',
        notes: 'Corte en capas largas y secado con ondas suaves.',
      },
      {
        id: 702,
        service: 'Corte mariposa + tratamiento',
        category: 'Cabello',
        client: 'Valeria Torres',
        clientPhone: '55 8765 3321',
        price: 780,
        date: '2026-11-04',
        startTime: '11:00',
        endTime: '12:00',
        status: 'Completada',
        notes: 'Hidratación profunda en puntas.',
      },
      {
        id: 703,
        service: 'Corte bob + flequillo',
        category: 'Cabello',
        client: 'Renata Díaz',
        clientPhone: '55 4567 8890',
        price: 580,
        date: '2026-10-28',
        startTime: '14:00',
        endTime: '15:00',
        status: 'Completada',
        notes: 'Corte recto a la altura de la mandíbula.',
      },
      {
        id: 704,
        service: 'Brushing y sellado de puntas',
        category: 'Cabello',
        client: 'Lucía Herrera',
        clientPhone: '55 7788 1102',
        price: 420,
        date: '2026-10-15',
        startTime: '16:00',
        endTime: '17:00',
        status: 'Completada',
        notes: 'Aplicación de protector térmico y sérum de argán.',
      },
    ],
  },
  {
    id: 3,
    name: 'Paola García',
    phone: '55 9876 1240',
    email: 'paola@aurora.mx',
    specialty: 'Manicurista',
    specialtyCategory: 'Uñas',
    workDays: 'Mar – Sáb',
    workDaysList: ['Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
    startTime: '10:00',
    endTime: '19:00',
    active: true,
    serviceHistory: [
      {
        id: 705,
        service: 'Manicura gel',
        category: 'Uñas',
        client: 'Camila Ruiz',
        clientPhone: '55 3467 9012',
        price: 380,
        date: '2026-11-06',
        isToday: true,
        startTime: '10:30',
        endTime: '11:15',
        status: 'Completada',
        notes: 'Limpieza profunda y esmaltado en gel tono nude.',
      },
      {
        id: 706,
        service: 'Pedicura spa',
        category: 'Uñas',
        client: 'Lucía Herrera',
        clientPhone: '55 7788 1102',
        price: 520,
        date: '2026-10-30',
        startTime: '12:00',
        endTime: '13:00',
        status: 'Completada',
        notes: 'Exfoliación con sales minerales y masaje.',
      },
      {
        id: 707,
        service: 'Manos & pies',
        category: 'Uñas',
        client: 'Sofía Mendoza',
        clientPhone: '55 1234 6678',
        price: 749,
        date: '2026-10-19',
        startTime: '15:00',
        endTime: '16:45',
        status: 'Completada',
        notes: 'Paquete completo con gel semipermanente.',
      },
    ],
  },
  {
    id: 4,
    name: 'Elena Soto',
    phone: '55 4556 2910',
    email: 'elena@aurora.mx',
    specialty: 'Colorista',
    specialtyCategory: 'Coloración',
    workDays: 'Lun – Vie',
    workDaysList: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'],
    startTime: '11:00',
    endTime: '20:00',
    active: true,
    serviceHistory: [
      {
        id: 708,
        service: 'Coloración completa',
        category: 'Coloración',
        client: 'Valeria Torres',
        clientPhone: '55 8765 3321',
        price: 1250,
        date: '2026-11-05',
        startTime: '12:00',
        endTime: '14:00',
        status: 'Completada',
        notes: 'Diagnóstico capilar, tinte #7.1 y secado.',
      },
      {
        id: 709,
        service: 'Color refresh',
        category: 'Coloración',
        client: 'Sofía Mendoza',
        clientPhone: '55 1234 6678',
        price: 1390,
        date: '2026-10-22',
        startTime: '16:00',
        endTime: '19:00',
        status: 'Completada',
        notes: 'Baño de color y tratamiento hidratante.',
      },
    ],
  },
  {
    id: 5,
    name: 'Ana Luna',
    phone: '55 2210 9477',
    email: 'ana@aurora.mx',
    specialty: 'Especialista en mirada',
    specialtyCategory: 'Mirada',
    workDays: 'Mié – Dom',
    startTime: '09:00',
    endTime: '17:00',
    active: true,
    serviceHistory: [
      {
        id: 710,
        service: 'Lifting de pestañas',
        category: 'Mirada',
        client: 'Renata Díaz',
        clientPhone: '55 4567 8890',
        price: 650,
        date: '2026-11-03',
        startTime: '10:00',
        endTime: '11:00',
        status: 'Completada',
        notes: 'Curvatura natural y tinte negro intenso.',
      },
      {
        id: 711,
        service: 'Diseño de cejas',
        category: 'Mirada',
        client: 'Camila Ruiz',
        clientPhone: '55 3467 9012',
        price: 290,
        date: '2026-10-25',
        startTime: '13:00',
        endTime: '13:30',
        status: 'Completada',
        notes: 'Perfilado con hilo y visagismo.',
      },
    ],
  },
];

export const getEmployeeInitials = (name = '') => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return 'EM';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

export const formatEmployeeServiceDate = (record) => {
  if (!record) return 'Sin servicios recientes';
  if (record.isToday) {
    return `Hoy, ${record.startTime}`;
  }
  const [year, month, day] = record.date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const monthShort = new Intl.DateTimeFormat('es-MX', { month: 'short' })
    .format(dateObj)
    .replace('.', '');
  const formattedDay = String(day).padStart(2, '0');
  return `${formattedDay} ${monthShort} ${year}, ${record.startTime}`;
};

const enrichEmployee = (emp) => {
  const sortedHistory = [...(emp.serviceHistory || [])].sort((a, b) =>
    `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`)
  );

  return {
    ...emp,
    initials: getEmployeeInitials(emp.name),
    scheduleFormatted: `${emp.workDays} · ${emp.startTime} – ${emp.endTime}`,
    serviceHistory: sortedHistory,
  };
};

export const employeesService = {
  async getEmployees() {
    // FastAPI: return (await axiosClient.get('/employees')).data;
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(employeesStore.map(enrichEmployee));
      }, 100);
    });
  },

  async createEmployee(payload) {
    // FastAPI: return (await axiosClient.post('/employees', payload)).data;
    return new Promise((resolve) => {
      setTimeout(() => {
        const newEmp = {
            id: Date.now(),
            name: payload.name,
            phone: payload.phone,
            email: payload.email,
            specialty: payload.specialty,
            specialtyCategory: payload.specialtyCategory,
            workDays: payload.workDays,
            workDaysList: payload.workDaysList || [],
            startTime: payload.startTime,
            endTime: payload.endTime,
            active: payload.active !== undefined ? Boolean(payload.active) : true,
            serviceHistory: [],
        };
        employeesStore = [newEmp, ...employeesStore];
        resolve(enrichEmployee(newEmp));
      }, 100);
    });
  },

  async updateEmployee(id, payload) {
    // FastAPI: return (await axiosClient.put(`/employees/${id}`, payload)).data;
    return new Promise((resolve) => {
      setTimeout(() => {
        employeesStore = employeesStore.map((emp) =>
          emp.id === id ? { ...emp, ...payload } : emp
        );
        const updated = employeesStore.find((emp) => emp.id === id);
        resolve(enrichEmployee(updated));
      }, 100);
    });
  },

  async deleteEmployee(id) {
    // FastAPI: await axiosClient.delete(`/employees/${id}`);
    return new Promise((resolve) => {
      setTimeout(() => {
        employeesStore = employeesStore.filter((emp) => emp.id !== id);
        resolve(true);
      }, 100);
    });
  },
};