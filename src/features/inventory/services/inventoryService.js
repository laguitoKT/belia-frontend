// import axiosClient from '../../../api/axiosClient';

let inventoryStore = [
  {
    id: 1,
    name: 'Shampoo hidratante',
    unit: 'Botella 1 L',
    quantity: 18,
    minStock: 8,
    category: 'Cabello',
    imageUrl: null,
  },
  {
    id: 2,
    name: 'Tinte profesional #7.1',
    unit: 'Tubo 90 ml',
    quantity: 6,
    minStock: 8,
    category: 'Coloración',
    imageUrl: null,
  },
  {
    id: 3,
    name: 'Esmalte gel nude',
    unit: 'Frasco 15 ml',
    quantity: 12,
    minStock: 6,
    category: 'Uñas',
    imageUrl: null,
  },
  {
    id: 4,
    name: 'Cera para cejas',
    unit: 'Tarro 100 g',
    quantity: 3,
    minStock: 6,
    category: 'Mirada',
    imageUrl: null,
  },
  {
    id: 5,
    name: 'Mascarilla reparadora',
    unit: 'Tarro 500 ml',
    quantity: 9,
    minStock: 6,
    category: 'Cabello',
    imageUrl: null,
  },
];

// Calcula el estado del producto según su cantidad disponible (Óptimo, Bajo, Crítico)
export const getProductStockStatus = (quantity, minStock = 8) => {
  const qty = Number(quantity) || 0;
  if (qty <= 3) {
    return {
      label: 'Crítico',
      badgeClass: 'bg-[#FDECEF] text-brand-primary',
      dotClass: 'bg-brand-primary',
    };
  }
  if (qty < minStock) {
    return {
      label: 'Bajo',
      badgeClass: 'bg-[#FEF3E2] text-[#A66A15]',
      dotClass: 'bg-amber-500',
    };
  }
  return {
    label: 'Óptimo',
    badgeClass: 'bg-[#E8F6F0] text-[#1E7E5A]',
    dotClass: 'bg-emerald-500',
  };
};

export const inventoryService = {
  async getProducts({ user } = {}) {
    // FastAPI: return (await axiosClient.get('/inventory/products')).data;
    return new Promise((resolve) => {
      setTimeout(() => {
        let results = [...inventoryStore];

        // Filtrado por rol: Mariana (Cabello) ve Cabello y Coloración; Camila (Uñas) ve Uñas; Admin ve todo
        if (user && user.role !== 'admin' && user.specialtyCategory) {
          const allowed =
            user.specialtyCategory === 'Cabello'
              ? ['Cabello', 'Coloración']
              : [user.specialtyCategory];
          results = results.filter((p) => allowed.includes(p.category));
        }

        resolve(results);
      }, 100);
    });
  },

  async createProduct(payload) {
    // FastAPI con imagen (Multipart FormData):
    // const formData = new FormData();
    // Object.entries(payload).forEach(([k, v]) => v !== null && formData.append(k, v));
    // return (await axiosClient.post('/inventory/products', formData)).data;

    return new Promise((resolve) => {
      setTimeout(() => {
        const newProduct = {
          id: Date.now(),
          name: payload.name,
          unit: payload.unit,
          quantity: Number(payload.quantity),
          minStock: Number(payload.minStock) || 8,
          category: payload.category,
          imageUrl: payload.imageUrl || null,
        };
        inventoryStore = [newProduct, ...inventoryStore];
        resolve(newProduct);
      }, 100);
    });
  },

  async updateProduct(id, payload) {
    // FastAPI: return (await axiosClient.put(`/inventory/products/${id}`, payload)).data;
    return new Promise((resolve) => {
      setTimeout(() => {
        inventoryStore = inventoryStore.map((p) =>
          p.id === id
            ? {
                ...p,
                ...payload,
                quantity: Number(payload.quantity),
              }
            : p
        );
        resolve(inventoryStore.find((p) => p.id === id));
      }, 100);
    });
  },

  async deleteProduct(id) {
    // FastAPI: await axiosClient.delete(`/inventory/products/${id}`);
    return new Promise((resolve) => {
      setTimeout(() => {
        inventoryStore = inventoryStore.filter((p) => p.id !== id);
        resolve(true);
      }, 100);
    });
  },
};