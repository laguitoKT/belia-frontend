const LEGACY_SPECIALTY_CATEGORIES = {
  'estilista senior': 'Cabello',
  colorista: 'Coloración',
  manicurista: 'Uñas',
  'especialista en mirada': 'Mirada',
  'maquillista profesional': 'Maquillaje',
  'especialista facial': 'Facial',
};

export const resolveSpecialtyCategory = (specialty = '') => {
  const value = specialty.trim().toLowerCase();
  return LEGACY_SPECIALTY_CATEGORIES[value] || specialty || 'Todas';
};
