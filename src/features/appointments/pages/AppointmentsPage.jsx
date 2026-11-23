import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  List,
  LayoutGrid,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Phone,
  UserCheck,
  MoreHorizontal,
  Pencil,
  CheckCircle2,
  CircleX,
} from 'lucide-react';
import { useAuth } from '../../../context/useAuth';
import useIsMobile from '../../../utils/useIsMobile';
import { appointmentsService } from '../services/appointmentsService';
import { catalogService } from '../../services/services/catalogService';
import { clientsService } from '../../clients/services/clientsService';
import { employeesService } from '../../employees/services/employeesService';
import {
  getTodayISO,
  parseLocalDate,
  toISODateString,
  addDays,
} from '../../../utils/dateUtils';
import AppointmentDetailModal from '../components/AppointmentDetailModal';
import AppointmentFormModal from '../components/AppointmentFormModal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';

const WEEK_HEADERS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// Paleta de estilos para las tarjetas
const APPOINTMENT_THEMES = {
  wine: {
    cardBlockBg: 'bg-[#F5EBEB]',
    cardBlockText: 'text-brand-primary',
    pillBg: 'bg-[#F5EBEB]',
    pillBorder: 'border-l-[3px] border-brand-primary',
    pillTime: 'text-brand-primary',
  },
  pink: {
    cardBlockBg: 'bg-[#FDECEF]',
    cardBlockText: 'text-[#D83B64]',
    pillBg: 'bg-[#FDECEF]',
    pillBorder: 'border-l-[3px] border-[#E05277]',
    pillTime: 'text-[#D83B64]',
  },
  amber: {
    cardBlockBg: 'bg-[#FDF4E7]',
    cardBlockText: 'text-[#C2781A]',
    pillBg: 'bg-[#FDF4E7]',
    pillBorder: 'border-l-[3px] border-[#D98A2B]',
    pillTime: 'text-[#C2781A]',
  },
  mint: {
    cardBlockBg: 'bg-[#E9F7F5]',
    cardBlockText: 'text-[#1E7E6C]',
    pillBg: 'bg-[#E9F7F5]',
    pillBorder: 'border-l-[3px] border-[#26927E]',
    pillTime: 'text-[#1E7E6C]',
  },
};

// Construye las 35 celdas (5 semanas x 7 días, Lun a Dom) del mes para el Calendario
const buildMonthGrid = (referenceISO) => {
  const refDate = parseLocalDate(referenceISO);
  const year = refDate.getFullYear();
  const month = refDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  // Convertir getDay() (0=Dom..6=Sáb) a índice lunes=0..domingo=6
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
  const gridStartDate = new Date(year, month, 1 - startOffset);

  const cells = [];
  for (let i = 0; i < 35; i++) {
    const cellDate = new Date(gridStartDate);
    cellDate.setDate(gridStartDate.getDate() + i);
    cells.push({
      iso: toISODateString(cellDate),
      dayNumber: cellDate.getDate(),
      isCurrentMonth: cellDate.getMonth() === month,
    });
  }
  return cells;
};

// Obtiene el rango [lunesISO, domingoISO] de la semana de una fecha dada
const getWeekRangeISO = (referenceISO) => {
  const d = parseLocalDate(referenceISO);
  const offsetToMonday = (d.getDay() + 6) % 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - offsetToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const cur = new Date(monday);
    cur.setDate(monday.getDate() + i);
    days.push({
      iso: toISODateString(cur),
      dayNumber: cur.getDate(),
      isCurrentMonth: true,
    });
  }
  return {
    startISO: toISODateString(monday),
    endISO: toISODateString(sunday),
    days,
  };
};

