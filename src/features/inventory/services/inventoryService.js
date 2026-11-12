import axiosClient from '../../../api/axiosClient';

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

const getReferences = async () =>
  (await axiosClient.get('/api/v1/catalogo/referencias')).data;

const findIdByName = (items, name, idField) => {
  const item = items.find(
    (entry) => entry.nombre.toLowerCase() === String(name).toLowerCase()
  );
  if (!item) throw new Error(`No existe el catálogo "${name}" en la base de datos.`);
  return item[idField];
};

const toProduct = (row) => ({
  id: row.id_producto,
  name: row.producto,
  category: row.categoria,
  presentation: row.presentacion || '',
  measureUnit: row.unidad || '',
  unit: row.presentacion_unidad || '',
  quantity: Number(row.cantidad_disponible),
  minStock: 11,
  active: row.activo,
  imageUrl: row.imagen_url || null,
  price: row.precio === null ? null : Number(row.precio),
  categoryId: row.categoria_id,
  presentationId: row.presentacion_id,
  unitId: row.unidad_id,
});

const toDatabasePayload = async (payload) => {
  if (payload.imageFile) {
    throw new Error(
      'La base de datos solo almacena una URL de imagen. Sube el archivo a un servicio de almacenamiento y guarda su URL.'
    );
  }
  const references = await getReferences();
  const result = {};
  if (payload.name !== undefined) result.nombre = payload.name;
  if (payload.quantity !== undefined) {
    result.cantidad_existente = Number(payload.quantity);
  }
  if (payload.imageUrl !== undefined) result.imagen_url = payload.imageUrl;
  if (payload.price !== undefined) result.precio = payload.price;
  if (payload.active !== undefined) result.activo = Boolean(payload.active);
  if (payload.category !== undefined) {
    result.categoria_id = findIdByName(
      references.categorias,
      payload.category,
      'id_categoria'
    );
  }
  if (payload.presentation !== undefined) {
    result.presentacion_id = findIdByName(
      references.presentaciones,
      payload.presentation,
      'id_presentacion'
    );
  }
  if (payload.measureUnit !== undefined) {
    result.unidad_id = findIdByName(references.unidades, payload.measureUnit, 'id_unidad');
  }
  return result;
};

const getProductFromView = async (id) => {
  const rows = (await axiosClient.get('/api/v1/inventario/tabla')).data;
  const row = rows.find((item) => item.id_producto === Number(id));
  if (!row) throw new Error('No se encontró el producto en el inventario.');
  return toProduct(row);
};

export const inventoryService = {
  async getProducts({ user } = {}) {
    const rows = (await axiosClient.get('/api/v1/inventario/tabla')).data;
    let products = rows.map(toProduct);
    if (user && user.role !== 'admin' && user.specialtyCategory) {
      const allowed =
        user.specialtyCategory === 'Cabello'
          ? ['Cabello', 'Coloración']
          : [user.specialtyCategory];
      products = products.filter((product) => allowed.includes(product.category));
    }
    return products;
  },

  async createProduct(payload) {
    const data = await toDatabasePayload(payload);
    if (Number(payload.quantity) <= 0) data.activo = false;
    const created = (await axiosClient.post('/inventario/', data)).data;
    return getProductFromView(created.id_producto);
  },

  async updateProduct(id, payload) {
    const current = await axiosClient.get(`/inventario/${id}`);
    const data = await toDatabasePayload(payload);
    const nextQuantity = Number(
      payload.quantity ?? current.data.cantidad_existente
    );
    if (nextQuantity <= 0) {
      data.activo = false;
    } else if (Number(current.data.cantidad_existente) <= 0) {
      data.activo = true;
    }
    await axiosClient.patch(`/inventario/${id}`, data);
    return getProductFromView(id);
  },

  async deleteProduct(id) {
    await axiosClient.delete(`/inventario/${id}`);
  },
};
