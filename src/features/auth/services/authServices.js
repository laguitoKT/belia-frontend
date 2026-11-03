// import axiosClient from '../../../api/axiosClient';

export const MOCK_USERS = {
  admin: {
    id: 1,
    username: 'admin',
    firstName: ' Elena (Admin)',
    name: 'Elena Valdés',
    initials: 'EV',
    role: 'admin', // Acceso total
    roleLabel: 'Administradora General',
    specialty: 'Administración y Dirección General',
    specialtyCategory: 'Todas', // Sin filtro de categoría
    phone: '+52 (664) 100-2000',
    email: 'administrador@gmail.com',
    scheduleDays: 'Lunes a Sábado',
    scheduleHours: '08:00 AM - 08:00 PM',
  },
  mariana: {
    id: 2,
    username: 'mariana',
    firstName: 'Mariana',
    name: 'Mariana Silva',
    initials: 'MS',
    role: 'stylist', // Acceso restringido a su ámbito
    roleLabel: 'Estilista Senior',
    specialty: 'Especialista en Corte de Cabello',
    specialtyCategory: 'Cabello', // Filtra inventario, servicios y promociones
    phone: '+52 (664) 382-9104',
    email: 'mariana.silva@aurorasalon.com',
    scheduleDays: 'Lunes a Sábado',
    scheduleHours: '09:00 AM - 06:00 PM',
  },
  camila: {
    id: 3,
    username: 'camila',
    firstName: 'Camila',
    name: 'Camila Torres',
    initials: 'CT',
    role: 'stylist',
    roleLabel: 'Especialista en Uñas',
    specialty: 'Manicura y Pedicura Clínica',
    specialtyCategory: 'Uñas',
    phone: '+52 (664) 512-8890',
    email: 'camila.torres@aurorasalon.com',
    scheduleDays: 'Martes a Sábado',
    scheduleHours: '10:00 AM - 07:00 PM',
  },
};

export const authService = {
  async login(usernameInput, password) {
    // CUANDO SE INTEGRE FASTAPI:
    // const { data } = await axiosClient.post('/auth/login', { username: usernameInput, password });
    // return data;

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const normalized = usernameInput.trim().toLowerCase();

        // Permite entrar como admin escribiendo "admin" o "administrador@gmail.com"
        if (normalized.includes('admin')) {
          resolve({
            access_token: 'mock-jwt-admin-token',
            user: MOCK_USERS.admin,
          });
          return;
        }

        // Permite entrar como Camila escribiendo "camila"
        if (normalized.includes('camila')) {
          resolve({
            access_token: 'mock-jwt-camila-token',
            user: MOCK_USERS.camila,
          });
          return;
        }

        // Por defecto o escribiendo "mariana", entra como Mariana Silva (Especialista en Corte de Cabello)
        if (normalized && password.trim()) {
          resolve({
            access_token: 'mock-jwt-mariana-token',
            user: MOCK_USERS.mariana,
          });
          return;
        }

        reject(new Error('Credenciales inválidas'));
      }, 200);
    });
  },
};