export default function AppointmentsPage() {
  const { user, isAdmin } = useAuth();

  // Tres vistas requeridas: 'list' | 'cards' | 'calendar'
  const [viewMode, setViewMode] = useState('calendar');
  const [mobileViewMode, setMobileViewMode] = useState('cards');
  const isMobile = useIsMobile();
  const activeViewMode = isMobile ? mobileViewMode : viewMode;

  // Filtro de periodo: 'day' | 'week' | 'month'
  const [periodFilter, setPeriodFilter] = useState('month');

  // Fecha seleccionada actualmente en el navegador de fechas
  const [selectedDate, setSelectedDate] = useState(getTodayISO());

  // Estados de datos conectados con los demás módulos
  const [appointments, setAppointments] = useState([]);
  const [servicesCatalog, setServicesCatalog] = useState([]);
  const [promotionsCatalog, setPromotionsCatalog] = useState([]);
  const [clientsDirectory, setClientsDirectory] = useState([]);
  const [employeesDirectory, setEmployeesDirectory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Buscador y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [employeeFilter, setEmployeeFilter] = useState('Todos');

  const [openMenuId, setOpenMenuId] = useState(null);

  // Modales
  const [selectedDetailApt, setSelectedDetailApt] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingApt, setEditingApt] = useState(null);
  const [aptToDelete, setAptToDelete] = useState(null);
  const [feedbackBanner, setFeedbackBanner] = useState('');

  const showToast = (msg) => {
    setFeedbackBanner(msg);
    setTimeout(() => setFeedbackBanner(''), 3200);
  };

  // Carga sincronizada con Servicios, Clientes y Empleados
  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        const [apts, allSrvs, promos, clients, employees] = await Promise.all([
          appointmentsService.getAppointments({ user, includeAll: true }),
          catalogService.getServices(),
          catalogService.getPromotions({ user }),
          clientsService.getClients({ user }),
          employeesService.getEmployees(),
        ]);
        setAppointments(apts);
        setServicesCatalog(allSrvs); 
        setPromotionsCatalog(promos);
        setClientsDirectory(clients);
        setEmployeesDirectory(employees);
      } finally {
        setIsLoading(false);
      }
    };
    if (user) fetchAllData();
  }, [user]);

  // Navegación con flechas (< | Hoy | >) según el periodo activo (Día, Semana o Mes)
  const handleNavigateDate = (direction) => {
    if (periodFilter === 'day') {
      setSelectedDate((prev) => addDays(prev, direction));
    } else if (periodFilter === 'week') {
      setSelectedDate((prev) => addDays(prev, direction * 7));
    } else {
      const d = parseLocalDate(selectedDate);
      d.setMonth(d.getMonth() + direction);
      setSelectedDate(toISODateString(d));
    }
  };

  // Etiqueta del periodo actual; en la vista diaria incluye la fecha seleccionada.
  const periodTitleLabel = useMemo(() => {
    const d = parseLocalDate(selectedDate);
    if (periodFilter === 'day') {
      const dayLabel = new Intl.DateTimeFormat('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(d);

      return dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);
    }

    const monthName = new Intl.DateTimeFormat('es-MX', {
      month: 'long',
    }).format(d);

    const capitalizedMonth =
      monthName.charAt(0).toUpperCase() + monthName.slice(1);
    return `${capitalizedMonth} ${d.getFullYear()}`;
  }, [selectedDate, periodFilter]);

  // Filtrado por texto, estado, empleado y periodo (Día, Semana o Mes)
  const filteredAppointments = useMemo(() => {
    const [selYear, selMonth] = selectedDate.split('-');
    const weekRange = getWeekRangeISO(selectedDate);

    return appointments.filter((apt) => {
      // Filtro por periodo (Día, Semana o Mes)
      let matchesPeriod = true;
      if (periodFilter === 'day') {
        matchesPeriod = apt.date === selectedDate;
      } else if (periodFilter === 'week') {
        matchesPeriod =
          apt.date >= weekRange.startISO && apt.date <= weekRange.endISO;
      } else {
        const [aptYear, aptMonth] = apt.date.split('-');
        matchesPeriod = aptYear === selYear && aptMonth === selMonth;
      }

      // Filtro por buscador (cliente, servicio, especificación o teléfono)
      const matchesSearch =
        apt.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (apt.specification || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        apt.clientPhone.includes(searchTerm);

      // Filtro por estado
      const matchesStatus =
        statusFilter === 'Todos' || apt.status === statusFilter;

      // Los usuarios no administradores solo pueden ver citas donde participan
      const matchesOwner =
        isAdmin ||
        String(apt.employeeId) === String(user?.id) ||
        apt.serviceBreakdown.some(
          (detail) => String(detail.employeeId) === String(user?.id)
        );

      // Filtro por empleado (para Admin)
      const matchesEmployee =
        !isAdmin ||
        employeeFilter === 'Todos' ||
        String(apt.employeeId) === String(employeeFilter) ||
        apt.serviceBreakdown.some(
          (detail) => String(detail.employeeId) === String(employeeFilter)
        );

      return (
        matchesPeriod && matchesSearch && matchesStatus && matchesOwner && matchesEmployee
      );
    });
  }, [
    appointments,
    selectedDate,
    periodFilter,
    searchTerm,
    statusFilter,
    employeeFilter,
    isAdmin,
    user?.id,
  ]);

  // Celdas del calendario según el periodo seleccionado
  const calendarCells = useMemo(() => {
    if (periodFilter === 'week') {
      return getWeekRangeISO(selectedDate).days;
    }
    if (periodFilter === 'day') {
      const d = parseLocalDate(selectedDate);
      return [
        {
          iso: selectedDate,
          dayNumber: d.getDate(),
          isCurrentMonth: true,
        },
      ];
    }
    return buildMonthGrid(selectedDate);
  }, [selectedDate, periodFilter]);

  // Agrupa citas por fecha ISO para renderizar rápido en el calendario
  const appointmentsByDateMap = useMemo(() => {
    const map = {};
    filteredAppointments.forEach((apt) => {
      if (!map[apt.date]) map[apt.date] = [];
      map[apt.date].push(apt);
    });
    return map;
  }, [filteredAppointments]);

  // Obtiene cuántas citas previas tiene el cliente de la cita seleccionada
  const getClientVisitsCount = (apt) => {
    if (!apt) return 0;
    const found = clientsDirectory.find(
      (c) =>
        c.id === apt.clientId ||
        c.name.toLowerCase() === apt.client.toLowerCase()
    );
    return found?.visits?.length || 0;
  };

  // ==================== CRUD ====================
  const handleOpenCreate = (customDate = null) => {
    if (customDate) setSelectedDate(customDate);
    setEditingApt(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (apt) => {
    setEditingApt(apt);
    setOpenMenuId(null);
    setIsFormModalOpen(true);
  };

const handleSaveAppointment = async (formData, onClientCreated) => {
    let targetClientId = formData.clientId;

    // Si se registró un cliente nuevo desde la cita, lo agregamos al directorio de Clientes
    if (formData.isNewClient) {
      const createdClient = await clientsService.createClient(
        {
          name: formData.client,
          phone: formData.clientPhone,
          email: formData.clientEmail || null,
        },
        user
      );
      targetClientId = createdClient.id;
      setClientsDirectory((prev) => [createdClient, ...prev]);
      onClientCreated(createdClient);
    }

    const payload = { ...formData, clientId: targetClientId };

    if (editingApt) {
      const updated = await appointmentsService.updateAppointment(
        editingApt.id,
        payload
      );
      setAppointments((prev) =>
        prev.map((a) => (a.id === editingApt.id ? updated : a))
      );
      showToast(`Cita de "${updated.client}" actualizada correctamente.`);
    } else {
      const created = await appointmentsService.createAppointment(payload);
      setAppointments((prev) => [...prev, created]);
      showToast(
        `Cita de "${created.client}" agendada para el ${created.date} a las ${created.startTime}.`
      );
    }
    setIsFormModalOpen(false);
    setEditingApt(null);
  };

  const handleToggleStatus = async (apt) => {
    setOpenMenuId(null);
    const nextStatus =
      apt.status === 'Confirmada' ? 'Pendiente' : 'Confirmada';
    try {
      const updated = await appointmentsService.updateAppointmentStatus(apt.id, nextStatus);
      setAppointments((prev) =>
        prev.map((a) => (a.id === apt.id ? updated : a))
      );
      showToast(`Cita de "${apt.client}" marcada como ${nextStatus}.`);
    } catch (error) {
      console.error('No se pudo actualizar el estado de la cita.', error);
      const detail = error.response?.data?.detail;
      showToast(typeof detail === 'string' ? detail : error.message || 'No se pudo actualizar la cita.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!aptToDelete) return;
    if (!isAdmin) {
      const isOwnedByUser =
        String(aptToDelete.employeeId) === String(user?.id) ||
        aptToDelete.serviceBreakdown.some(
          (detail) => String(detail.employeeId) === String(user?.id)
        );
      if (!isOwnedByUser) return;
    }
    await appointmentsService.deleteAppointment(aptToDelete.id);
    setAppointments((prev) => prev.filter((a) => a.id !== aptToDelete.id));
    showToast(`Cita de "${aptToDelete.client}" eliminada de la agenda.`);
    setAptToDelete(null);
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
            Agenda
          </span>
          <h2 className="text-4xl font-bold tracking-tight text-stone-900">
            Citas
          </h2>
          <p className="mt-1 text-sm text-stone-400">
            Consulta y organiza tu calendario de trabajo.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenCreate(selectedDate)}
          className="inline-flex items-center justify-center w-full gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brand-accent to-brand-primary text-white text-xs font-bold shadow-button hover:opacity-95 active:scale-[0.99] transition-all self-start sm:w-auto sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nueva cita</span>
        </button>
      </div>

      {/* Fila 1 de Herramientas: Buscador + Todos los filtros + Conmutador de 3 Vistas (Lista | Tablero | Calendario) */}
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

          {/* Filtro de Estado */}
          <div className="relative inline-flex items-center min-w-0">
            <Filter className="w-3.5 h-3.5 text-stone-500 absolute left-3 sm:left-4 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filtrar por estado de cita"
              className="w-full min-w-0 min-h-[40px] py-2 sm:py-3 pl-8 sm:pl-10 pr-3 sm:pr-8 text-xs font-semibold bg-white border appearance-none cursor-pointer rounded-xl sm:rounded-2xl border-stone-100 text-stone-600 shadow-2xs focus:outline-none sm:w-auto"
            >
              <option value="Todos">Todos los filtros</option>
              <option value="Pendiente">Estado: Pendientes</option>
              <option value="Confirmada">Estado: Confirmadas</option>
            </select>
          </div>

          {/* Filtro por Empleado exclusivo para Admin */}
          {isAdmin && (
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              aria-label="Filtrar por especialista"
              className="w-full min-w-0 min-h-[40px] px-3 sm:px-4 py-2 sm:py-3 text-xs font-semibold bg-white border cursor-pointer rounded-xl sm:rounded-2xl border-stone-100 text-stone-600 shadow-2xs focus:outline-none sm:w-auto"
            >
              <option value="Todos">Especialista: Todas</option>
              {employeesDirectory.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.specialty})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Conmutador de las 3 Vistas: Lista | Tablero (Cards) | Calendario */}
        <div className="inline-flex items-center p-1 rounded-2xl bg-[#F2EEF0] border border-stone-200/60 self-end md:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            title="Vista de lista"
            className={`hidden sm:block p-2 rounded-xl transition-all ${
              viewMode === 'list'
                ? 'bg-white text-brand-primary shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => (isMobile ? setMobileViewMode('cards') : setViewMode('cards'))}
            title="Vista de tablero / tarjetas"
            className={`p-2 rounded-xl transition-all ${
              activeViewMode === 'cards'
                ? 'bg-white text-brand-primary shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => (isMobile ? setMobileViewMode('calendar') : setViewMode('calendar'))}
            title="Vista de calendario"
            className={`p-2 rounded-xl transition-all ${
              activeViewMode === 'calendar'
                ? 'bg-white text-brand-primary shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Fila 2: Navegador de Fecha (< | Hoy | > + Mes Año) y Selector de Periodo (Día | Semana | Mes) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleNavigateDate(-1)}
            className="flex items-center justify-center transition-colors bg-white border w-9 h-9 rounded-xl border-stone-200/80 text-stone-600 hover:text-brand-primary shadow-2xs"
            aria-label="Periodo anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setSelectedDate(getTodayISO())}
            className="px-4 py-2 text-xs font-bold transition-colors bg-white border rounded-xl border-stone-200/80 text-stone-700 hover:text-brand-primary shadow-2xs"
          >
            Hoy
          </button>

          <button
            type="button"
            onClick={() => handleNavigateDate(1)}
            className="flex items-center justify-center transition-colors bg-white border w-9 h-9 rounded-xl border-stone-200/80 text-stone-600 hover:text-brand-primary shadow-2xs"
            aria-label="Periodo siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <h3 className="ml-2 text-lg font-bold tracking-tight text-stone-900">
            {periodTitleLabel}
          </h3>
        </div>

        {/* Selector Día | Semana | Mes*/}
        <div className="inline-flex items-center p-1 rounded-2xl bg-[#F2EEF0] border border-stone-200/60 text-xs font-bold">
          {[
            { id: 'day', label: 'Día' },
            { id: 'week', label: 'Semana' },
            { id: 'month', label: 'Mes' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setPeriodFilter(tab.id)}
              className={`px-4 py-1.5 rounded-xl transition-all ${
                periodFilter === tab.id
                  ? 'bg-white text-brand-primary shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ==================== CONTENIDO SEGÚN LA VISTA ACTIVA ==================== */}
      {isLoading ? (
        <div className="py-16 text-xs text-center text-stone-400">
          Cargando agenda de trabajo...
        </div>
      ) : activeViewMode === 'calendar' ? (
        /* ==================== VISTA 3: CALENDARIO ==================== */
        <div className="bg-white rounded-[30px] border border-brand-soft shadow-card p-6 overflow-x-auto">
          <div className={periodFilter === 'day' ? '' : 'min-w-[840px]'}>
            {/* Encabezados Lun a Dom */}
            {periodFilter !== 'day' && (
              <div className="grid grid-cols-7 gap-3 mb-3 text-center">
                {WEEK_HEADERS.map((dayName) => (
                  <div
                    key={dayName}
                    className="py-1 text-xs font-bold text-stone-500"
                  >
                    {dayName}
                  </div>
                ))}
              </div>
            )}

            {/* Cuadrícula de días */}
            <div
              className={`grid ${
                periodFilter === 'day' ? 'grid-cols-1' : 'grid-cols-7'
              } gap-3`}
            >
              {calendarCells.map((cell) => {
                const dayAppointments = appointmentsByDateMap[cell.iso] || [];
                const isSelectedDay = cell.iso === selectedDate;

                return (
                  <div
                    key={cell.iso}
                    onClick={() => setSelectedDate(cell.iso)}
                    onDoubleClick={() => handleOpenCreate(cell.iso)}
                    className={`min-h-[132px] rounded-[22px] p-3 border transition-all flex flex-col justify-between cursor-pointer ${
                      isSelectedDay
                        ? 'bg-[#FFF9FA] border-[#E57399] shadow-2xs'
                        : cell.isCurrentMonth
                        ? 'bg-white border-brand-soft/80 hover:border-brand-accent/50'
                        : 'bg-[#FAFAFB] border-stone-100/60 opacity-55'
                    }`}
                  >
                    {/* Número de día  */}
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`inline-flex items-center justify-center text-xs font-bold ${
                          isSelectedDay
                            ? 'w-7 h-7 rounded-full bg-brand-primary text-white'
                            : cell.isCurrentMonth
                            ? 'text-stone-700 px-1'
                            : 'text-stone-300 px-1'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>

                      {periodFilter === 'day' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCreate(cell.iso);
                          }}
                          className="text-xs font-bold text-brand-primary hover:underline"
                        >
                          + Agregar cita en este día
                        </button>
                      )}
                    </div>

                    {/* Píldoras de citas dentro del día */}
                    <div className="space-y-1.5 flex-1">
                      {dayAppointments.map((apt) => {
                        const theme =
                          APPOINTMENT_THEMES[apt.theme] ||
                          APPOINTMENT_THEMES.wine;
                        return (
                          <div
                            key={apt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDetailApt(apt);
                            }}
                            title={`${apt.startTime}-${apt.endTime} • ${apt.service} (${apt.client} - Tel: ${apt.clientPhone}) • Atiende: ${apt.employee}`}
                            className={`px-2.5 py-1.5 rounded-lg ${theme.pillBg} ${theme.pillBorder} text-[11px] truncate hover:opacity-90 transition-opacity`}
                          >
                            <strong className={`font-bold ${theme.pillTime}`}>
                              {apt.startTime}
                            </strong>{' '}
                            <span className="font-medium text-stone-700">
                              {apt.service}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-[28px] p-12 text-center border border-stone-100 shadow-card">
          <p className="text-sm font-bold text-stone-700">
            No hay citas programadas para el periodo o filtro seleccionado
          </p>
          <p className="mt-1 text-xs text-stone-400">
            Puedes cambiar entre Día, Semana o Mes, o agendar una nueva cita.
          </p>
        </div>
      ) : activeViewMode === 'list' ? (
        /* ==================== VISTA 1: LISTA / TABLA ==================== */
        <div className="bg-white rounded-[28px] border border-stone-100/90 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-100 text-[11px] font-bold tracking-[0.12em] text-stone-400 uppercase">
                  <th className="py-5 pr-4 pl-7">HORARIO</th>
                  <th className="px-4 py-5">DÍA</th>
                  <th className="px-4 py-5">SERVICIO / ESPECIFICACIÓN</th>
                  <th className="px-4 py-5">CLIENTE</th>
                  <th className="px-4 py-5">EMPLEADO</th>
                  <th className="py-5 pl-4 text-center pr-7">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-stone-100">
                {filteredAppointments.map((apt) => {
                  const isConfirmed = apt.status === 'Confirmada';
                  return (
                    <tr
                      key={apt.id}
                      onClick={() => setSelectedDetailApt(apt)}
                      className="transition-colors cursor-pointer hover:bg-surface-bg/60"
                    >
                      {/* Columna Horario: Hora inicio negrita + Hora fin abajo */}
                      <td className="py-4 pr-4 pl-7">
                        <span className="block text-sm font-bold text-stone-900">
                          {apt.startTime}
                        </span>
                        <span className="block text-[11px] text-stone-400 mt-0.5">
                          {apt.endTime}
                        </span>
                      </td>

                      {/* Columna Día: Fecha en formato DD/MM/AAAA */}
                      <td className="px-4 py-4 font-medium text-stone-500">
                        {new Intl.DateTimeFormat('es-MX', {
                          day: '2-digit',
                          month: '2-digit',
                        }).format(parseLocalDate(apt.date))}
                      </td>

                      {/* Columna Servicio + Especificación */}
                      <td className="px-4 py-4">
                        <span className="block text-sm font-bold text-stone-900">
                          {apt.service}
                        </span>
                        <span className="block text-[11px] text-stone-400 mt-0.5 line-clamp-1">
                          {apt.specification}
                        </span>
                      </td>

                      {/* Columna Cliente: Nombre en negrita + Teléfono abajo */}
                      <td className="px-4 py-4">
                        <span className="block text-sm font-bold text-stone-900">
                          {apt.client}
                        </span>
                        <span className="block text-[11px] text-stone-400 mt-0.5">
                          {apt.clientPhone}
                        </span>
                      </td>

                      {/* Columna Empleado */}
                      <td className="px-4 py-4 font-medium text-stone-500">
                        {apt.employee}
                      </td>


                      {/* Acciones */}
                      <td
                        className="py-4 pl-4 text-center  pr-7"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(apt)}
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold inline-flex items-center gap-1 transition-colors ${
                              isConfirmed
                                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isConfirmed ? 'Pendiente' : 'Confirmar'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(apt)}
                            className="px-3.5 py-1.5 rounded-xl bg-[#F3EEFC] text-[#4b3179] text-xs font-bold hover:bg-[#E0D7F5] inline-flex items-center gap-1.5 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setAptToDelete(apt)}
                            className="inline-flex items-center justify-center transition-colors w-9 h-9 sm:w-auto sm:h-auto sm:p-2 rounded-xl text-stone-400 hover:text-brand-primary hover:bg-red-50"
                            title="Cancelar cita"
                          >
                            <CircleX className="w-4 h-4" />
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
        /* ==================== VISTA 2: TABLERO / CARDS==================== */
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAppointments.map((apt) => {
            const theme =
              APPOINTMENT_THEMES[apt.theme] || APPOINTMENT_THEMES.wine;
            const isConfirmed = apt.status === 'Confirmada';

            return (
              <div
                key={apt.id}
                onClick={() => setSelectedDetailApt(apt)}
                className="bg-white rounded-[28px] p-4 border border-stone-100/90 shadow-card flex items-stretch gap-4 relative hover:border-brand-light/50 transition-all cursor-pointer"
              >
                {/* Bloque izquierdo de Horario con icono de reloj, hora inicio grande y hora fin abajo */}
                <div
                  className={`w-24 sm:w-28 rounded-[22px] ${theme.cardBlockBg} ${theme.cardBlockText} p-3.5 flex flex-col items-center justify-center text-center shrink-0 min-h-[156px]`}
                >
                  <Clock className="w-5 h-5 mb-2 stroke-[1.8]" />
                  <span className="text-2xl font-bold leading-none tracking-tight">
                    {apt.startTime}
                  </span>
                  <span className="text-[11px] opacity-75 mt-1.5 font-medium">
                    {apt.endTime}
                  </span>
                </div>

                {/* Contenido derecho */}
                <div className="flex-1 py-1.5 pr-1 flex flex-col justify-between min-w-0">
                  <div>
                    {/* Fila superior: Badge de estado  */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(apt);
                        }}
                        className={`px-3 py-0.5 rounded-full text-[11px] font-semibold ${
                          isConfirmed
                            ? 'bg-[#E8F6F0] text-[#1E7E5A]'
                            : 'bg-[#FEF3E2] text-[#A66A15]'
                        }`}
                      >
                        {apt.status}
                      </button>

                      <div
                        className="relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId === apt.id ? null : apt.id
                            )
                          }
                          aria-label="Opciones de la cita"
                          className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {openMenuId === apt.id && (
                          <div className="absolute right-0 top-7 w-44 bg-white rounded-2xl shadow-lg border border-stone-100 py-1.5 z-30 text-xs text-left">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(apt)}
                              className="w-full px-3.5 py-2 flex items-center gap-2 text-stone-700 hover:bg-surface-bg font-medium"
                            >
                              <Pencil className="w-3.5 h-3.5 text-[#4b3179]" />
                              Editar cita
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(apt)}
                              className="w-full px-3.5 py-2 flex items-center gap-2 text-stone-700 hover:bg-surface-bg font-medium"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              {isConfirmed
                                ? 'Marcar pendiente'
                                : 'Confirmar cita'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                setAptToDelete(apt);
                              }}
                              className="w-full px-3.5 py-2 flex items-center gap-2 text-brand-primary hover:bg-red-50 font-medium"
                            >
                              <CircleX className="w-3.5 h-3.5" />
                              Cancelar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Nombre del servicio y especificación */}
                    <h3 className="text-base font-bold leading-snug truncate text-stone-900">
                      {apt.service}
                    </h3>
                    <p className="text-[11px] text-stone-400 line-clamp-1 mt-0.5">
                      {apt.specification}
                    </p>
                  </div>

                  {/* Cliente (Avatar iniciales + Nombre), Teléfono y Empleado */}
                  <div className="pt-3 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium truncate text-stone-800">
                        Cliente: {apt.client}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-400">
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-stone-400" />
                        {apt.clientPhone}
                      </span>

                      <span className="inline-flex items-center gap-1 font-medium text-stone-500">
                        <UserCheck className="w-3 h-3 text-brand-primary" />
                        {apt.employee}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal 1: Detalle Completo de la Cita */}
      <AppointmentDetailModal
        appointment={selectedDetailApt}
        isOpen={Boolean(selectedDetailApt)}
        onClose={() => setSelectedDetailApt(null)}
        onEdit={handleOpenEdit}
        onToggleStatus={handleToggleStatus}
        onDelete={(apt) => setAptToDelete(apt)}
        clientPreviousVisitsCount={getClientVisitsCount(selectedDetailApt)}
        isAdmin={isAdmin}
      />

      {/* Modal 2: Crear / Editar Cita conectada con Servicios, Clientes y Empleados */}
      <AppointmentFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingApt(null);
        }}
        onSave={handleSaveAppointment}
        initialData={editingApt}
        defaultDate={selectedDate}
        catalogServices={servicesCatalog}
        catalogPromotions={promotionsCatalog}
        clientsList={clientsDirectory}
        employeesList={employeesDirectory}
        existingAppointments={appointments}
        currentUser={user}
        isAdmin={isAdmin}
      />

      {/* Modal 3: Confirmación para Eliminar Cita */}
      <ConfirmDialog
        isOpen={Boolean(aptToDelete)}
        onClose={() => setAptToDelete(null)}
        onConfirm={handleConfirmDelete}
        variant="danger"
        title={`¿Cancelar la cita de "${aptToDelete?.client}"?`}
        message="Esta cita se cancelará y se eliminará del calendario de trabajo."
        confirmText="Sí, cancelar cita"
      />
    </div>
  );
}