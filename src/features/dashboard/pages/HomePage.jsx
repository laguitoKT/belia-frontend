//Importación de React y librerías externas
import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Users,
  Box,
  ChevronRight,
  MoreHorizontal,
} from 'lucide-react';

// Importación de servicios y utilidades
import { useAuth } from '../../../context/useAuth';
import { appointmentsService } from '../../appointments/services/appointmentsService';
import { inventoryService } from '../../inventory/services/inventoryService';
import AppointmentDetailModal from '../../appointments/components/AppointmentDetailModal';
import {
  getTodayISO,
  getWeekDaysFromDate,
  formatDisplayDate,
} from '../../../utils/dateUtils';

// Función para determinar el color del punto de la línea de tiempo según el estado y categoría del servicio
const getTimelineDotColor = (apt) => {
  if (apt.status !== 'Confirmada') return 'bg-amber-500';
  switch (apt.serviceCategory) {
    case 'Cabello':
      return 'bg-brand-primary';
    case 'Uñas':
      return 'bg-brand-secondary';
    case 'Mirada':
      return 'bg-emerald-500';
    default:
      return 'bg-brand-accent';
  }
};

// Página principal del dashboard
export default function HomePage() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const dateInputRef = useRef(null);

  const [selectedDate, setSelectedDate] = useState(() => getTodayISO());
  const [allAppointments, setAllAppointments] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const weekDays = useMemo(() => {
    return getWeekDaysFromDate(selectedDate);
  }, [selectedDate]);

  // Vuelve a consultar citas e inventario cada vez que cambia el usuario/rol activo
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const [appointmentsData, inventoryData] = await Promise.all([
          appointmentsService.getAppointments({ user }),
          inventoryService.getProducts({ user }),
        ]);
        setAllAppointments(appointmentsData);
        setProducts(inventoryData);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

// Filtra las citas del día seleccionado
  const dayAppointments = useMemo(() => {
    return allAppointments.filter((apt) => apt.date === selectedDate);
  }, [allAppointments, selectedDate]);

// Calcula los KPIs del dashboard
  const kpiStats = useMemo(() => {
    const totalDay = dayAppointments.length;
    const confirmedDay = dayAppointments.filter(
      (apt) => apt.status === 'Confirmada'
    ).length;
// Calcula el total de horas agendadas para el día seleccionado
    const totalHours = dayAppointments.reduce(
      (acc, apt) => acc + (Number(apt.durationHours) || 0),
      0
    );
// Calcula la cantidad de clientes únicos y alertas de stock bajo
    const uniqueClients = new Set(allAppointments.map((apt) => apt.client)).size;
// Calcula la cantidad de productos con stock bajo
    const lowStockAlerts = products.filter(
      (prod) => prod.quantity < prod.minStock
    ).length;
// Calcula el total de unidades disponibles en inventario
    const totalUnits = products.reduce((acc, prod) => acc + prod.quantity, 0);
// Devuelve un objeto con todos los KPIs calculados
    return {
      totalDay,
      confirmedDay,
      totalHours: Number.isInteger(totalHours) ? totalHours : totalHours.toFixed(1),
      uniqueClients,
      lowStockAlerts,
      totalUnits,
    };
  }, [dayAppointments, allAppointments, products]);

