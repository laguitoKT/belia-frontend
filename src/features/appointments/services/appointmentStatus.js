export const toAppointmentStatus = (status) => {
  switch (status?.toLowerCase()) {
    case 'por completar':
      return 'Pendiente';
    case 'completada':
      return 'Confirmada';
    default:
      return status;
  }
};

export const toDatabaseAppointmentStatus = (status) => {
  switch (status) {
    case 'Pendiente':
      return 'Por Completar';
    case 'Confirmada':
      return 'Completada';
    default:
      return status;
  }
};
