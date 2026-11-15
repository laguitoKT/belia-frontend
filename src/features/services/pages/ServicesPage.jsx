import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  LayoutGrid,
  Table2,
  Pencil,
  Power,
  Trash2,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../../context/useAuth';
import useIsMobile from '../../../utils/useIsMobile';
import { catalogService } from '../services/catalogService';
import ServiceFormModal from '../components/ServiceFormModal';
import CatalogDetailModal from '../components/CatalogDetailModal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { getThemeByKey } from '../../../components/ui/categoryThemes';
import { parseLocalDate } from '../../../utils/dateUtils';

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value);

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
  const isMobile = useIsMobile();

  const [services, setServices] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [operationError, setOperationError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [openMenuId, setOpenMenuId] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);

  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    type: null,
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
      setLoadError('');
      try {
        const [srvData, promoData] = await Promise.all([
          catalogService.getServices({ user }),
          catalogService.getPromotions({ user }),
        ]);
        setServices(srvData);
        setPromotions(promoData);
        setSelectedCategory('Todas');
      } catch (error) {
        console.error('Error al cargar el catálogo:', error);
        setLoadError('No se pudo cargar el catálogo. Revisa la conexión y vuelve a intentarlo.');
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
    setOperationError('');
    try {
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
    } catch (error) {
      console.error('Error al guardar el catálogo:', error);
      setOperationError('No se pudo confirmar el guardado. Recarga el catálogo antes de volver a intentarlo.');
    }
  };

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
    setOperationError('');
    try {
      if (activeTab === 'services') {
        const updated = await catalogService.updateService(item.id, { status: nextStatus });
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
    } catch (error) {
      console.error('Error al actualizar el estado:', error);
      setOperationError('No se pudo confirmar el cambio de estado. Recarga el catálogo antes de volver a intentarlo.');
    }
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
      className="responsive-page w-full space-y-6"
      onClick={() => openMenuId !== null && setOpenMenuId(null)}
    >
      {operationError && (
        <div role="alert" className="fixed top-6 right-6 z-[70] max-w-md rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 shadow-lg">
          {operationError}
          <button type="button" onClick={() => setOperationError('')} className="ml-3 font-bold">
            Cerrar
          </button>
        </div>
      )}
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
            className="inline-flex items-center justify-center w-full gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brand-accent to-brand-primary text-white text-xs font-bold shadow-button hover:opacity-95 transition-all self-start sm:w-auto sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>
              {activeTab === 'services' ? 'Nuevo servicio' : 'Nueva promoción'}
            </span>
          </button>
        )}
      </div>

      {/* Pestañas */}
      <div className="flex items-center gap-4 overflow-x-auto border-b sm:gap-8 border-stone-200/80">
        <button
          type="button"
          onClick={() => {
            setActiveTab('services');
            setOpenMenuId(null);
          }}
          className={`pb-3.5 flex shrink-0 items-center gap-2 text-xs font-bold border-b-2 transition-all ${
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
          className={`pb-3.5 flex shrink-0 items-center gap-2 text-xs font-bold border-b-2 transition-all ${
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
        <div className="grid grid-cols-2 flex-1 min-w-0 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
          <div className="relative col-span-2 w-full sm:max-w-md">
            <Search className="absolute w-4 h-4 -translate-y-1/2 pointer-events-none text-stone-400 left-4 top-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre..."
              className="w-full py-2.5 sm:py-3 pr-4 text-xs bg-white border pl-11 rounded-xl sm:rounded-2xl border-stone-100 text-stone-700 placeholder:text-stone-300 shadow-2xs focus:outline-none focus:border-brand-light"
            />
          </div>

          <div className="relative inline-flex items-center min-w-0">
            <Filter className="w-3.5 h-3.5 text-stone-500 absolute left-3 sm:left-4 pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filtrar por tipo de servicio"
              className="w-full min-w-0 min-h-[40px] py-2 sm:py-3 pl-8 sm:pl-10 pr-3 sm:pr-8 text-xs font-semibold bg-white border appearance-none cursor-pointer rounded-xl sm:rounded-2xl border-stone-100 text-stone-600 shadow-2xs focus:outline-none sm:w-auto"
            >
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'Todas' ? 'Todos los filtros' : `Tipo: ${cat}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="hidden sm:inline-flex items-center p-1 rounded-2xl bg-[#F2EEF0] border border-stone-200/60 self-end md:self-auto">
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
      ) : loadError ? (
        <div role="alert" className="py-16 text-sm text-center text-red-600">
          {loadError}
        </div>
      ) : activeTab === 'services' ? (
        isMobile || viewMode === 'cards' ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredServices.map((srv) => {
              const theme = getThemeByKey(srv.theme);
              const ThemeIcon = theme.icon;
              const isActive = srv.status === 'Activo';
              return (
                // Tarjeta de servicios 
                <div
                  key={srv.id}
                  onClick={() => setSelectedDetailItem(srv)}
                  className="cursor-pointer bg-white rounded-[28px] p-3.5 border border-stone-100/90 shadow-card flex items-stretch gap-4 relative hover:border-brand-light/50 transition-all"
                >
                  <div
                    className={`w-20 sm:w-32 rounded-[22px] ${theme.bg} p-3 sm:p-4 flex flex-col justify-between relative overflow-hidden shrink-0 min-h-[148px]`}
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
                            aria-label="Opciones del servicio"
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


                    <div className="flex flex-wrap items-end justify-between gap-2 pt-3">
                      <div>
                        <span className="block text-xl font-bold leading-none tracking-tight text-stone-900">
                          {formatCurrency(srv.price)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-stone-400 mt-1">
                          <Clock className="w-3 h-3" />
                          {srv.durationMinutes} min
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRequestToggleStatus(srv);
                        }}
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
          /* VISTA DE LISTA (TABLA) DE SERVICIOS*/
          <div className="bg-white rounded-[28px] border border-stone-100/90 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full !min-w-0 sm:!min-w-[800px] lg:!min-w-0 table-fixed sm:table-auto text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-100 text-[11px] font-bold tracking-[0.12em] text-stone-400 uppercase">
                    <th className="py-4 pl-3 pr-1 sm:py-5 sm:pr-4 sm:pl-7">SERVICIO</th>
                    <th className="hidden px-4 py-5 sm:table-cell">DESCRIPCIÓN</th>
                    <th className="w-[66px] px-1 py-4 sm:w-auto sm:px-4 sm:py-5">PRECIO</th>
                    <th className="hidden px-4 py-5 sm:table-cell">DURACIÓN</th>
                    <th className="hidden px-4 py-5 sm:table-cell">CATEGORÍA</th>
                    <th className="hidden px-4 py-5 sm:table-cell">ESTADO</th>
                    <th className="w-[88px] py-4 pl-1 pr-3 text-right sm:w-auto sm:py-5 sm:pl-4 sm:pr-7">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-stone-100">
                  {filteredServices.map((srv) => {
                    const theme = getThemeByKey(srv.theme);
                    const ThemeIcon = theme.icon;
                    const isActive = srv.status === 'Activo';
                    return (
                      // Fila de servicio en la tabla
                      <tr key={srv.id} 
                      onClick={() => setSelectedDetailItem(srv)}
                      className="transition-colors cursor-pointer hover:bg-surface-bg/60">
                        <td className="py-3 pl-3 pr-1 sm:py-4 sm:pr-4 sm:pl-7">
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className={`w-10 h-10 rounded-2xl ${theme.bg} ${theme.text} hidden sm:flex items-center justify-center shrink-0`}>
                              <ThemeIcon className="w-4 h-4" />
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDetailItem(srv);
                              }}
                              className="min-w-0 text-left text-sm font-bold text-stone-900 [overflow-wrap:anywhere] sm:[overflow-wrap:normal]"
                            >
                              {srv.name}
                            </button>
                          </div>
                        </td>
                        <td className="hidden px-4 py-4 text-stone-500 sm:table-cell">{srv.description}</td>
                        <td className="px-1 py-3 text-xs font-bold break-all text-stone-900 sm:px-4 sm:py-4 sm:text-sm sm:break-normal">
                          {formatCurrency(srv.price)}
                        </td>
                        <td className="hidden px-4 py-4 font-medium text-stone-500 sm:table-cell">
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-stone-400" />
                            {srv.durationMinutes} min
                          </span>
                        </td>

                        <td className="hidden px-4 py-4 sm:table-cell">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${theme.bg} ${theme.text}`}>
                            {srv.category}
                          </span>
                        </td>
                        
                        <td
                          className="hidden px-4 py-4 sm:table-cell"
                          onClick={(e) => e.stopPropagation()}
                        >
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
                        <td 
                          className="py-3 pl-1 pr-3 text-right sm:py-4 sm:pl-4 sm:pr-7"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="inline-flex items-center gap-0 sm:gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleRequestToggleStatus(srv)}
                              className={`w-9 h-9 sm:w-auto sm:h-auto sm:px-2.5 sm:py-1.5 rounded-xl text-[11px] font-bold inline-flex items-center justify-center gap-1 transition-colors ${
                                isActive
                                  ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                              title={isActive ? 'Desactivar servicio' : 'Activar servicio'}
                              aria-label={isActive ? 'Desactivar servicio' : 'Activar servicio'}
                            >
                              <Power className="w-3.5 h-3.5" />
                              <span className="sr-only sm:not-sr-only">{isActive ? 'Desactivar' : 'Activar'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(srv)}
                              className="inline-flex items-center justify-center w-9 h-9 sm:w-auto sm:h-auto sm:p-2 transition-colors rounded-xl text-stone-400 hover:text-brand-primary hover:bg-brand-soft/40"
                              title="Editar"
                              aria-label="Editar servicio"
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
        isMobile || viewMode === 'cards' ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPromotions.map((promo) => {
              const theme = getThemeByKey(promo.theme);
              const ThemeIcon = theme.icon;
              const isActive = promo.status === 'Activo';

              return (
                <div
                  key={promo.id}
                  onClick={() => setSelectedDetailItem(promo)}
                  className=" cursor-pointer bg-white rounded-[28px] p-3.5 border border-stone-100/90 shadow-card flex items-stretch gap-4 relative hover:border-brand-light/50 transition-all"
                >
                  <div
                    className={`w-20 sm:w-32 rounded-[22px] ${theme.bg} p-3 sm:p-4 flex flex-col justify-between relative overflow-hidden shrink-0 min-h-[156px]`}
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
                            aria-label="Opciones de la promoción"
                            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {openMenuId === promo.id && (
                            <div className="absolute right-0 top-7 w-40 bg-white rounded-2xl shadow-lg border border-stone-100 py-1.5 z-30 text-xs">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEdit(promo);
                                }}
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

                    <div className="flex flex-wrap items-end justify-between gap-2 pt-3">
                      <div>
                        <span className="block text-xl font-bold leading-none tracking-tight text-stone-900">
                          {formatCurrency(promo.price)}
                        </span>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-400 mt-1">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {promo.durationMinutes || 60} min
                          </span>
                          <span>•</span>
                          <span>
                            {formatPromoPeriod(promo.validFrom, promo.validUntil)}
                          </span>
                        </div>
                      </div>


                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* VISTA DE LISTA (TABLA) DE PAQUETES Y PROMOCIONES*/
          <div className="bg-white rounded-[28px] border border-stone-100/90 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full !min-w-0 sm:!min-w-[800px] lg:!min-w-0 table-fixed sm:table-auto text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-100 text-[11px] font-bold tracking-[0.12em] text-stone-400 uppercase">
                    <th className="py-4 pl-3 pr-1 sm:py-5 sm:pr-4 sm:pl-7">PAQUETE / PROMOCIÓN</th>
                    <th className="hidden px-4 py-5 sm:table-cell">SERVICIOS INCLUIDOS</th>
                    <th className="hidden px-4 py-5 sm:table-cell">VIGENCIA</th>
                    <th className="hidden px-4 py-5 sm:table-cell">DURACIÓN</th>
                    <th className="w-[66px] px-1 py-4 sm:w-auto sm:px-4 sm:py-5">PRECIO</th>
                    <th className="hidden px-4 py-5 sm:table-cell">ESTADO</th>
                    <th className="w-[124px] py-4 pl-1 pr-3 text-right sm:w-auto sm:py-5 sm:pl-4 sm:pr-7">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-stone-100">
                  {filteredPromotions.map((promo) => {
                    const theme = getThemeByKey(promo.theme);
                    const ThemeIcon = theme.icon;
                    const isActive = promo.status === 'Activo';
                    return (
                      // Fila de promoción en la tabla
                      <tr 
                        onClick={() => setSelectedDetailItem(promo)}
                        key={promo.id}
                        className="transition-colors cursor-pointer hover:bg-surface-bg/60">
                        <td className="py-3 pl-3 pr-1 sm:py-4 sm:pr-4 sm:pl-7">
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className={`w-10 h-10 rounded-2xl ${theme.bg} ${theme.text} hidden sm:flex items-center justify-center shrink-0`}>
                              <ThemeIcon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDetailItem(promo);
                                }}
                                className="block text-left text-sm font-bold text-stone-900 [overflow-wrap:anywhere] sm:[overflow-wrap:normal]"
                              >
                                {promo.name}
                              </button>
                              <span className="hidden sm:inline text-[11px] text-stone-400">
                                {promo.description}
                              </span>
                            </div>
                          </div>
                        </td>
                        
                        <td className="hidden px-4 py-4 text-ellipsis overflow-hidden whitespace-nowrap max-w-[200px] sm:table-cell">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${theme.bg} ${theme.text}`}>
                            {promo.serviceIncluded}
                          </span>
                        </td>

                        <td className="hidden px-4 py-4 font-medium text-center text-stone-500 sm:table-cell">
                          {formatPromoPeriod(promo.validFrom, promo.validUntil)}
                        </td>

                        <td className="hidden px-4 py-4 font-medium text-stone-500 sm:table-cell">
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-stone-400" />
                            {promo.durationMinutes || 60} min
                          </span>
                        </td>

                        <td className="px-1 py-3 text-xs font-bold break-all text-stone-900 sm:px-4 sm:py-4 sm:text-sm sm:break-normal">
                          {formatCurrency(promo.price)}
                        </td>

                        <td className="hidden px-4 py-4 sm:table-cell">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRequestToggleStatus(promo);
                            }}
                            className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
                              isActive
                                ? 'bg-[#E8F6F0] text-[#1E7E5A]'
                                : 'bg-stone-100 text-stone-500'
                            }`}
                          >
                            {promo.status}
                          </button>
                        </td>
                        <td
                          className="py-3 pl-1 pr-3 text-right sm:py-4 sm:pl-4 sm:pr-7"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="inline-flex items-center gap-0 sm:gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRequestToggleStatus(promo);
                              }}
                              className={`w-9 h-9 sm:w-auto sm:h-auto sm:px-2.5 sm:py-1.5 rounded-xl text-[11px] font-bold inline-flex items-center justify-center gap-1 transition-colors ${
                                isActive
                                  ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                              aria-label={isActive ? 'Desactivar promoción' : 'Activar promoción'}
                            >
                              <Power className="w-3.5 h-3.5" />
                              <span className="sr-only sm:not-sr-only">{isActive ? 'Desactivar' : 'Activar'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEdit(promo);
                              }}
                              className="inline-flex items-center justify-center w-9 h-9 sm:w-auto sm:h-auto sm:px-3.5 sm:py-1.5 rounded-xl bg-[#FADCE6] text-brand-primary text-xs font-bold hover:bg-brand-light/60 transition-colors"
                              aria-label="Editar promoción"
                            >
                              <Pencil className="w-4 h-4 sm:hidden" />
                              <span className="sr-only sm:not-sr-only">Editar</span>
                            </button>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRequestDelete(promo);
                                }}
                                className="inline-flex items-center justify-center w-9 h-9 sm:w-auto sm:h-auto sm:p-2 transition-colors rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50"
                                title="Eliminar"
                                aria-label="Eliminar promoción"
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

      <CatalogDetailModal
        item={selectedDetailItem}
        mode={activeTab === 'services' ? 'service' : 'promotion'}
        isOpen={Boolean(selectedDetailItem)}
        onClose={() => setSelectedDetailItem(null)}
        onEdit={handleOpenEdit}
        onToggleStatus={handleRequestToggleStatus}
        formatCurrency={formatCurrency}
        formatPromoPeriod={formatPromoPeriod}
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