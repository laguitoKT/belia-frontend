import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Scissors,
  Sparkles,
  MoreHorizontal,
  LayoutGrid,
  Table2,
  Pencil,
  Power,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { catalogService } from '../services/catalogService';
import ServiceFormModal from '../components/ServiceFormModal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { parseLocalDate } from '../../../utils/dateUtils';

const CARD_THEMES = {
  'pink-scissors': {
    bg: 'bg-[#FDECEF]',
    circle: 'bg-[#FADADD]/60',
    text: 'text-brand-primary',
    icon: Scissors,
  },
  'pink-sparkles': {
    bg: 'bg-[#FDECEF]',
    circle: 'bg-[#FADADD]/60',
    text: 'text-[#C82344]',
    icon: Sparkles,
  },
  'amber-scissors': {
    bg: 'bg-[#FDF4E7]',
    circle: 'bg-[#F9E7CC]/60',
    text: 'text-[#9A6728]',
    icon: Scissors,
  },
  'mint-sparkles': {
    bg: 'bg-[#E9F7F5]',
    circle: 'bg-[#D1EFEA]/70',
    text: 'text-[#207268]',
    icon: Sparkles,
  },
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value);

// Formatea '2026-11-30' -> 'Hasta 30 nov' para coincidir con el mockup
const formatPromoPeriod = (fromISO, untilISO) => {
  const formatShort = (iso) => {
    if (!iso || !iso.includes('-')) return iso || '';
    const d = parseLocalDate(iso);
    const day = d.getDate();
    const month = new Intl.DateTimeFormat('es-MX', { month: 'short' })
      .format(d)
      .replace('.', '');
    return `${day} ${month}`;
  };

  if (fromISO && untilISO) {
    return `${formatShort(fromISO)} - ${formatShort(untilISO)}`;
  }
  return untilISO ? `Hasta ${formatShort(untilISO)}` : '';
};

