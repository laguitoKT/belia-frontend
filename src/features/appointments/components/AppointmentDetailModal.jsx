import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  Sparkles,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  History,
  Pencil,
  CircleX,
} from 'lucide-react';
import { formatLongDate } from '../../../utils/dateUtils';

export default function AppointmentDetailModal({
  appointment,
  isOpen,
  onClose,
  // Props usadas desde Inicio (HomePage)
  onStatusChange,
  onGoToModule,
  // Props usadas desde el Módulo de Citas (AppointmentsPage)
  onToggleStatus,
  onEdit,
  onDelete,
  isAdmin = false,
}) {
  if (!isOpen || !appointment) return null;

  const isConfirmed = appointment.status === 'Confirmada';
  const serviceBreakdown = Array.isArray(appointment.serviceBreakdown)
    ? appointment.serviceBreakdown
    : [];
  const serviceNames = serviceBreakdown
    .map((step) => step.serviceName)
    .filter(Boolean);
  const serviceTitle = appointment.service || serviceNames.join(' + ');
  const hasMultipleEmployees =
    new Set(
      serviceBreakdown
        .map((step) => step.employeeId || step.employeeName)
        .filter(Boolean)
    ).size > 1;
  const categoryLabel =
    appointment.serviceCategory || appointment.category || 'General';
  const specificationText =
    appointment.specification ||
    appointment.notes ||
    'Sin especificaciones adicionales.';

  const handleChangeStatus = () => {
    const nextStatus = isConfirmed ? 'Pendiente' : 'Confirmada';
    if (onStatusChange) {
      onStatusChange(appointment.id, nextStatus);
    } else if (onToggleStatus) {
      onToggleStatus(appointment);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="responsive-dialog relative w-full max-w-2xl bg-white rounded-[28px] shadow-card border border-stone-100 p-7 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra superior con el gradiente de la marca */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-primary via-brand-accent to-brand-secondary" />

        {/* Botón cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute flex items-center justify-center w-8 h-8 transition-colors rounded-full top-5 right-5 bg-surface-bg text-stone-400 hover:text-brand-primary hover:bg-brand-soft/50"
          aria-label="Cerrar detalle de cita"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Encabezado: Categoría, Servicio y Estado */}
        <div className="pr-8 mt-2 mb-6">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="text-[10px] font-bold tracking-[0.16em] text-brand-primary uppercase">
              INFORMACIÓN DE LA CITA 
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                isConfirmed
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-amber-50 text-amber-600'
              }`}
            >
              {isConfirmed ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <AlertCircle className="w-3 h-3" />
              )}
              {appointment.status}
            </span>
          </div>

          <h3 className="text-2xl font-bold tracking-tight text-stone-900">
            {serviceTitle}
          </h3>
          <p className="text-xs text-stone-400 mt-0.5">
            Categoría: {categoryLabel} • Precio total: ${appointment.price} MXN
          </p>
        </div>

        {/* Campos requeridos del Módulo de Citas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-surface-bg p-4 rounded-2xl border border-stone-100 text-sm">
          {/* Cliente */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center bg-brand-soft/50 w-9 h-9 rounded-xl text-brand-primary shadow-2xs shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-stone-400">Cliente</p>
              <p className="font-semibold truncate text-stone-800">
                {appointment.client}
              </p>
            </div>
          </div>

          {/* Teléfono del cliente */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center bg-brand-soft/50 w-9 h-9 rounded-xl text-brand-primary shadow-2xs shrink-0">
              <Phone className="w-4 h-4"/>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-stone-400">
                Teléfono del cliente
              </p>
              <p className="font-semibold truncate text-stone-800">
                {appointment.clientPhone}
              </p>
            </div>
          </div>

          {/* Empleado asignado */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center bg-brand-soft/50 w-9 h-9 rounded-xl text-brand-primary shadow-2xs shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-stone-400">Empleado</p>
              <p className="font-semibold truncate text-stone-800">
                {appointment.employeeFullName || appointment.employee}
              </p>
            </div>
          </div>

          {/* Horario */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center bg-brand-soft/50 w-9 h-9 rounded-xl text-brand-primary shadow-2xs shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-stone-400">Horario</p>
              <p className="font-semibold text-stone-800">
                {appointment.startTime} - {appointment.endTime}{' '}
              </p>
            </div>
          </div>

          {/* Fecha programada */}
          {appointment.date && (
            <div className="flex items-center gap-3 pt-2 border-t sm:col-span-2 border-stone-200/60">
              <div className="flex items-center justify-center bg-brand-soft/50 w-9 h-9 rounded-xl text-brand-primary shadow-2xs shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-stone-400">
                  Fecha programada
                </p>
                <p className="font-semibold text-stone-800">
                  {formatLongDate(appointment.date)}
                </p>
              </div>
            </div>
          )}

          {/* Especificación del servicio / Notas */}
          <div className="flex items-start gap-3 pt-2 border-t sm:col-span-2 border-stone-200/60">
            <div className="w-9 h-9 rounded-xl bg-brand-soft/50 flex items-center justify-center text-brand-primary shadow-2xs shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-stone-400">
                Especificación del servicio
              </p>
              <p className="text-xs font-medium text-stone-700 leading-relaxed mt-0.5">
                {specificationText}
              </p>
            </div>
          </div>
        </div>

        {/* Desglose de servicio, empleado y horario */}
        {(serviceBreakdown.length > 1 || hasMultipleEmployees) && (
          <div className="p-4 mt-4 space-y-2 border rounded-2xl bg-surface-bg border-stone-100">
            <p className="text-[11px] font-bold tracking-wider text-brand-primary uppercase">
              Distribución de la cita
            </p>
            {serviceBreakdown.map((step, idx) => (
              <div
                key={step.subKey || idx}
                className="flex flex-col gap-1 px-3 py-2 text-xs bg-white border rounded-xl border-stone-100 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <span className="font-bold text-stone-800">
                    {idx + 1}. {step.serviceName}
                  </span>
                  <span className="block text-[11px] text-stone-400 sm:inline sm:ml-2">
                    {step.startTime} – {step.endTime}
                  </span>
                </div>
                <span className="font-semibold text-brand-primary">
                  {step.employeeName || 'Empleado no asignado'}
                </span>
              </div>
            ))}
          </div>
        )}


        {/* Acciones interactivas */}
        <div className="flex gap-3 mt-6 justify-items-end sm:flex-row sm:justify-end sm:gap-2.5 flex-col">
         
            <button
              type="button"
              onClick={handleChangeStatus}
              className={`flex-1 sm:flex-initial border border-emerald-200 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                isConfirmed
                  ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              {isConfirmed ? 'Marcar pendiente' : 
              'Confirmar cita'}
            </button>

            {onGoToModule && (
              <button
                type="button"
                onClick={onGoToModule}
                className="px-4 py-2.5 rounded-xl justify-center border border-brand-secondary/40 bg-brand-secondary/20 hover:bg-brand-secondary/40 text-brand-primary text-xs font-semibold transition-colors"
              >
                Ver en módulo de Citas
              </button>
            )}

            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(appointment);
                }}
                className="px-4 py-2.5 rounded-xl border-[#4b3179]/30 border bg-[#F3EEFC] text-[#4b3179] justify-center text-xs font-bold hover:bg-[#E0D7F5] inline-flex items-center gap-1.5 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Editar cita</span>
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(appointment);
                }}
                className="p-2.5 rounded-xl justify-center border border-brand-primary/40 text-brand-primary bg-red-50 hover:bg-red-100 transition-colors inline-flex items-center gap-1.5 text-xs font-semibold"
                title="Eliminar cita"
              >
                <CircleX className="w-4 h-4" />
                <span>Cancelar cita</span>
              </button>
            )}
          
          
        </div>
      </div>
    </div>
  );
}