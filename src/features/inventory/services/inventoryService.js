// import axiosClient from '../../../api/axiosClient';

let inventoryStore = [
  {
    id: 1,
    name: 'Shampoo hidratante',
    presentation: 'Botella',
    measureUnit: 'L',
    unit: 'Botella L',
    quantity: 18,
    minStock: 8,
    category: 'Cabello',
    active: true,
    imageUrl: null,
  },
  {
    id: 2,
    name: 'Tinte profesional #7.1',
    presentation: 'Tubo',
    measureUnit: 'ml',
    unit: 'Tubo ml',
    quantity: 6,
    minStock: 8,
    category: 'Coloración',
    active: true,
    imageUrl: null,
  },
  {
    id: 3,
    name: 'Esmalte gel nude',
    presentation: 'Frasco',
    measureUnit: 'ml',
    unit: 'Frasco ml',
    quantity: 12,
    minStock: 6,
    category: 'Uñas',
    active: true,
    imageUrl: null,
  },
  {
    id: 4,
    name: 'Cera para cejas',
    presentation: 'Tarro',
    measureUnit: 'g',
    unit: 'Tarro g',
    quantity: 3,
    minStock: 6,
    category: 'Mirada',
    active: true,
    imageUrl: null,
  },
  {
    id: 5,
    name: 'Mascarilla reparadora',
    presentation: 'Tarro',
    measureUnit: 'ml',
    unit: 'Tarro ml',
    quantity: 9,
    minStock: 6,
    category: 'Cabello',
    active: true,
    imageUrl: null,
  },
];

// Evalúa tanto si está Inactivo (manual o por llegar a 0) como su nivel de stock
export const getProductStockStatus = (quantity, minStock = 8, active = true) => {
  const qty = Number(quantity) || 0;

  if (!active || qty <= 0) {
    return {
      label: qty <= 0 ? 'Inactivo (Sin stock)' : 'Inactivo',
      shortLabel: 'Inactivo',
      badgeClass: 'bg-stone-100 text-stone-500',
      dotClass: 'bg-stone-400',
      isActive: false,
    };
  }
  if (qty <= 3) {
    return {
      label: 'Crítico',
      shortLabel: 'Crítico',
      badgeClass: 'bg-[#FDECEF] text-brand-primary',
      dotClass: 'bg-brand-primary',
      isActive: true,
    };
  }
  if (qty < minStock) {
    return {
      label: 'Bajo',
      shortLabel: 'Bajo',
      badgeClass: 'bg-[#FEF3E2] text-[#A66A15]',
      dotClass: 'bg-amber-500',
      isActive: true,
    };
  }
  return {
    label: 'Óptimo',
    shortLabel: 'Óptimo',
    badgeClass: 'bg-[#E8F6F0] text-[#1E7E5A]',
    dotClass: 'bg-emerald-500',
    isActive: true,
  };
};

// Regla de negocio: si quantity === 0, active pasa automáticamente a false
const normalizeProductRule = (payload, previousProduct = null) => {
  const qty = Number(payload.quantity) || 0;
  const presentation = payload.presentation || previousProduct?.presentation || 'Botella';
  const measureUnit = payload.measureUnit || previousProduct?.measureUnit || 'ml';

  // Si la cantidad llega a 0, se desactiva automáticamente
  let nextActive = payload.active !== undefined ? Boolean(payload.active) : true;
  if (qty <= 0) {
    nextActive = false;
  } else if (previousProduct && previousProduct.quantity === 0 && qty > 0) {
    // Si estaba en 0 y se le agrega stock, se reactiva automáticamente
    nextActive = true;
  }

  return {
    ...previousProduct,
    ...payload,
    presentation,
    measureUnit,
    unit: `${presentation} ${measureUnit}`.trim(),
    quantity: qty,
    active: nextActive,
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
        const newProduct = normalizeProductRule({
          id: Date.now(),
          minStock: 8,
          category: payload.category,
          imageUrl: null,
          ...payload,
        });
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
          p.id === id ? normalizeProductRule(payload, p) : p
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