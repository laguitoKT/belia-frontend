// import axiosClient from '../../../api/axiosClient';

let servicesStore = [
  {
    id: 1,
    name: 'Corte y estilizado',
    description: 'Lavado, corte y peinado',
    category: 'Cabello',
    price: 450,
    status: 'Activo',
    theme: 'pink-scissors',
  },
  {
    id: 2,
    name: 'Coloración completa',
    description: 'Diagnóstico, tinte y secado',
    category: 'Cabello',
    price: 1250,
    status: 'Activo',
    theme: 'pink-sparkles',
  },
  {
    id: 3,
    name: 'Manicura gel',
    description: 'Limpieza y esmaltado en gel',
    category: 'Uñas',
    price: 380,
    status: 'Activo',
    theme: 'amber-scissors',
  },
  {
    id: 4,
    name: 'Pedicura spa',
    description: 'Exfoliación, masaje y esmalte',
    category: 'Uñas',
    price: 520,
    status: 'Activo',
    theme: 'mint-sparkles',
  },
  {
    id: 5,
    name: 'Diseño de cejas',
    description: 'Perfilado y diseño personalizado',
    category: 'Mirada',
    price: 290,
    status: 'Inactivo',
    theme: 'pink-scissors',
  },
  {
    id: 6,
    name: 'Lifting de pestañas',
    description: 'Curvatura y tinte semipermanente',
    category: 'Mirada',
    price: 650,
    status: 'Activo',
    theme: 'pink-sparkles',
  },
];

let promotionsStore = [
  {
    id: 201,
    name: 'Glow de temporada',
    serviceIds: [5, 6],
    serviceIncluded: 'DISEÑO DE CEJAS + LIFTING',
    category: 'Mirada',
    price: 899,
    validFrom: '2026-11-01', // <-- AGREGAR ESTA LÍNEA
    validUntil: '2026-11-30',
    description: 'Limpieza facial y diseño de cejas.',
    status: 'Activo',
    theme: 'pink-scissors',
  },
  {
    id: 202,
    name: 'Manos & pies',
    serviceIds: [3, 4],
    serviceIncluded: 'MANICURA GEL + PEDICURA SPA',
    category: 'Uñas',
    price: 749,
    validFrom: '2026-11-01', // <-- AGREGAR ESTA LÍNEA
    validUntil: '2026-12-15',
    description: 'Experiencia spa completa con gel.',
    status: 'Activo',
    theme: 'pink-sparkles',
  },
  {
    id: 203,
    name: 'Color refresh',
    serviceIds: [1, 2],
    serviceIncluded: 'CORTE + COLORACIÓN COMPLETA',
    category: 'Cabello',
    price: 1390,
    validFrom: '2026-11-01', // <-- AGREGAR ESTA LÍNEA
    validUntil: '2026-11-28',
    description: 'Renueva tu tono y recupera el brillo.',
    status: 'Activo',
    theme: 'amber-scissors',
  },
];

const resolveTheme = (category, index = 0) => {
  const norm = (category || '').toLowerCase();
  if (norm.includes('uña')) return index % 2 === 0 ? 'amber-scissors' : 'mint-sparkles';
  return index % 2 === 0 ? 'pink-scissors' : 'pink-sparkles';
};

export const catalogService = {
  async getServices({ user } = {}) {
    // FastAPI: return (await axiosClient.get('/services')).data;
    return new Promise((resolve) => {
      setTimeout(() => {
        const results =
          user && user.role !== 'admin' && user.specialtyCategory
            ? servicesStore.filter((s) => s.category === user.specialtyCategory)
            : [...servicesStore];
        resolve(results);
      }, 100);
    });
  },

  async createService(payload) {
    // FastAPI: return (await axiosClient.post('/services', payload)).data;
    return new Promise((resolve) => {
      setTimeout(() => {
        const newService = {
          id: Date.now(),
          ...payload,
          price: Number(payload.price),
          theme: resolveTheme(payload.category, servicesStore.length),
        };
        servicesStore = [newService, ...servicesStore];
        resolve(newService);
      }, 100);
    });
  },

  async updateService(id, payload) {
    // Integración con FastAPI: return (await axiosClient.put(`/services/${id}`, payload)).data;
    return new Promise((resolve) => {
      setTimeout(() => {
        servicesStore = servicesStore.map((s) =>
          s.id === id ? { ...s, ...payload, price: Number(payload.price) } : s
        );
        resolve(servicesStore.find((s) => s.id === id));
      }, 100);
    });
  },

  async deleteService(id) {
    // Integración con FastAPI: await axiosClient.delete(`/services/${id}`);
    return new Promise((resolve) => {
      setTimeout(() => {
        servicesStore = servicesStore.filter((s) => s.id !== id);
        resolve(true);
      }, 100);
    });
  },

  async getPromotions({ user } = {}) {
    // Integración con FastAPI: return (await axiosClient.get('/promotions')).data;
    return new Promise((resolve) => {
      setTimeout(() => {
        const results =
          user && user.role !== 'admin' && user.specialtyCategory
            ? promotionsStore.filter((p) => p.category === user.specialtyCategory)
            : [...promotionsStore];
        resolve(results);
      }, 100);
    });
  },

  async createPromotion(payload) {
    // Integración con FastAPI: return (await axiosClient.post('/promotions', payload)).data;
    return new Promise((resolve) => {
      setTimeout(() => {
        const newPromo = {
          id: Date.now(),
          ...payload,
          price: Number(payload.price),
          theme: resolveTheme(payload.category, promotionsStore.length),
        };
        promotionsStore = [newPromo, ...promotionsStore];
        resolve(newPromo);
      }, 100);
    });
  },

  async updatePromotion(id, payload) {
    // Integración con FastAPI: return (await axiosClient.put(`/promotions/${id}`, payload)).data;
    return new Promise((resolve) => {
      setTimeout(() => {
        promotionsStore = promotionsStore.map((p) =>
          p.id === id ? { ...p, ...payload, price: Number(payload.price) } : p
        );
        resolve(promotionsStore.find((p) => p.id === id));
      }, 100);
    });
  },

  async deletePromotion(id) {
    // Integración con FastAPI: await axiosClient.delete(`/promotions/${id}`);
    return new Promise((resolve) => {
      setTimeout(() => {
        promotionsStore = promotionsStore.filter((p) => p.id !== id);
        resolve(true);
      }, 100);
    });
  },
};