export default function ServicesPage() {
  const { user, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState('services');
  const [viewMode, setViewMode] = useState('cards');

  const [services, setServices] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [openMenuId, setOpenMenuId] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    type: null, // 'delete' | 'toggle-status'
    item: null,
  });

  const [feedbackBanner, setFeedbackBanner] = useState('');

  const showToast = (msg) => {
    setFeedbackBanner(msg);
    setTimeout(() => setFeedbackBanner(''), 3000);
  };

  useEffect(() => {
    const fetchCatalog = async () => {
      setIsLoading(true);
      try {
        const [srvData, promoData] = await Promise.all([
          catalogService.getServices({ user }),
          catalogService.getPromotions({ user }),
        ]);
        setServices(srvData);
        setPromotions(promoData);
        setSelectedCategory('Todas');
      } finally {
        setIsLoading(false);
      }
    };
    if (user) fetchCatalog();
  }, [user]);

  const availableCategories = useMemo(() => {
    if (!isAdmin && user?.specialtyCategory) {
      return ['Todas', user.specialtyCategory, 'Paquete mixto'];
    }
    return ['Todas', 'Cabello', 'Uñas', 'Mirada', 'Maquillaje', 'Facial', 'Paquete mixto'];
  }, [isAdmin, user]);

  const filteredServices = useMemo(() => {
    return services.filter((srv) => {
      const matchesSearch =
        srv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        srv.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === 'Todas' || srv.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [services, searchTerm, selectedCategory]);

  const filteredPromotions = useMemo(() => {
    return promotions.filter((promo) => {
      const matchesSearch =
        promo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promo.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promo.serviceIncluded.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === 'Todas' || promo.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [promotions, searchTerm, selectedCategory]);

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setOpenMenuId(null);
    setIsModalOpen(true);
  };

  const handleSaveModal = async (formData) => {
    if (activeTab === 'services') {
      if (editingItem) {
        const updated = await catalogService.updateService(editingItem.id, formData);
        setServices((prev) => prev.map((s) => (s.id === editingItem.id ? updated : s)));
        showToast(`Servicio "${updated.name}" actualizado.`);
      } else {
        const created = await catalogService.createService(formData);
        setServices((prev) => [created, ...prev]);
        showToast(`Servicio "${created.name}" creado.`);
      }
    } else {
      if (editingItem) {
        const updated = await catalogService.updatePromotion(editingItem.id, formData);
        setPromotions((prev) => prev.map((p) => (p.id === editingItem.id ? updated : p)));
        showToast(`Promoción "${updated.name}" actualizada.`);
      } else {
        const created = await catalogService.createPromotion(formData);
        setPromotions((prev) => [created, ...prev]);
        showToast(`Promoción "${created.name}" creada.`);
      }
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  // Advertencia al activar/desactivar tanto en tarjetas como en lista (tabla)
  const handleRequestToggleStatus = (item) => {
    setOpenMenuId(null);
    setConfirmState({
      isOpen: true,
      type: 'toggle-status',
      item,
    });
  };

  const executeToggleStatus = async (item) => {
    const nextStatus = item.status === 'Activo' ? 'Inactivo' : 'Activo';
    if (activeTab === 'services') {
      const updated = await catalogService.updateService(item.id, {
        ...item,
        status: nextStatus,
      });
      setServices((prev) => prev.map((s) => (s.id === item.id ? updated : s)));
    } else {
      const updated = await catalogService.updatePromotion(item.id, {
        ...item,
        status: nextStatus,
      });
      setPromotions((prev) => prev.map((p) => (p.id === item.id ? updated : p)));
    }
    setConfirmState({ isOpen: false, type: null, item: null });
    showToast(`"${item.name}" marcado como ${nextStatus}.`);
  };

  const handleRequestDelete = (item) => {
    setOpenMenuId(null);
    setConfirmState({ isOpen: true, type: 'delete', item });
  };

  const executeDelete = async () => {
    const item = confirmState.item;
    if (!item) return;

    if (activeTab === 'services') {
      await catalogService.deleteService(item.id);
      setServices((prev) => prev.filter((s) => s.id !== item.id));
    } else {
      await catalogService.deletePromotion(item.id);
      setPromotions((prev) => prev.filter((p) => p.id !== item.id));
    }
    setConfirmState({ isOpen: false, type: null, item: null });
    showToast(`"${item.name}" eliminado correctamente.`);
  };

  return (
    <div
      className="w-full space-y-6"
      onClick={() => openMenuId !== null && setOpenMenuId(null)}
    >
      {feedbackBanner && (
        <div className="fixed bottom-6 right-6 z-40 bg-stone-900 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center gap-2.5 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackBanner}</span>
        </div>
      )}

      {/* Encabezado Superior */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="block mb-1 text-xs font-bold tracking-wider text-brand-primary">
            Catálogo
          </span>
          <h2 className="text-4xl font-bold tracking-tight text-stone-900">
            Servicios
          </h2>
          <p className="mt-1 text-sm text-stone-400">
            Organiza tu oferta, precios y promociones.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brand-accent to-brand-primary text-white text-xs font-bold shadow-button hover:opacity-95 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>
              {activeTab === 'services' ? 'Nuevo servicio' : 'Nueva promoción'}
            </span>
          </button>
        )}
      </div>

      {/* Pestañas */}
      <div className="flex items-center gap-8 border-b border-stone-200/80">
        <button
          type="button"
          onClick={() => {
            setActiveTab('services');
            setOpenMenuId(null);
          }}
          className={`pb-3.5 flex items-center gap-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'services'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-stone-400 hover:text-stone-700'
          }`}
        >
          <span>Servicios</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === 'services'
                ? 'bg-brand-soft/80 text-brand-primary'
                : 'bg-stone-100 text-stone-500'
            }`}
          >
            {filteredServices.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('promotions');
            setOpenMenuId(null);
          }}
          className={`pb-3.5 flex items-center gap-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'promotions'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-stone-400 hover:text-stone-700'
          }`}
        >
          <span>Paquetes y promociones</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === 'promotions'
                ? 'bg-brand-soft/80 text-brand-primary'
                : 'bg-stone-100 text-stone-500'
            }`}
          >
            {filteredPromotions.length}
          </span>
        </button>
      </div>

      {/* Buscador, Filtro y Selector de Vista */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 pt-1">
        <div className="flex flex-col items-stretch flex-1 gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute w-4 h-4 -translate-y-1/2 pointer-events-none text-stone-400 left-4 top-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre..."
              className="w-full py-3 pr-4 text-xs bg-white border pl-11 rounded-2xl border-stone-100 text-stone-700 placeholder:text-stone-300 shadow-2xs focus:outline-none focus:border-brand-light"
            />
          </div>

          <div className="relative inline-flex items-center">
            <Filter className="w-3.5 h-3.5 text-stone-500 absolute left-4 pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filtrar por tipo de servicio"
              className="py-3 pl-10 pr-8 text-xs font-semibold bg-white border appearance-none cursor-pointer rounded-2xl border-stone-100 text-stone-600 shadow-2xs focus:outline-none"
            >
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'Todas' ? 'Todos los filtros' : `Tipo: ${cat}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="inline-flex items-center p-1 rounded-2xl bg-[#F2EEF0] border border-stone-200/60 self-end md:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            title="Vista de lista"
            className={`p-2 rounded-xl transition-all ${
              viewMode === 'table'
                ? 'bg-white text-brand-primary shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Table2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            title="Vista de tarjetas"
            className={`p-2 rounded-xl transition-all ${
              viewMode === 'cards'
                ? 'bg-white text-brand-primary shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ==================== PESTAÑA 1: SERVICIOS ==================== */}
      {isLoading ? (
        <div className="py-16 text-xs text-center text-stone-400">
          Cargando catálogo...
        </div>
      ) : activeTab === 'services' ? (
        viewMode === 'cards' ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredServices.map((srv) => {
              const theme = CARD_THEMES[srv.theme] || CARD_THEMES['pink-scissors'];
              const ThemeIcon = theme.icon;
              const isActive = srv.status === 'Activo';

              return (
                <div
                  key={srv.id}
                  className="bg-white rounded-[28px] p-3.5 border border-stone-100/90 shadow-card flex items-stretch gap-4 relative hover:border-brand-light/50 transition-all"
                >
                  <div
                    className={`w-28 sm:w-32 rounded-[22px] ${theme.bg} p-4 flex flex-col justify-between relative overflow-hidden shrink-0 min-h-[148px]`}
                  >
                    <div
                      className={`w-16 h-16 rounded-full ${theme.circle} absolute -top-3 -right-3 pointer-events-none`}
                    />
                    <ThemeIcon className={`w-6 h-6 ${theme.text} relative z-10 mt-1`} />
                    <span
                      className={`text-[10px] font-bold tracking-[0.14em] uppercase ${theme.text} relative z-10`}
                    >
                      {srv.category}
                    </span>
                  </div>

                  <div className="flex flex-col justify-between flex-1 min-w-0 py-2 pr-2">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-bold leading-snug truncate text-stone-900">
                          {srv.name}
                        </h3>

                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenuId(openMenuId === srv.id ? null : srv.id)
                            }
                            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {openMenuId === srv.id && (
                            <div className="absolute right-0 top-7 w-44 bg-white rounded-2xl shadow-lg border border-stone-100 py-1.5 z-30 text-xs">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(srv)}
                                className="w-full px-3.5 py-2 text-left flex items-center gap-2 text-stone-700 hover:bg-surface-bg font-medium"
                              >
                                <Pencil className="w-3.5 h-3.5 text-brand-primary" />
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRequestToggleStatus(srv)}
                                className="w-full px-3.5 py-2 text-left flex items-center gap-2 text-stone-700 hover:bg-surface-bg font-medium"
                              >
                                <Power className="w-3.5 h-3.5 text-amber-600" />
                                {isActive ? 'Desactivar' : 'Activar'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="mt-1 text-xs text-stone-400 line-clamp-2">
                        {srv.description}
                      </p>
                    </div>

                    <div className="flex items-end justify-between gap-2 pt-3">
                      <span className="text-xl font-bold tracking-tight text-stone-900">
                        {formatCurrency(srv.price)}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRequestToggleStatus(srv)}
                        className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                          isActive
                            ? 'bg-[#E8F6F0] text-[#1E7E5A]'
                            : 'bg-stone-100 text-stone-500'
                        }`}
                      >
                        {srv.status}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* VISTA DE LISTA (TABLA) DE SERVICIOS CON BOTÓN DE DESACTIVAR */
          <div className="bg-white rounded-[28px] border border-stone-100/90 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-100 text-[11px] font-bold tracking-[0.12em] text-stone-400 uppercase">
                    <th className="py-5 pr-4 pl-7">SERVICIO</th>
                    <th className="px-4 py-5">DESCRIPCIÓN</th>
                    <th className="px-4 py-5">PRECIO</th>
                    <th className="px-4 py-5">CATEGORÍA</th>
                    <th className="px-4 py-5">ESTADO</th>
                    <th className="py-5 pl-4 text-right pr-7">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-stone-100">
                  {filteredServices.map((srv) => {
                    const isActive = srv.status === 'Activo';
                    return (
                      <tr key={srv.id} className="transition-colors hover:bg-surface-bg/60">
                        <td className="py-4 pr-4 pl-7">
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-2xl bg-[#FDECEF] flex items-center justify-center text-brand-primary shrink-0">
                              <Scissors className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-stone-900">
                              {srv.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-stone-500">{srv.description}</td>
                        <td className="px-4 py-4 text-sm font-bold text-stone-900">
                          {formatCurrency(srv.price)}
                        </td>
                        <td className="px-4 py-4">
                          <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[#FDECEF] text-brand-primary">
                            {srv.category}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => handleRequestToggleStatus(srv)}
                            className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
                              isActive
                                ? 'bg-[#E8F6F0] text-[#1E7E5A]'
                                : 'bg-stone-100 text-stone-500'
                            }`}
                          >
                            {srv.status}
                          </button>
                        </td>
                        <td className="py-4 pl-4 text-right pr-7">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleRequestToggleStatus(srv)}
                              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold inline-flex items-center gap-1 transition-colors ${
                                isActive
                                  ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                              title={isActive ? 'Desactivar servicio' : 'Activar servicio'}
                            >
                              <Power className="w-3.5 h-3.5" />
                              <span>{isActive ? 'Desactivar' : 'Activar'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(srv)}
                              className="p-2 transition-colors rounded-xl text-stone-400 hover:text-brand-primary hover:bg-brand-soft/40"
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* ==================== PESTAÑA 2: PAQUETES Y PROMOCIONES ==================== */
        viewMode === 'cards' ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPromotions.map((promo) => {
              const theme = CARD_THEMES[promo.theme] || CARD_THEMES['pink-scissors'];
              const ThemeIcon = theme.icon;
              const isActive = promo.status === 'Activo';

              return (
                <div
                  key={promo.id}
                  className="bg-white rounded-[28px] p-3.5 border border-stone-100/90 shadow-card flex items-stretch gap-4 relative hover:border-brand-light/50 transition-all"
                >
                  <div
                    className={`w-28 sm:w-32 rounded-[22px] ${theme.bg} p-4 flex flex-col justify-between relative overflow-hidden shrink-0 min-h-[156px]`}
                  >
                    <div
                      className={`w-16 h-16 rounded-full ${theme.circle} absolute -top-3 -right-3 pointer-events-none`}
                    />
                    <ThemeIcon className={`w-6 h-6 ${theme.text} relative z-10 mt-1`} />
                    <span
                      className={`text-[10px] font-bold tracking-[0.12em] uppercase leading-tight ${theme.text} relative z-10 line-clamp-2`}
                    >
                      {promo.serviceIncluded}
                    </span>
                  </div>

                  <div className="flex flex-col justify-between flex-1 min-w-0 py-2 pr-2">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-bold leading-snug truncate text-stone-900">
                          {promo.name}
                        </h3>

                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenuId(openMenuId === promo.id ? null : promo.id)
                            }
                            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {openMenuId === promo.id && (
                            <div className="absolute right-0 top-7 w-40 bg-white rounded-2xl shadow-lg border border-stone-100 py-1.5 z-30 text-xs">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(promo)}
                                className="w-full px-3.5 py-2 text-left flex items-center gap-2 text-stone-700 hover:bg-surface-bg font-medium"
                              >
                                <Pencil className="w-3.5 h-3.5 text-brand-primary" />
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRequestToggleStatus(promo)}
                                className="w-full px-3.5 py-2 text-left flex items-center gap-2 text-stone-700 hover:bg-surface-bg font-medium"
                              >
                                <Power className="w-3.5 h-3.5 text-amber-600" />
                                {isActive ? 'Desactivar' : 'Activar'}
                              </button>
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleRequestDelete(promo)}
                                  className="w-full px-3.5 py-2 text-left flex items-center gap-2 text-red-600 hover:bg-red-50 font-medium"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Eliminar
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="mt-1 text-xs text-stone-400 line-clamp-2">
                        {promo.description}
                      </p>
                    </div>

                    <div className="flex items-end justify-between gap-2 pt-3">
                      <div>
                        <span className="block text-xl font-bold leading-none tracking-tight text-stone-900">
                          {formatCurrency(promo.price)}
                        </span>
                        <span className="block text-[11px] text-stone-400 mt-1">
                          {formatPromoPeriod(promo.validFrom, promo.validUntil)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(promo)}
                        className="px-4 py-2 rounded-2xl bg-[#FADCE6] hover:bg-brand-light/60 text-brand-primary text-xs font-bold transition-colors"
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* VISTA DE LISTA (TABLA) DE PAQUETES Y PROMOCIONES CON BOTÓN DE DESACTIVAR */
          <div className="bg-white rounded-[28px] border border-stone-100/90 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-100 text-[11px] font-bold tracking-[0.12em] text-stone-400 uppercase">
                    <th className="py-5 pr-4 pl-7">PAQUETE / PROMOCIÓN</th>
                    <th className="px-4 py-5">SERVICIOS INCLUIDOS</th>
                    <th className="px-4 py-5">VIGENCIA</th>
                    <th className="px-4 py-5">PRECIO</th>
                    <th className="px-4 py-5">ESTADO</th>
                    <th className="py-5 pl-4 text-right pr-7">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-stone-100">
                  {filteredPromotions.map((promo) => {
                    const isActive = promo.status === 'Activo';
                    return (
                      <tr key={promo.id} className="transition-colors hover:bg-surface-bg/60">
                        <td className="py-4 pr-4 pl-7">
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-2xl bg-[#FDECEF] flex items-center justify-center text-brand-primary shrink-0">
                              <Sparkles className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="block text-sm font-bold text-stone-900">
                                {promo.name}
                              </span>
                              <span className="text-[11px] text-stone-400">
                                {promo.description}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[#FDECEF] text-brand-primary">
                            {promo.serviceIncluded}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-medium text-stone-500">
                          {formatPromoPeriod(promo.validFrom, promo.validUntil)}
                        </td>
                        <td className="px-4 py-4 text-sm font-bold text-stone-900">
                          {formatCurrency(promo.price)}
                        </td>
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => handleRequestToggleStatus(promo)}
                            className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
                              isActive
                                ? 'bg-[#E8F6F0] text-[#1E7E5A]'
                                : 'bg-stone-100 text-stone-500'
                            }`}
                          >
                            {promo.status}
                          </button>
                        </td>
                        <td className="py-4 pl-4 text-right pr-7">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleRequestToggleStatus(promo)}
                              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold inline-flex items-center gap-1 transition-colors ${
                                isActive
                                  ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                            >
                              <Power className="w-3.5 h-3.5" />
                              <span>{isActive ? 'Desactivar' : 'Activar'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(promo)}
                              className="px-3.5 py-1.5 rounded-xl bg-[#FADCE6] text-brand-primary text-xs font-bold hover:bg-brand-light/60 transition-colors"
                            >
                              Editar
                            </button>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => handleRequestDelete(promo)}
                                className="p-2 transition-colors rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Modal CRUD con selector de servicios y calendario de fecha */}
      <ServiceFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveModal}
        mode={activeTab === 'services' ? 'service' : 'promotion'}
        initialData={editingItem}
        lockedCategory={!isAdmin ? user?.specialtyCategory : null}
        isAdmin={isAdmin}
        existingItems={activeTab === 'services' ? services : promotions}
        availableServices={services}
      />

      {/* Modal de Confirmación para Eliminar o Activar/Desactivar */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, type: null, item: null })}
        onConfirm={
          confirmState.type === 'delete'
            ? executeDelete
            : () => executeToggleStatus(confirmState.item)
        }
        variant={confirmState.type === 'delete' ? 'danger' : 'status'}
        title={
          confirmState.type === 'delete'
            ? `¿Eliminar "${confirmState.item?.name}"?`
            : `¿Cambiar estado de "${confirmState.item?.name}"?`
        }
        message={
          confirmState.type === 'delete'
            ? 'Este registro se eliminará permanentemente del catálogo.'
            : `¿Estás seguro de que deseas marcar "${confirmState.item?.name}" como ${
                confirmState.item?.status === 'Activo' ? 'Inactivo' : 'Activo'
              }?`
        }
        confirmText={
          confirmState.type === 'delete' ? 'Sí, eliminar' : 'Sí, guardar cambio'
        }
      />
    </div>
  );
}