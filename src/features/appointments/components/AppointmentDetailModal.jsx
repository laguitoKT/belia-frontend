import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  Sparkles,
  UserCheck,
  FileText,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function AppointmentDetailModal({
  appointment,
  isOpen,
  onClose,
  onStatusChange,
  onGoToModule,
}) {
  if (!isOpen || !appointment) return null;

  const isConfirmed = appointment.status === 'Confirmada';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-[28px] shadow-card border border-stone-100 p-7 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
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
              DETALLE DE LA CITA #{appointment.id}
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
            {appointment.service}
          </h3>
          <p className="text-xs text-stone-400 mt-0.5">
            Categoría: {appointment.serviceCategory} • Precio estimado: ${appointment.price} MXN
          </p>
        </div>

        {/* Campos requeridos del Módulo de Citas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-surface-bg p-4 rounded-2xl border border-stone-100 text-sm">
          {/* Cliente */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center bg-white w-9 h-9 rounded-xl text-brand-primary shadow-2xs shrink-0">
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
            <div className="flex items-center justify-center bg-white w-9 h-9 rounded-xl text-brand-primary shadow-2xs shrink-0">
              <Phone className="w-4 h-4" />
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
            <div className="flex items-center justify-center bg-white w-9 h-9 rounded-xl text-brand-primary shadow-2xs shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-stone-400">Empleado</p>
              <p className="font-semibold truncate text-stone-800">
                {appointment.employee}
              </p>
            </div>
          </div>

          {/* Horario y Fecha */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center bg-white w-9 h-9 rounded-xl text-brand-primary shadow-2xs shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-stone-400">Horario</p>
              <p className="font-semibold text-stone-800">
                {appointment.startTime} - {appointment.endTime} ({appointment.durationHours} h)
              </p>
            </div>
          </div>

          {/* Especificación del servicio / Notas */}
          <div className="flex items-start gap-3 pt-2 border-t sm:col-span-2 border-stone-200/60">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-brand-primary shadow-2xs shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-stone-400">
                Especificación del servicio
              </p>
              <p className="text-xs font-medium text-stone-700 leading-relaxed mt-0.5">
                {appointment.notes || 'Sin especificaciones adicionales.'}
              </p>
            </div>
          </div>
        </div>

        {/* Acciones interactivas conectadas al estado */}
        <div className="flex flex-col items-center justify-between gap-3 mt-6 sm:flex-row">
          <button
            type="button"
            onClick={() =>
              onStatusChange(
                appointment.id,
                isConfirmed ? 'Por confirmar' : 'Confirmada'
              )
            }
            className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold border transition-colors ${
              isConfirmed
                ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            {isConfirmed ? 'Marcar por confirmar' : 'Confirmar cita'}
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onGoToModule}
              className="px-4 py-2.5 rounded-xl bg-surface-bg hover:bg-brand-soft/40 text-stone-700 text-xs font-semibold transition-colors"
            >
              Ver en módulo de Citas
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-accent text-white text-xs font-semibold transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}