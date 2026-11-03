// import axiosClient from '../../../api/axiosClient';

let appointmentsStore = [
  // Citas de Mariana Silva (Especialista en Corte de Cabello)
  {
    id: 101,
    date: '2026-11-02',
    startTime: '09:00',
    endTime: '10:00',
    durationHours: 1,
    service: 'Corte + peinado',
    serviceCategory: 'Cabello',
    price: 650,
    client: 'Sofía Mendoza',
    clientPhone: '+52 (664) 234-5678',
    employeeId: 2,
    employee: 'Mariana Silva',
    status: 'Confirmada',
    notes: 'Corte en capas largas y secado con ondas suaves.',
  },
  {
    id: 102,
    date: '2026-11-02',
    startTime: '11:00',
    endTime: '12:00',
    durationHours: 1,
    service: 'Corte mariposa + tratamiento',
    serviceCategory: 'Cabello',
    price: 780,
    client: 'Valeria Torres',
    clientPhone: '+52 (664) 345-9988',
    employeeId: 2,
    employee: 'Mariana Silva',
    status: 'Por confirmar',
    notes: 'Hidratación profunda en puntas después del corte.',
  },
  {
    id: 103,
    date: '2026-11-02',
    startTime: '14:00',
    endTime: '15:00',
    durationHours: 1,
    service: 'Corte bob + flequillo',
    serviceCategory: 'Cabello',
    price: 580,
    client: 'Renata Díaz',
    clientPhone: '+52 (664) 556-7711',
    employeeId: 2,
    employee: 'Mariana Silva',
    status: 'Confirmada',
    notes: 'Corte recto a la altura de la mandíbula.',
  },
  // Citas de otras especialistas (Solo visibles para el Admin o para la especialista correspondiente)
  {
    id: 104,
    date: '2026-11-02',
    startTime: '10:30',
    endTime: '11:30',
    durationHours: 1,
    service: 'Manicura gel',
    serviceCategory: 'Uñas',
    price: 480,
    client: 'Camila Ruiz',
    clientPhone: '+52 (664) 876-5432',
    employeeId: 3,
    employee: 'Camila Torres',
    status: 'Confirmada',
    notes: 'Retiro de gel anterior incluido.',
  },
  {
    id: 105,
    date: '2026-11-02',
    startTime: '13:00',
    endTime: '14:30',
    durationHours: 1.5,
    service: 'Pedicura spa + gel',
    serviceCategory: 'Uñas',
    price: 620,
    client: 'Elena Garza',
    clientPhone: '+52 (664) 901-2233',
    employeeId: 3,
    employee: 'Camila Torres',
    status: 'Confirmada',
    notes: 'Exfoliación e hidratación térmica.',
  },
  {
    id: 106,
    date: '2026-11-03',
    startTime: '10:00',
    endTime: '11:00',
    durationHours: 1,
    service: 'Corte despunte + brushing',
    serviceCategory: 'Cabello',
    price: 550,
    client: 'Lucía Méndez',
    clientPhone: '+52 (664) 112-3344',
    employeeId: 2,
    employee: 'Mariana Silva',
    status: 'Confirmada',
    notes: 'Mantener el largo actual.',
  },
];

export const appointmentsService = {
  /**
   * Obtiene citas aplicando el filtro de rol:
   * - Admin: ve las citas de todos los empleados.
   * - Estilista: solo ve las citas donde employeeId === user.id
   */
  async getAppointments({ date, user } = {}) {
    // CUANDO SE INTEGRE FASTAPI:
    // const params = { date, ...(user?.role !== 'admin' && { employee_id: user?.id }) };
    // const { data } = await axiosClient.get('/appointments', { params });
    // return data;

    return new Promise((resolve) => {
      setTimeout(() => {
        let results = [...appointmentsStore];

        // Filtrado por rol: si no es admin, filtra exclusivamente sus propias citas
        if (user && user.role !== 'admin') {
          results = results.filter((apt) => apt.employeeId === user.id);
        }

        // Filtrado opcional por fecha
        if (date) {
          results = results.filter((apt) => apt.date === date);
        }

        // Ordenar cronológicamente por hora de inicio
        results.sort((a, b) => a.startTime.localeCompare(b.startTime));

        resolve(results);
      }, 150);
    });
  },

  async updateAppointmentStatus(id, newStatus) {
    return new Promise((resolve) => {
      setTimeout(() => {
        appointmentsStore = appointmentsStore.map((apt) =>
          apt.id === id ? { ...apt, status: newStatus } : apt
        );
        const updated = appointmentsStore.find((apt) => apt.id === id);
        resolve(updated);
      }, 150);
    });
  },
};