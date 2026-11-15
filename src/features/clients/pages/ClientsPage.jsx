import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  Clock,
  Sparkles,
  History,
  MoreHorizontal,
  LayoutGrid,
  Table2,
  Pencil,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../../context/useAuth';
import useIsMobile from '../../../utils/useIsMobile';
import { clientsService } from '../services/clientsService';
import ClientDetailModal from '../components/ClientDetailModal';
import ClientHistoryModal from '../components/ClientHistoryModal';
import ClientFormModal from '../components/ClientFormModal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { getCategoryTheme } from '../../../components/ui/categoryThemes';
import { getInitialsTheme } from '../../../components/ui/initialsThemes';

export default function ClientsPage() {
  const { user, isAdmin } = useAuth();

  const [viewMode, setViewMode] = useState('table');
  const isMobile = useIsMobile();
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('Todos');
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState('Todos');

  const [openMenuId, setOpenMenuId] = useState(null);

  // Estados de las 3 Modales
  const [selectedDetailClient, setSelectedDetailClient] = useState(null);
  const [selectedHistoryClient, setSelectedHistoryClient] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [clientToDelete, setClientToDelete] = useState(null);

  const [feedbackBanner, setFeedbackBanner] = useState('');

  const showToast = (msg) => {
    setFeedbackBanner(msg);
    setTimeout(() => setFeedbackBanner(''), 3200);
  };

  // Carga los clientes correspondientes al usuario logueado (o todos si es Admin)
  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true);
      try {
        const data = await clientsService.getClients({ user });
        setClients(data);
        setSelectedCategoryFilter('Todas');
        setSelectedEmployeeFilter('Todos');
      } finally {
        setIsLoading(false);
      }
    };
    if (user) fetchClients();
  }, [user]);

  // Opciones dinámicas para filtrar según el historial de servicio
    const categoryFilterOptions = useMemo(() => {
        if (!isAdmin && user?.specialtyCategory) {
        return user.specialtyCategory === 'Cabello'
            ? ['Todas', 'Cabello', 'Coloración']
            : ['Todas', user.specialtyCategory];
        }
        return [
        'Todas',
        'Cabello',
        'Coloración',
        'Uñas',
        'Mirada',
        'Maquillaje',
        'Facial',
        ];
    }, [isAdmin, user]);

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm);

      const matchesCategory =
        selectedCategoryFilter === 'Todas' ||
        client.lastCategory === selectedCategoryFilter ||
        client.visits?.some((v) => v.category === selectedCategoryFilter);

      const matchesEmployee =
        !isAdmin ||
        selectedEmployeeFilter === 'Todos' ||
        client.assignedEmployeeIds?.includes(Number(selectedEmployeeFilter)) ||
        client.visits?.some(
          (v) => v.employeeId === Number(selectedEmployeeFilter)
        );

      return matchesSearch && matchesCategory && matchesEmployee;
    });
  }, [
    clients,
    searchTerm,
    selectedCategoryFilter,
    selectedEmployeeFilter,
    isAdmin,
  ]);

  // ==================== HANDLERS CRUD ====================
  const handleOpenCreate = () => {
    setEditingClient(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (client) => {
    setEditingClient(client);
    setOpenMenuId(null);
    setIsFormModalOpen(true);
  };

  const handleSaveClient = async (formData) => {
    if (editingClient) {
      const updated = await clientsService.updateClient(
        editingClient.id,
        formData
      );
      setClients((prev) =>
        prev.map((c) => (c.id === editingClient.id ? updated : c))
      );
      showToast(`Datos de "${updated.name}" actualizados correctamente.`);
    } else {
      const created = await clientsService.createClient(formData, user);
      setClients((prev) => [created, ...prev]);
      showToast(`Cliente "${created.name}" registrado en el directorio.`);
    }
    setIsFormModalOpen(false);
    setEditingClient(null);
  };

  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;
    await clientsService.deleteClient(clientToDelete.id);
    setClients((prev) => prev.filter((c) => c.id !== clientToDelete.id));
    showToast(`Cliente "${clientToDelete.name}" eliminado.`);
    setClientToDelete(null);
  };

  return (
    <div
      className="responsive-page w-full space-y-6"
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
            Directorio
          </span>
          <h2 className="text-4xl font-bold tracking-tight text-stone-900">
            Clientes
          </h2>
          <p className="mt-1 text-sm text-stone-400">
            Consulta datos e historial de visitas.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center w-full gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brand-accent to-brand-primary text-white text-xs font-bold shadow-button hover:opacity-95 active:scale-[0.99] transition-all self-start sm:w-auto sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nuevo cliente</span>
        </button>
      </div>

      {/* Barra de Herramientas: Buscador + Filtros + Conmutador de Vista */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 pt-1">
        <div className="grid grid-cols-2 flex-1 min-w-0 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
          {/* Buscador por nombre, teléfono o correo */}
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

          {/* Filtro por Historial de Categoría */}
            <div className="relative inline-flex items-center min-w-0">
                <Filter className="w-3.5 h-3.5 text-stone-500 absolute left-3 sm:left-4 pointer-events-none" />
                <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                aria-label="Filtrar por categoría"
                className="w-full min-w-0 min-h-[40px] py-2 sm:py-3 pl-8 sm:pl-10 pr-3 sm:pr-8 text-xs font-semibold bg-white border appearance-none cursor-pointer rounded-xl sm:rounded-2xl border-stone-100 text-stone-600 shadow-2xs focus:outline-none sm:w-auto"
                >
                {categoryFilterOptions.map((cat) => (
                    <option key={cat} value={cat}>
                    {cat === 'Todas' ? 'Todos los filtros' : `Categoría: ${cat}`}
                    </option>
                ))}
                </select>
            </div>

          {/* Filtro adicional para Admin: filtrar por Especialista */}
          {isAdmin && (
            <select
              value={selectedEmployeeFilter}
              onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
              aria-label="Filtrar por especialista"
              className="w-full min-w-0 min-h-[40px] px-3 sm:px-4 py-2 sm:py-3 text-xs font-semibold bg-white border cursor-pointer rounded-xl sm:rounded-2xl border-stone-100 text-stone-600 shadow-2xs focus:outline-none sm:w-auto"
            >
              <option value="Todos">Especialista: Todas</option>
              <option value="2">Atendidos por: Mariana Silva</option>
              <option value="3">Atendidos por: Camila Torres</option>
            </select>
          )}
        </div>

        {/* Conmutador de Vista (Tabla / Card) */}
        <div className="hidden sm:inline-flex items-center p-1 rounded-2xl bg-[#F2EEF0] border border-stone-200/60 self-end md:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            title="Vista de tabla"
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

      {/* ==================== CONTENIDO DE CLIENTES ==================== */}
      {isLoading ? (
        <div className="py-16 text-xs text-center text-stone-400">
          Cargando directorio de clientes...
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="bg-white rounded-[28px] p-12 text-center border border-stone-100 shadow-card">
          <p className="text-sm font-bold text-stone-700">
            No se encontraron clientes con los filtros seleccionados
          </p>
        </div>
      ) : !isMobile && viewMode === 'table' ? (
        /* ==================== VISTA 1: TABLA  ==================== */
        <div className="bg-white rounded-[28px] border border-stone-100/90 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse ">
              <thead>
                <tr className="border-b border-stone-100 text-[11px] font-bold tracking-[0.12em] text-stone-400 uppercase">
                  <th className="py-5 pr-4 pl-7">CLIENTE</th>
                  <th className="px-4 py-5">TELÉFONO</th>
                  <th className="px-4 py-5">CORREO</th>
                  <th className="px-4 py-5">ÚLTIMO SERVICIO</th>
                  <th className="px-4 py-5">ÚLTIMA VISITA</th>
                  <th className="px-4 py-5 pr-7">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-stone-100">
                {filteredClients.map((client) => {
                  const theme = getCategoryTheme(client.lastCategory);
                  const initialsTheme = getInitialsTheme(client.id || client.name);
                  return (
                  <tr
                    key={client.id}
                    onClick={() => setSelectedDetailClient(client)}
                    className="transition-colors cursor-pointer hover:bg-surface-bg/60"
                  >
                    <td className="py-4 pr-4 pl-7">
                      <div className="flex items-center gap-3.5">
                        <div className={`w-10 h-10 rounded-full ${initialsTheme.background} border-2 border-white flex items-center justify-center ${initialsTheme.text} font-bold text-xs shrink-0`}>
                          {client.initials}
                        </div>
                        <span className="text-sm font-bold text-stone-900">
                          {client.name}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-stone-500">{client.phone}</td>

                    <td className="px-4 py-4 text-stone-500">{client.email}</td>

                    <td className="px-4 py-4">
                      <span className={`px-3.5 py-1 rounded-full text-[11px] font-semibold ${theme.bg} ${theme.text}`}>
                        {client.lastService}
                      </span>
                    </td>

                    <td className="px-4 py-4 font-medium text-stone-500">
                      {client.lastVisitFormatted}
                    </td>

                    {/* Botones de acción */}
                    <td
                      className="py-4 pl-4 pr-7"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center gap-1.5">
                        
                        <button
                          type="button"
                          onClick={() => setSelectedHistoryClient(client)}
                          className="px-3 py-1.5 rounded-xl bg-surface-bg hover:bg-brand-soft/60 text-brand-primary text-xs font-bold inline-flex items-center gap-1.5 border border-stone-200/70 transition-colors"
                          title="Ver historial completo de visitas"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>Historial</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(client)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#FADCE6] text-brand-primary text-xs font-bold hover:bg-brand-light/60 inline-flex items-center gap-1.5 transition-colors"
                          title="Editar cliente"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => setClientToDelete(client)}
                            className="p-2 transition-colors rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50"
                            title="Eliminar cliente"
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
      ) : (
        /* ==================== VISTA 2: TARJETAS / CARDS ==================== */
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => {
            const theme = getCategoryTheme(client.lastCategory);
            const initialsTheme = getInitialsTheme(client.id || client.name);
            return (
            <div
              key={client.id}
              onClick={() => setSelectedDetailClient(client)}
              className="bg-white rounded-[30px] p-7 border border-stone-100/90 shadow-card flex flex-col relative hover:border-brand-light/50 transition-all cursor-pointer"
            >
              {/* Menú en esquina superior derecha */}
              <div
                className="absolute top-5 right-6"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenMenuId(openMenuId === client.id ? null : client.id)
                  }
                  className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                  aria-label="Opciones del cliente"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {openMenuId === client.id && (
                  <div className="absolute right-0 top-8 w-44 bg-white rounded-2xl shadow-lg border border-stone-100 py-1.5 z-30 text-xs text-left">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenMenuId(null);
                        setSelectedHistoryClient(client);
                      }}
                      className="w-full px-3.5 py-2 flex items-center gap-2 text-stone-700 hover:bg-surface-bg font-medium"
                    >
                      <History className="w-3.5 h-3.5 text-brand-primary" />
                      Ver historial
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(client)}
                      className="w-full px-3.5 py-2 flex items-center gap-2 text-stone-700 hover:bg-surface-bg font-medium"
                    >
                      <Pencil className="w-3.5 h-3.5 text-brand-primary" />
                      Editar cliente
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          setClientToDelete(client);
                        }}
                        className="w-full px-3.5 py-2 flex items-center gap-2 text-red-600 hover:bg-red-50 font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Eliminar
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Encabezado */}
              <div className="flex flex-col items-center pb-5 text-center border-b border-stone-100">
                <div className={`w-20 h-20 rounded-full ${initialsTheme.background} border-4 border-white flex items-center justify-center ${initialsTheme.text} font-bold text-xl mb-3.5`}>
                  {client.initials}
                </div>
                <h3 className="text-lg font-bold tracking-tight text-stone-900">
                  {client.name}
                </h3>
              </div>

              {/* Apartado de Información General  */}
              <div className="flex-1 pt-5 space-y-3 text-xs text-stone-500">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-brand-primary shrink-0" />
                  <span>{client.phone}</span>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-brand-primary shrink-0" />
                  <span className="truncate">{client.email}</span>
                </div>

                {/* Historial  */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-brand-primary shrink-0" />
                    <span className="text-stone-400">Último servicio:</span>
                  </div>
                  <span className={`px-3 py-0.5 rounded-full text-[11px] font-semibold ${theme.bg} ${theme.text}`}>
                    {client.lastService}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-brand-primary shrink-0" />
                  <span>{client.lastVisitFormatted}</span>
                </div>
              </div>

              {/* Botón inferior para abrir el Historial de Servicios / Visitas */}
              <div
                className="flex items-center justify-between gap-2 pt-5 mt-5 border-t border-stone-100"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setSelectedHistoryClient(client)}
                  className="w-full py-2.5 px-4 rounded-2xl bg-[#FAF6F7] hover:bg-[#FADCE6] text-brand-primary text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Ver historial de visitas</span>
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Modal 1: Información General del Cliente + Resumen de los últimos 3 servicios */}
      <ClientDetailModal
        client={selectedDetailClient}
        isOpen={Boolean(selectedDetailClient)}
        onClose={() => setSelectedDetailClient(null)}
        onEdit={handleOpenEdit}
        onOpenFullHistory={(client) => setSelectedHistoryClient(client)}
      />

      {/* Modal 2: Historial Completo de Servicios y Visitas */}
      <ClientHistoryModal
        client={selectedHistoryClient}
        isOpen={Boolean(selectedHistoryClient)}
        onClose={() => setSelectedHistoryClient(null)}
      />

      {/* Modal 3: Formulario Crear / Editar Cliente */}
      <ClientFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingClient(null);
        }}
        onSave={handleSaveClient}
        initialData={editingClient}
        existingClients={clients}
        isAdmin={isAdmin}
      />

      {/* Modal 4: Confirmación para Eliminar */}
      <ConfirmDialog
        isOpen={Boolean(clientToDelete)}
        onClose={() => setClientToDelete(null)}
        onConfirm={handleConfirmDelete}
        variant="danger"
        title={`¿Eliminar a "${clientToDelete?.name}"?`}
        message="Este cliente y su expediente se eliminarán del directorio."
        confirmText="Sí, eliminar cliente"
      />
    </div>
  );
}