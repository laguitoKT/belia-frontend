import axiosClient from '../../../api/axiosClient';

const resolveSpecialtyCategory = (employee) => {
  const specialty = `${employee.especialidad || ''} ${employee.rol || ''}`.toLowerCase();
  if (/uña|manic|pedic/.test(specialty)) return 'Uñas';
  if (/color/.test(specialty)) return 'Coloración';
  if (/mirada|ceja|pesta/.test(specialty)) return 'Mirada';
  if (/cabell|estilist|corte/.test(specialty)) return 'Cabello';
  if (/maquill/.test(specialty)) return 'Maquillaje';
  if (/facial/.test(specialty)) return 'Facial';
  return 'Todas';
};

const toUser = (employee) => {
  const name = employee.nombre_completo;
  const words = name.trim().split(/\s+/);
  const initials = words
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
  const isAdmin = employee.rol.toLowerCase().includes('admin');

  return {
    id: employee.id_empleado,
    username: employee.correo,
    firstName: words[0],
    name,
    initials,
    role: isAdmin ? 'admin' : 'stylist',
    roleLabel: employee.rol,
    specialty: employee.especialidad || '',
    specialtyCategory: isAdmin ? 'Todas' : resolveSpecialtyCategory(employee),
    phone: employee.telefono || '',
    email: employee.correo,
    scheduleDays: '',
    scheduleHours: '',
  };
};

export const authService = {
  async login(email, password) {
    const { data: employee } = await axiosClient.post('/empleados/login', {
      correo: email.trim(),
      password,
    });
    return {
      access_token: null,
      user: toUser(employee),
    };
  },
};
