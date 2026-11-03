// import axiosClient from '../../../api/axiosClient';

let inventoryStore = [
  // Materiales de la categoría Cabello (visibles para Mariana Silva y Admin)
  {
    id: 1,
    name: 'Shampoo hidratante profesional',
    unit: 'Botella 1L',
    quantity: 18,
    minStock: 5,
    category: 'Cabello',
  },
  {
    id: 2,
    name: 'Protector térmico capilar',
    unit: 'Spray 250ml',
    quantity: 4,
    minStock: 6, // Alerta de stock bajo en Cabello
    category: 'Cabello',
  },
  {
    id: 3,
    name: 'Mascarilla reparadora de argán',
    unit: 'Tarro 500ml',
    quantity: 9,
    minStock: 4,
    category: 'Cabello',
  },
  {
    id: 4,
    name: 'Sérum sellador de puntas',
    unit: 'Frasco 60ml',
    quantity: 3,
    minStock: 5, // Alerta de stock bajo en Cabello
    category: 'Cabello',
  },
  // Materiales de otras áreas (solo visibles para Admin o especialistas de esa área)
  {
    id: 5,
    name: 'Esmalte gel nude',
    unit: 'Frasco 15ml',
    quantity: 12,
    minStock: 4,
    category: 'Uñas',
  },
  {
    id: 6,
    name: 'Base coat vitaminada',
    unit: 'Frasco 15ml',
    quantity: 2,
    minStock: 5, // Alerta de stock bajo en Uñas
    category: 'Uñas',
  },
  {
    id: 7,
    name: 'Cera para cejas',
    unit: 'Tarro 100g',
    quantity: 3,
    minStock: 5,
    category: 'Mirada',
  },
];

export const inventoryService = {
  /**
   * Obtiene inventario aplicando el filtro de rol:
   * - Admin: ve todos los productos de todas las categorías.
   * - Estilista: solo ve productos donde category === user.specialtyCategory
   */
  async getProducts({ user } = {}) {
    // CUANDO SE INTEGRE FASTAPI:
    // const params = user?.role !== 'admin' ? { category: user?.specialtyCategory } : {};
    // const { data } = await axiosClient.get('/inventory/products', { params });
    // return data;

    return new Promise((resolve) => {
      setTimeout(() => {
        let results = [...inventoryStore];

        if (user && user.role !== 'admin' && user.specialtyCategory) {
          results = results.filter(
            (prod) => prod.category === user.specialtyCategory
          );
        }

        resolve(results);
      }, 150);
    });
  },
};