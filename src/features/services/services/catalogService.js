import axiosClient from '../../../api/axiosClient';

const SERVICE_STATUS_IDS = { Activo: 1, Inactivo: 2 };

const resolveTheme = (category, index = 0) => {
  const norm = (category || '').toLowerCase();
  if (norm.includes('uña')) return index % 2 === 0 ? 'amber-scissors' : 'mint-sparkles';
  return index % 2 === 0 ? 'pink-scissors' : 'pink-sparkles';
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

const toService = (row, index = 0) => {
  const status = Object.keys(SERVICE_STATUS_IDS).find(
    (label) => SERVICE_STATUS_IDS[label] === row.estado
  );
  if (!status) throw new Error('El servidor devolvió un estado de servicio desconocido.');
  return {
    id: row.id_servicio,
    name: row.servicio,
    description: row.notas_detalles || '',
    category: row.categoria,
    price: Number(row.precio),
    durationMinutes: row.duracion_estimada,
    status,
    theme: resolveTheme(row.categoria, index),
  };
};

const toPromotion = (row, services, index = 0) => {
  const serviceIds = row.servicios_ids || [];
  const includedServices = services.filter((service) =>
    serviceIds.includes(service.id)
  );
  const categories = [...new Set(includedServices.map((service) => service.category))];

  return {
    id: row.id_paquete,
    name: row.paquete,
    serviceIds,
    serviceIncluded:
      row.servicios_incluidos ||
      includedServices.map((service) => service.name).join(', '),
    category: categories.length === 1 ? categories[0] : 'Paquete mixto',
    price: Number(row.precio),
    durationMinutes: Number(row.duracion_estimada),
    validFrom: row.fecha_inicio,
    validUntil: row.fecha_fin,
    description: row.descripcion || '',
    status: row.estado,
    theme: resolveTheme(categories[0], index),
  };
};

const servicePayload = async (payload) => {
  const result = {};
  if (payload.name !== undefined) result.nombre = payload.name;
  if (payload.description !== undefined) result.notas_detalles = payload.description;
  if (payload.price !== undefined) result.precio = Number(payload.price);
  if (payload.durationMinutes !== undefined) {
    result.duracion_estimada = Number(payload.durationMinutes);
  }
  if (payload.category !== undefined) {
    const references = await getReferences();
    result.categoria_id = findIdByName(
      references.categorias,
      payload.category,
      'id_categoria'
    );
  }
  if (payload.status !== undefined) {
    if (!Object.hasOwn(SERVICE_STATUS_IDS, payload.status)) {
      throw new Error('El estado del servicio no es válido.');
    }
    result.estado_id = SERVICE_STATUS_IDS[payload.status];
  }
  return result;
};

const promotionPayload = async (payload) => {
  const references = await getReferences();
  const result = {};
  if (payload.name !== undefined) result.nombre = payload.name;
  if (payload.description !== undefined) result.descripcion = payload.description;
  if (payload.price !== undefined) result.precio = Number(payload.price);
  if (payload.validFrom !== undefined) result.fecha_inicio = payload.validFrom;
  if (payload.validUntil !== undefined) result.fecha_fin = payload.validUntil;
  if (payload.status !== undefined) {
    result.estado_id = findIdByName(references.estados, payload.status, 'id_estado');
  }
  if (payload.serviceIds !== undefined) {
    result.servicios = payload.serviceIds.map((id) => ({ id_servicio: Number(id) }));
  }
  return result;
};

export const catalogService = {
  async getServices({ user } = {}) {
    const rows = (await axiosClient.get('/api/v1/catalogo/servicios')).data;
    let services = rows.map(toService);
    if (user && user.role !== 'admin' && user.specialtyCategory) {
      services = services.filter(
        (service) => service.category === user.specialtyCategory
      );
    }
    return services;
  },

  async createService(payload) {
    const data = await servicePayload(payload);
    const created = (
      await axiosClient.post('/servicios/', data)
    ).data;
    const rows = (await axiosClient.get('/api/v1/catalogo/servicios')).data;
    const row = rows.find((item) => item.id_servicio === created.id_servicio);
    if (!row) throw new Error('El servicio se creó, pero no apareció en el catálogo.');
    if (data.estado_id !== undefined && row.estado !== data.estado_id) {
      throw new Error('El servidor no confirmó el estado del servicio creado.');
    }
    return toService(row);
  },

  async updateService(id, payload) {
    const data = await servicePayload(payload);
    await axiosClient.patch(`/servicios/${id}`, data);
    const rows = (await axiosClient.get('/api/v1/catalogo/servicios')).data;
    const row = rows.find((item) => item.id_servicio === Number(id));
    if (!row) throw new Error('No se encontró el servicio actualizado en el catálogo.');
    if (data.estado_id !== undefined && row.estado !== data.estado_id) {
      throw new Error('El servidor no confirmó el estado actualizado del servicio.');
    }
    return toService(row);
  },

  async deleteService(id) {
    await axiosClient.delete(`/servicios/${id}`);
  },

  async getPromotions({ user } = {}) {
    const [packageRows, serviceRows] = await Promise.all([
      axiosClient.get('/api/v1/catalogo/paquetes'),
      axiosClient.get('/api/v1/catalogo/servicios'),
    ]);
    const services = serviceRows.data.map(toService);
    let promotions = packageRows.data.map((row, index) =>
      toPromotion(row, services, index)
    );

    if (user && user.role !== 'admin' && user.specialtyCategory) {
      const allowedIds = new Set(
        services
          .filter((service) => service.category === user.specialtyCategory)
          .map((service) => service.id)
      );
      promotions = promotions.filter(
        (promotion) =>
          promotion.category === user.specialtyCategory ||
          promotion.category === 'Paquete mixto' ||
          promotion.serviceIds.some((id) => allowedIds.has(id))
      );
    }
    return promotions;
  },

  async createPromotion(payload) {
    const data = await promotionPayload(payload);
    const created = (await axiosClient.post('/paquetes/', data)).data;
    const rows = (await axiosClient.get('/api/v1/catalogo/paquetes')).data;
    const row = rows.find((item) => item.id_paquete === created.id_paquete);
    const services = (await axiosClient.get('/api/v1/catalogo/servicios')).data.map(
      toService
    );
    if (!row) throw new Error('El paquete se creó, pero no apareció en el catálogo.');
    return toPromotion(row, services);
  },

  async updatePromotion(id, payload) {
    const data = await promotionPayload(payload);
    await axiosClient.patch(`/paquetes/${id}`, data);
    const [packageRows, serviceRows] = await Promise.all([
      axiosClient.get('/api/v1/catalogo/paquetes'),
      axiosClient.get('/api/v1/catalogo/servicios'),
    ]);
    const row = packageRows.data.find((item) => item.id_paquete === Number(id));
    if (!row) throw new Error('No se encontró el paquete actualizado en el catálogo.');
    return toPromotion(row, serviceRows.data.map(toService));
  },

  async deletePromotion(id) {
    await axiosClient.delete(`/paquetes/${id}`);
  },
};
