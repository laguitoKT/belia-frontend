import axiosClient from '../../../api/axiosClient';

const ACTIVE_STATE_ID = 1;
const INACTIVE_STATE_ID = 2;

export const getProductStockStatus = (quantity, minStock = 8, active = true) => {
  const qty = Number(quantity) || 0;

  if (!active) {
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
      label: 'Activo · Crítico',
      shortLabel: 'Crítico',
      badgeClass: 'bg-[#FDECEF] text-brand-primary',
      dotClass: 'bg-brand-primary',
      isActive: true,
    };
  }
  if (qty < minStock) {
    return {
      label: 'Activo · Bajo',
      shortLabel: 'Bajo',
      badgeClass: 'bg-[#FEF3E2] text-[#A66A15]',
      dotClass: 'bg-amber-500',
      isActive: true,
    };
  }
  return {
    label: 'Activo · Óptimo',
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

const toProduct = (row) => {
  if (
    !row ||
    typeof row.nombre !== 'string' ||
    !row.nombre.trim() ||
    row.cantidad_existente == null ||
    String(row.cantidad_existente).trim() === '' ||
    !Number.isFinite(Number(row.cantidad_existente)) ||
    (row.estado_id !== ACTIVE_STATE_ID && row.estado_id !== INACTIVE_STATE_ID)
  ) {
    throw new Error('El servidor devolvió un producto de inventario inválido.');
  }

  return {
    id: row.id_producto,
    name: row.nombre,
    category: row.categoria || '',
    presentation: row.presentacion || '',
    measureUnit: row.unidad || '',
    unit: [row.presentacion, row.unidad].filter(Boolean).join(' / '),
    quantity: Number(row.cantidad_existente),
    minStock: 11,
    active: row.estado_id === ACTIVE_STATE_ID,
    imageUrl: row.imagen_url || null,
    price: row.precio == null ? null : Number(row.precio),
    categoryId: row.categoria_id,
    presentationId: row.presentacion_id,
    unitId: row.unidad_id,
  };
};

const toDatabasePayload = async (payload) => {
  if (payload.imageFile) {
    throw new Error(
      'La base de datos solo almacena una URL de imagen. Sube el archivo a un servicio de almacenamiento y guarda su URL.'
    );
  }
  const result = {};
  if (payload.name !== undefined) result.nombre = payload.name;
  if (payload.quantity !== undefined) {
    const quantity = Number(payload.quantity);
    if (payload.quantity === null || payload.quantity === '' || !Number.isFinite(quantity) || quantity < 0) {
      throw new Error('La cantidad del producto debe ser un número igual o mayor a 0.');
    }
    result.cantidad_existente = quantity;
    result.estado_id = quantity === 0 ? INACTIVE_STATE_ID : ACTIVE_STATE_ID;
  }
  if (payload.imageUrl !== undefined) result.imagen_url = payload.imageUrl;
  if (payload.price !== undefined) result.precio = payload.price;
  const references = payload.category !== undefined || payload.presentation !== undefined || payload.measureUnit !== undefined
    ? await getReferences()
    : null;
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
  const [viewResponse, productResponse] = await Promise.all([
    axiosClient.get('/api/v1/inventario/tabla'),
    axiosClient.get(`/inventario/${id}`),
  ]);
  const rows = viewResponse.data;
  const row = rows.find((item) => item.id_producto === Number(id));
  if (!row) throw new Error('No se encontró el producto en el inventario.');
  return toProduct({ ...row, ...productResponse.data });
};

export const inventoryService = {
  async getProducts({ user } = {}) {
    const [viewResponse, firstPage] = await Promise.all([
      axiosClient.get('/api/v1/inventario/tabla'),
      axiosClient.get('/inventario/', { params: { skip: 0, limit: 100 } }),
    ]);
    const records = [...firstPage.data];
    let page = firstPage.data;
    while (page.length === 100) {
      page = (await axiosClient.get('/inventario/', {
        params: { skip: records.length, limit: 100 },
      })).data;
      records.push(...page);
    }
    const byId = new Map(records.map((record) => [record.id_producto, record]));
    let products = viewResponse.data.map((row) => {
      const record = byId.get(row.id_producto);
      if (!record) throw new Error('No se encontró el estado de un producto del inventario.');
      return toProduct({ ...row, ...record });
    });
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
    if (data.cantidad_existente === undefined) {
      throw new Error('La cantidad del producto es obligatoria.');
    }
    const created = (await axiosClient.post('/inventario/', data)).data;
    const product = await getProductFromView(created.id_producto);
    if (product.quantity !== data.cantidad_existente || product.active !== (data.estado_id === ACTIVE_STATE_ID)) {
      throw new Error('El servidor no confirmó la cantidad y el estado del producto creado.');
    }
    return product;
  },

  async updateProduct(id, payload) {
    const data = await toDatabasePayload(payload);
    await axiosClient.patch(`/inventario/${id}`, data);
    const product = await getProductFromView(id);
    if (data.cantidad_existente !== undefined &&
      (product.quantity !== data.cantidad_existente || product.active !== (data.estado_id === ACTIVE_STATE_ID))) {
      throw new Error('El servidor no confirmó la cantidad y el estado actualizados.');
    }
    return product;
  },

  async deleteProduct(id) {
    await axiosClient.delete(`/inventario/${id}`);
  },
};