// Función para actualizar el estado de una cita y reflejarlo en la interfaz
  const handleUpdateAppointmentStatus = async (id, newStatus) => {
    const updated = await appointmentsService.updateAppointmentStatus(id, newStatus);
    if (updated) {
      setAllAppointments((prev) =>
        prev.map((apt) => (apt.id === id ? updated : apt))
      );
      setSelectedAppointment(updated);
    }
  };

  return (
    <div className="w-full space-y-7">
      {/* Encabezado Principal */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          {/* Mensaje de bienvenida dinámico según el rol del usuario */}
          <p className="mb-1 text-xs font-bold text-brand-primary">
            {isAdmin
              ? 'Resumen general del salón'
              : `Resumen diario • Especialidad en ${user.specialtyCategory}`}
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-stone-900">
            Buenos días, {user.firstName}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-stone-400">
            {isAdmin
              ? 'Supervisión global de citas, especialistas e inventario de Belia.'
              : 'Todo listo para una gran jornada en Belia.'}
          </p>
        </div>

        {/* Selector de fecha dinámico */}
        <div className="relative self-start sm:self-auto">
          <button
            type="button"
            onClick={() =>
              dateInputRef.current?.showPicker?.() || dateInputRef.current?.click()
            }
            className="inline-flex items-center gap-3 px-4 py-3 transition-all bg-white border rounded-2xl border-stone-100 shadow-2xs hover:border-brand-light group"
          >
            <Calendar className="w-4 h-4 text-brand-primary" />
            <span className="text-xs font-semibold text-stone-700">
              {formatDisplayDate(selectedDate)}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <input
            ref={dateInputRef}
            type="date"
            value={selectedDate}
            onChange={(e) => {
              if (e.target.value) setSelectedDate(e.target.value);
            }}
            className="sr-only"
            aria-label="Seleccionar fecha"
          />
        </div>
      </div>

      {/* Tarjetas de Métricas Superiores (KPIs) */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-[26px] p-5 border border-stone-100/80 shadow-card flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FDF2F4] flex items-center justify-center text-brand-primary shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-stone-400">
              {isAdmin ? 'Citas totales hoy' : 'Mis citas para hoy'}
            </p>
            <p className="text-3xl font-bold text-stone-900 my-0.5">
              {kpiStats.totalDay}
            </p>
            <p className="text-[11px] text-stone-400">
              {kpiStats.confirmedDay} confirmadas
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[26px] p-5 border border-stone-100/80 shadow-card flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FEF1F5] flex items-center justify-center text-brand-secondary shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-stone-400">Tiempo agendado</p>
            <p className="text-3xl font-bold text-stone-900 my-0.5">
              {kpiStats.totalHours} h
            </p>
            <p className="text-[11px] text-stone-400">
              {isAdmin ? 'en todo el salón' : 'de 9 h disponibles'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[26px] p-5 border border-stone-100/80 shadow-card flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-stone-400">
              {isAdmin ? 'Clientes activos' : 'Mis clientes'}
            </p>
            <p className="text-3xl font-bold text-stone-900 my-0.5">
              {kpiStats.uniqueClients}
            </p>
            <p className="text-[11px] text-stone-400">+1 esta semana</p>
          </div>
        </div>

        <div className="bg-white rounded-[26px] p-5 border border-stone-100/80 shadow-card flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 shrink-0">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-stone-400">Alertas de stock</p>
            <p className="text-3xl font-bold text-stone-900 my-0.5">
              {kpiStats.lowStockAlerts}
            </p>
            <p className="text-[11px] text-stone-400">
              {isAdmin ? 'En todo el inventario' : `En área de ${user.specialtyCategory}`}
            </p>
          </div>
        </div>
      </div>

      {/* Grid Inferior */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Columna Izquierda: Agenda */}
        <section className="lg:col-span-7 xl:col-span-8 bg-white rounded-[30px] p-7 border border-stone-100/80 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="block text-[10px] font-bold tracking-[0.16em] text-brand-primary uppercase mb-1">
                {isAdmin ? 'AGENDA GLOBAL DEL SALÓN' : 'TU AGENDA'}
              </span>
              <h3 className="text-xl font-bold text-stone-900">Citas de hoy</h3>
            </div>

            <button
              type="button"
              onClick={() => navigate('/citas')}
              className="inline-flex items-center gap-1 text-xs font-semibold transition-colors text-brand-primary hover:text-brand-accent shrink-0"
            >
              <span>Ver agenda</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tira de días */}
          <div className="grid grid-cols-5 gap-2 pb-6 mb-6 border-b border-stone-100">
            {weekDays.map((day) => {
              const isSelected = selectedDate === day.fullDate;
              return (
                <button
                  key={day.fullDate}
                  type="button"
                  onClick={() => setSelectedDate(day.fullDate)}
                  className={`py-3 rounded-2xl flex flex-col items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-gradient-to-b from-brand-accent to-brand-primary text-white shadow-button'
                      : 'bg-transparent text-stone-400 hover:bg-surface-bg'
                  }`}
                >
                  <span
                    className={`text-[10px] font-bold tracking-wider uppercase ${
                      isSelected ? 'text-white/90' : 'text-stone-400'
                    }`}
                  >
                    {day.label}
                  </span>
                  <span
                    className={`text-base font-bold mt-0.5 ${
                      isSelected ? 'text-white' : 'text-stone-600'
                    }`}
                  >
                    {day.number}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Línea de tiempo */}
          {isLoading ? (
            <div className="py-12 text-xs text-center text-stone-400">
              Cargando citas...
            </div>
          ) : dayAppointments.length === 0 ? (
            <div className="py-12 text-center border bg-surface-bg rounded-2xl border-stone-100">
              <p className="text-sm font-semibold text-stone-700">
                No hay citas agendadas para el {formatDisplayDate(selectedDate)}
              </p>
              <p className="mt-1 text-xs text-stone-400">
                Selecciona otro día de la semana o agenda una nueva cita.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {dayAppointments.map((apt, index) => {
                const dotColor = getTimelineDotColor(apt);
                return (
                  <div key={apt.id} className="flex items-stretch gap-4">
                    <div className="relative flex flex-col items-end w-16 pt-3 pr-3 shrink-0">
                      <span className="text-xs font-bold leading-none text-stone-800">
                        {apt.startTime}
                      </span>
                      <span className="text-[10px] text-stone-400 mt-1">
                        {apt.endTime}
                      </span>

                      <span
                        className={`w-2.5 h-2.5 rounded-full ${dotColor} absolute -right-[5px] top-3.5 ring-4 ring-white z-10`}
                      />

                      {index !== dayAppointments.length - 1 && (
                        <div className="absolute right-0 w-px bg-stone-200/80 top-6 -bottom-5" />
                      )}
                    </div>

                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedAppointment(apt)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setSelectedAppointment(apt);
                        }
                      }}
                      className="flex-1 bg-[#FAF8F9] hover:bg-[#F4ECEF] border border-transparent hover:border-brand-light/40 transition-all rounded-2xl p-4 flex items-center justify-between gap-4 cursor-pointer group"
                    >
                      <div>
                        <h4 className="text-sm font-bold transition-colors text-stone-900 group-hover:text-brand-primary">
                          {apt.service}
                        </h4>
                        <p className="text-xs text-stone-400 mt-0.5">
                          {apt.client}
                          {isAdmin && (
                            <span className="font-medium text-brand-primary">
                              {' '}• Atiende: {apt.employee}
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
                            apt.status === 'Confirmada'
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-amber-50 text-amber-600'
                          }`}
                        >
                          {apt.status}
                        </span>
                        <span className="p-1 transition-colors text-stone-400 group-hover:text-brand-primary">
                          <MoreHorizontal className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Columna Derecha: INVENTARIO filtrable por especialidad */}
        <section className="lg:col-span-5 xl:col-span-4 bg-white rounded-[30px] p-7 border border-stone-100/80 shadow-card flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-6">
            <div>
              <span className="block text-[10px] font-bold tracking-[0.16em] text-brand-primary uppercase mb-1">
                {isAdmin
                  ? 'INVENTARIO GENERAL'
                  : `INVENTARIO • ${user.specialtyCategory.toUpperCase()}`}
              </span>
              <h3 className="text-xl font-bold text-stone-900">
                Disponibilidad
              </h3>
            </div>

            <button
              type="button"
              onClick={() => navigate('/inventario')}
              className="inline-flex items-center gap-1 text-xs font-semibold transition-colors text-brand-primary hover:text-brand-accent shrink-0 whitespace-nowrap"
            >
              <span>Ver todo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-[#FAF7F8] rounded-2xl p-4 flex items-center gap-4 mb-6">
            <div className="flex items-center justify-center w-12 h-12 text-sm font-bold bg-white rounded-full shadow-2xs text-stone-900 shrink-0">
              {kpiStats.totalUnits}
            </div>
            <div>
              <p className="text-xs font-bold text-stone-900">
                {isAdmin
                  ? 'Unidades totales en salón'
                  : `Insumos de ${user.specialtyCategory}`}
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5">
                {products.length} productos asignados a tu área
              </p>
            </div>
          </div>

          <div className="flex-1 divide-y divide-stone-100">
            {products.map((item) => {
              const isLowStock = item.quantity < item.minStock;
              return (
                <div
                  key={item.id}
                  onClick={() => navigate('/inventario')}
                  className="py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3 cursor-pointer hover:bg-surface-bg/60 px-2 -mx-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    />
                    <div>
                      <p className="text-xs font-bold text-stone-800">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-stone-400">
                        {item.category} • {item.unit}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-stone-800">
                    {item.quantity}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <AppointmentDetailModal
        appointment={selectedAppointment}
        isOpen={Boolean(selectedAppointment)}
        onClose={() => setSelectedAppointment(null)}
        onStatusChange={handleUpdateAppointmentStatus}
        onGoToModule={() => navigate('/citas')}
      />
    </div>
  );
}