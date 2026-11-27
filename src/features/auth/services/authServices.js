import axiosClient from '../../../api/axiosClient';
import { resolveSpecialtyCategory } from '../../../utils/specialtyCategory';

export class LoginResponseError extends Error {
  constructor() {
    super('El servidor devolvió una respuesta de inicio de sesión inválida.');
  }
}

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
    specialtyCategory: isAdmin
      ? 'Todas'
      : resolveSpecialtyCategory(employee.especialidad || ''),
    phone: employee.telefono || '',
    email: employee.correo,
    scheduleDays: '',
    scheduleHours: '',
  };
};

export const authService = {
  async login(email, password) {
    const { data } = await axiosClient.post('/empleados/login', {
      correo: email.trim(),
      password,
    });
    const employee = data?.employee;
    if (
      typeof data?.access_token !== 'string' ||
      !data.access_token.trim() ||
      !employee ||
      (typeof employee.id_empleado !== 'number' &&
        (typeof employee.id_empleado !== 'string' || !employee.id_empleado.trim())) ||
      typeof employee.nombre_completo !== 'string' ||
      !employee.nombre_completo.trim() ||
      typeof employee.correo !== 'string' ||
      !employee.correo.trim() ||
      typeof employee.rol !== 'string' ||
      !employee.rol.trim() ||
      (employee.especialidad != null && typeof employee.especialidad !== 'string') ||
      (employee.telefono != null && typeof employee.telefono !== 'string')
    ) {
      throw new LoginResponseError();
    }
    return {
      access_token: data.access_token,
      user: toUser(employee),
    };
  },
};
