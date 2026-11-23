import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  Clock,
  History,
  MoreHorizontal,
  LayoutGrid,
  Table2,
  Pencil,
  Trash2,
  CheckCircle2,
  Power,
} from 'lucide-react';
import { employeesService } from '../services/employeesService';
import EmployeeDetailModal from '../components/EmployeeDetailModal';
import EmployeeHistoryModal from '../components/EmployeeHistoryModal';
import EmployeeFormModal from '../components/EmployeeFormModal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { getCategoryTheme } from '../../../components/ui/categoryThemes';
import { getInitialsTheme } from '../../../components/ui/initialsThemes';
import useIsMobile from '../../../utils/useIsMobile';

const CATEGORY_FILTER_OPTIONS = [
  'Todas',
  'Cabello',
  'Coloración',
  'Uñas',
  'Mirada',
  'Maquillaje',
  'Facial',
];

export default function EmployeesPage() {
  const [viewMode, setViewMode] = useState('table');
  const isMobile = useIsMobile();
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [openMenuId, setOpenMenuId] = useState(null);

  // Estados de las Modales
  const [selectedDetailEmployee, setSelectedDetailEmployee] = useState(null);
  const [selectedHistoryEmployee, setSelectedHistoryEmployee] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  // Confirmación para Eliminar o Activar/Desactivar
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    type: null,
    employee: null,
  });

  const [feedbackBanner, setFeedbackBanner] = useState('');

  const showToast = (msg) => {
    setFeedbackBanner(msg);
    setTimeout(() => setFeedbackBanner(''), 3200);
  };

  useEffect(() => {
    const fetchEmployees = async () => {
      setIsLoading(true);
      try {
        const data = await employeesService.getEmployees();
        setEmployees(data);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.phone.includes(searchTerm) ||
        emp.specialty.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === 'Todas' ||
        emp.specialtyCategory === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [employees, searchTerm, selectedCategory]);

  // ==================== HANDLERS CRUD ====================
  const handleOpenCreate = () => {
    setEditingEmployee(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (emp) => {
    setEditingEmployee(emp);
    setOpenMenuId(null);
    setIsFormModalOpen(true);
  };

  const handleSaveEmployee = async (formData) => {
    if (editingEmployee) {
      const updated = await employeesService.updateEmployee(
        editingEmployee.id,
        formData
      );
      setEmployees((prev) =>
        prev.map((emp) => (emp.id === editingEmployee.id ? updated : emp))
      );
      showToast(`Datos de "${updated.name}" actualizados.`);
    } else {
      const created = await employeesService.createEmployee(formData);
      setEmployees((prev) => [created, ...prev]);
      showToast(`Empleado "${created.name}" agregado al equipo.`);
    }
    setIsFormModalOpen(false);
    setEditingEmployee(null);
  };

  const handleRequestToggleActive = (emp) => {
    setOpenMenuId(null);
    setConfirmState({
      isOpen: true,
      type: 'toggle-status',
      employee: emp,
    });
  };

  const executeToggleActive = async () => {
    const emp = confirmState.employee;
    if (!emp) return;
    const updated = await employeesService.updateEmployee(emp.id, {
      ...emp,
      active: !emp.active,
    });
    setEmployees((prev) =>
      prev.map((item) => (item.id === emp.id ? updated : item))
    );
    setConfirmState({ isOpen: false, type: null, employee: null });
    showToast(
      `"${emp.name}" marcado como ${updated.active ? 'Activo' : 'Inactivo'}.`
    );
  };

  const executeDelete = async () => {
    const emp = confirmState.employee;
    if (!emp) return;
    await employeesService.deleteEmployee(emp.id);
    setEmployees((prev) => prev.filter((item) => item.id !== emp.id));
    setConfirmState({ isOpen: false, type: null, employee: null });
    showToast(`Empleado "${emp.name}" eliminado.`);
  };

  return (
    <div
      className="w-full space-y-6 responsive-page"
      onClick={() => openMenuId !== null && setOpenMenuId(null)}
    >
      {feedbackBanner && (
        <div className="fixed bottom-6 right-6 z-40 bg-stone-900 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center gap-2.5 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackBanner}</span>
        </div>
      )}

      {/* Encabezado Superior*/}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="block mb-1 text-xs font-bold tracking-wider text-brand-primary">
            Equipo
          </span>
          <h2 className="text-4xl font-bold tracking-tight text-stone-900">
            Empleados
          </h2>
          <p className="mt-1 text-sm text-stone-400">
            Administra especialistas, horarios y contacto.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center w-full gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brand-accent to-brand-primary text-white text-xs font-bold shadow-button hover:opacity-95 active:scale-[0.99] transition-all self-start sm:w-auto sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nuevo empleado</span>
        </button>
      </div>

      {/* Barra de Herramientas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 pt-1">
        <div className="grid flex-1 min-w-0 grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
          <div className="relative w-full col-span-2 sm:max-w-md">
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
              aria-label="Filtrar por área de especialidad"
              className="w-full min-w-0 min-h-[40px] py-2 sm:py-3 pl-8 sm:pl-10 pr-3 sm:pr-8 text-xs font-semibold bg-white border appearance-none cursor-pointer rounded-xl sm:rounded-2xl border-stone-100 text-stone-600 shadow-2xs focus:outline-none sm:w-auto"
            >
              {CATEGORY_FILTER_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'Todas' ? 'Todos los filtros' : `Área: ${cat}`}
                </option>
              ))}
            </select>
          </div>
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

      {/* ==================== CONTENIDO DE EMPLEADOS ==================== */}
      {isLoading ? (
        <div className="py-16 text-xs text-center text-stone-400">
          Cargando equipo de especialistas...
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="bg-white rounded-[28px] p-12 text-center border border-stone-100 shadow-card">
          <p className="text-sm font-bold text-stone-700">
            No se encontraron empleados con los filtros seleccionados
          </p>
        </div>
      ) : !isMobile && viewMode === 'table' ? (
        /* ==================== VISTA 1: TABLA ==================== */
        <div className="bg-white rounded-[28px] border border-stone-100/90 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-100 text-[11px] font-bold tracking-[0.12em] text-stone-400 uppercase">
                  <th className="py-5 pr-4 pl-7">EMPLEADO</th>
                  <th className="px-4 py-5">TELÉFONO</th>
                  <th className="px-4 py-5">CORREO</th>
                  <th className="px-4 py-5">ESPECIALIDAD</th>
                  <th className="px-4 py-5">HORARIO</th>
                  <th className="py-5 pl-4 text-right pr-7">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-stone-100">
                {filteredEmployees.map((emp) => {
                  const isActive = emp.active !== false;
                  const theme = getCategoryTheme(emp.specialtyCategory);
                  const initialsTheme = getInitialsTheme(emp.id || emp.name);
                  return (
                    <tr
                      key={emp.id}
                      onClick={() => setSelectedDetailEmployee(emp)}
                      className={`hover:bg-surface-bg/60 transition-colors cursor-pointer ${
                        !isActive ? 'opacity-65' : ''
                      }`}
                    >
                      <td className="py-4 pr-4 pl-7">
                        <div className="flex items-center gap-3.5">
                          <div className={`w-10 h-10 rounded-full ${initialsTheme.background} border-2 border-white flex items-center justify-center ${initialsTheme.text} font-bold text-xs shrink-0`}>
                            {emp.initials}
                          </div>
                          <span className="block min-w-0 max-w-[150px] xl:max-w-[220px] text-sm font-bold text-stone-900 line-clamp-2 break-words leading-tight">
                            {emp.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-stone-500">{emp.phone}</td>

                      <td className="px-4 py-4 text-stone-500">{emp.email}</td>

                      <td className="px-4 py-4">
                        <span className={`block min-w-0 max-w-[150px] xl:max-w-[220px] text-[11px] font-bold line-clamp-2 text-center break-words leading-tight rounded-full py-1 ${theme.bg} ${theme.text}`}>
                          {emp.specialty}
                        </span>
                      </td>

                      <td className="px-4 py-4 font-medium text-stone-500">
                        {emp.scheduleFormatted}
                      </td>

                      <td
                        className="py-4 pl-4 text-right pr-7"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedHistoryEmployee(emp)}
                            className="px-3 py-1.5 rounded-xl bg-brand-accent/20 hover:bg-brand-soft/60 text-brand-primary text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                            title="Ver historial de servicios realizados"
                          >
                            <History className="w-3.5 h-3.5" />
                            <span>Historial</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRequestToggleActive(emp)}
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
                            onClick={() => handleOpenEdit(emp)}
                            className="px-3.5 py-1.5 rounded-xl bg-[#F3EEFC] text-[#4b3179] text-xs font-bold hover:bg-[#E0D7F5] inline-flex items-center gap-1.5 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setConfirmState({
                                isOpen: true,
                                type: 'delete',
                                employee: emp,
                              })
                            }
                            className="p-2 transition-colors rounded-xl text-stone-400 hover:text-brand-primary hover:bg-red-50"
                            title="Eliminar empleado"
                          >
                            <Trash2 className="w-4 h-4" />
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
      ) : (
        /* ==================== VISTA 2: TARJETAS / CARDS  ==================== */
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEmployees.map((emp) => {
            const isActive = emp.active !== false;
            const theme = getCategoryTheme(emp.specialtyCategory);
            const initialsTheme = getInitialsTheme(emp.id || emp.name);
            return (
              <div
                key={emp.id}
                onClick={() => setSelectedDetailEmployee(emp)}
                className={`bg-white rounded-[30px] p-7 border border-stone-100/90 shadow-card flex flex-col relative hover:border-brand-light/50 transition-all cursor-pointer ${
                  !isActive ? 'opacity-70' : ''
                }`}
              >
                {/* Menú (...) */}
                <div
                  className="absolute top-5 right-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenMenuId(openMenuId === emp.id ? null : emp.id)
                    }
                    className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                    aria-label="Opciones del empleado"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {openMenuId === emp.id && (
                    <div className="absolute right-0 top-8 w-44 bg-white rounded-2xl shadow-lg border border-stone-100 py-1.5 z-30 text-xs text-left">
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          setSelectedHistoryEmployee(emp);
                        }}
                        className="w-full px-3.5 py-2 flex items-center gap-2 text-stone-700 hover:bg-surface-bg font-medium"
                      >
                        <History className="w-3.5 h-3.5 text-brand-primary" />
                        Ver historial
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(emp)}
                        className="w-full px-3.5 py-2 flex items-center gap-2 text-stone-700 hover:bg-surface-bg font-medium"
                      >
                        <Pencil className="w-3.5 h-3.5 text-[#4b3179]" />
                        Editar empleado
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRequestToggleActive(emp)}
                        className="w-full px-3.5 py-2 flex items-center gap-2 text-stone-700 hover:bg-surface-bg font-medium"
                      >
                        <Power className="w-3.5 h-3.5 text-amber-600" />
                        {isActive ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          setConfirmState({
                            isOpen: true,
                            type: 'delete',
                            employee: emp,
                          });
                        }}
                        className="w-full px-3.5 py-2 flex items-center gap-2 text-brand-primary hover:bg-red-50 font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>

                {/* Encabezado centrado: Avatar con iniciales + Nombre + Pill de Especialidad */}
                <div className="flex flex-col items-center pb-5 text-center border-b border-stone-100">
                  <div className={`w-20 h-20 rounded-full ${initialsTheme.background} border-4 border-white flex items-center justify-center ${initialsTheme.text} font-bold text-xl mb-3.5`}>
                    {emp.initials}
                  </div>
                  <h3 className="mb-2 text-lg font-bold tracking-tight text-stone-900">
                    {emp.name}
                  </h3>
                  <span className={`px-3.5 py-1 rounded-full text-[11px] font-semibold ${theme.bg} ${theme.text}`}>
                    {emp.specialty}
                  </span>
                </div>

                {/* Datos de contacto y horario */}
                <div className="flex-1 pt-5 space-y-3 text-xs text-stone-500">
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-brand-primary shrink-0" />
                    <span>{emp.phone}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-brand-primary shrink-0" />
                    <span className="truncate">{emp.email}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-brand-primary shrink-0" />
                    <span>{emp.scheduleFormatted}</span>
                  </div>
                </div>

                {/* Botón inferior para abrir el Historial de Servicios realizados */}
                <div
                  className="pt-5 mt-5 border-t border-stone-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedHistoryEmployee(emp)}
                    className="w-full py-2.5 px-4 rounded-2xl bg-[#FAF6F7] hover:bg-[#FADCE6] text-brand-primary text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>
                      Historial de servicios
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal 1: Información General + Resumen de los últimos 3 servicios realizados */}
      <EmployeeDetailModal
        employee={selectedDetailEmployee}
        isOpen={Boolean(selectedDetailEmployee)}
        onClose={() => setSelectedDetailEmployee(null)}
        onEdit={handleOpenEdit}
        onToggleActive={handleRequestToggleActive}
        onOpenFullHistory={(emp) => setSelectedHistoryEmployee(emp)}
      />

      {/* Modal 2: Historial Completo de Servicios Atendidos */}
      <EmployeeHistoryModal
        employee={selectedHistoryEmployee}
        isOpen={Boolean(selectedHistoryEmployee)}
        onClose={() => setSelectedHistoryEmployee(null)}
      />

      {/* Modal 3: Formulario Crear / Editar Empleado */}
      <EmployeeFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingEmployee(null);
        }}
        onSave={handleSaveEmployee}
        initialData={editingEmployee}
        existingEmployees={employees}
      />

      {/* Confirmación para eliminar o cambiar el estado */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={() =>
          setConfirmState({ isOpen: false, type: null, employee: null })
        }
        onConfirm={
          confirmState.type === 'delete' ? executeDelete : executeToggleActive
        }
        variant={confirmState.type === 'delete' ? 'danger' : 'status'}
        title={
          confirmState.type === 'delete'
            ? `¿Eliminar a "${confirmState.employee?.name}"?`
            : `¿${confirmState.employee?.active ? 'Desactivar' : 'Activar'} a "${confirmState.employee?.name}"?`
        }
        message={
          confirmState.type === 'delete'
            ? 'Este empleado se eliminará permanentemente del directorio del salón.'
            : `¿Estás seguro de cambiar el estado de disponibilidad de "${confirmState.employee?.name}"?`
        }
        confirmText={
          confirmState.type === 'delete' ? 'Sí, eliminar' : 'Sí, cambiar estado'
        }
      />
    </div>
  );
}