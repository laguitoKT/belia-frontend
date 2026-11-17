import {
  X,
  Calendar,
  Clock,
  UserCheck,
  Sparkles,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { formatVisitDateTime } from '../services/clientsService';
import { getCategoryTheme } from '../../../components/ui/categoryThemes';
import { getInitialsTheme } from '../../../components/ui/initialsThemes';

export default function ClientHistoryModal({ client, isOpen, onClose }) {
  if (!isOpen || !client) return null;

  const visits = client.visits || [];
  const totalSpent = visits.reduce((acc, v) => acc + (Number(v.price) || 0), 0);
  const initialsTheme = getInitialsTheme(client.id || client.name);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="responsive-dialog history-dialog relative w-full max-w-4xl bg-white rounded-[32px] shadow-card border border-stone-100 p-7 sm:p-9 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-primary via-brand-accent to-brand-secondary" />

        <button
          type="button"
          onClick={onClose}
          className="absolute flex items-center justify-center w-10 h-10 transition-colors top-6 right-6 rounded-2xl bg-surface-bg text-stone-500 hover:text-brand-primary"
          aria-label="Cerrar historial"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado del Historial */}
        <div className="flex items-center gap-4 pr-12 mb-6 shrink-0">
          <div className={`w-14 h-14 rounded-full ${initialsTheme.background} flex items-center justify-center ${initialsTheme.text} font-bold text-base shrink-0`}>
            {client.initials}
          </div>
          <div>
            <span className="block text-[10px] font-bold tracking-[0.14em] text-brand-primary uppercase mb-1">
              EXPEDIENTE DE VISITAS Y CITAS
            </span>
            <h3 className="text-2xl font-bold tracking-tight text-stone-900">
              Historial de {client.name}
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              {visits.length} servicios registrados 
            </p>
          </div>
        </div>

        {/* Lista desplazable con todas las visitas y detalles completos de cada cita */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-3.5">
          {visits.length === 0 ? (
            <div className="py-12 text-center border bg-surface-bg rounded-2xl border-stone-100">
              <p className="text-sm font-bold text-stone-700">
                Sin historial de visitas
              </p>
              <p className="mt-1 text-xs text-stone-400">
                Este cliente aún no tiene servicios registrados en el sistema.
              </p>
            </div>
          ) : (
            visits.map((visit, idx) => {
              const theme = getCategoryTheme(visit.category);
              const serviceBreakdown = Array.isArray(visit.serviceBreakdown)
                ? visit.serviceBreakdown
                : [];
              const hasMultipleEmployees =
                new Set(
                  serviceBreakdown
                    .map((step) => step.employeeId || step.employeeName)
                    .filter(Boolean)
                ).size > 1;
              return (
              <div
                key={visit.id}
                className="p-5 transition-all border rounded-2xl bg-surface-bg border-stone-100 hover:border-brand-light/50"
              >
                <div className="flex flex-col justify-between gap-2 pb-3 border-b sm:flex-row sm:items-center border-stone-200/70">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-brand-soft text-brand-primary font-bold text-[11px] flex items-center justify-center">
                      #{visits.length - idx}
                    </span>
                    <h4 className="text-base font-bold text-stone-900">
                      {visit.service}
                    </h4>
                    <span className={`px-3 py-0.5 rounded-full text-[11px] font-semibold ${theme.bg} ${theme.text}`}>
                      {visit.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E8F6F0] text-[#1E7E5A]">
                      <CheckCircle2 className="w-3 h-3" />
                      {visit.status}
                    </span>
                    <span className="text-lg font-bold text-stone-900">
                      ${visit.price} MXN
                    </span>
                  </div>
                </div>

                {/* Detalles de la cita: Fecha, Horario, Empleado y Notas */}
                <div className="grid grid-cols-1 gap-3 pt-3 text-xs sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-stone-600">
                    <Calendar className="w-4 h-4 text-brand-primary shrink-0" />
                    <div>
                      <span className="block text-[10px] text-stone-400">
                        Fecha y horario de la cita
                      </span>
                      <span className="font-semibold text-stone-800">
                        {formatVisitDateTime(visit)}
                        {visit.endTime ? ` - ${visit.endTime} hrs` : ' hrs'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-stone-600">
                    <UserCheck className="w-4 h-4 text-brand-primary shrink-0" />
                    <div>
                      <span className="block text-[10px] text-stone-400">
                        Atendido por
                      </span>
                      <span className="font-semibold text-stone-800">
                        {visit.employee}
                      </span>
                    </div>
                  </div>
                </div>

                {(serviceBreakdown.length > 1 || hasMultipleEmployees) && (
                  <div className="p-3 mt-3 space-y-2 border rounded-xl bg-white/70 border-stone-200/70">
                    <p className="text-[10px] font-bold tracking-wider text-brand-primary uppercase">
                      Distribución de la cita
                    </p>
                    {serviceBreakdown.map((step, stepIndex) => (
                      <div
                        key={step.subKey || `${visit.id}-${stepIndex}`}
                        className="flex flex-col gap-1 text-[11px] sm:flex-row sm:items-center sm:justify-between"
                      >
                        <span className="font-semibold text-stone-700">
                          {stepIndex + 1}. {step.serviceName}
                          <span className="ml-1 font-normal text-stone-400">
                            ({step.startTime} – {step.endTime})
                          </span>
                        </span>
                        <span className="font-semibold text-brand-primary">
                          {step.employeeName || 'Empleado no asignado'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {visit.notes && (
                  <div className="mt-3 pt-2.5 border-t border-stone-200/50 flex items-start gap-2 text-xs text-stone-600">
                    <FileText className="w-3.5 h-3.5 text-brand-primary shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-stone-700">Especificación:</strong>{' '}
                      {visit.notes}
                    </span>
                  </div>
                )}
              </div>
              );
            })
          )}
        </div>

        {/* Pie de modal */}
        <div className="flex justify-end pt-5 mt-4 border-t border-stone-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 text-xs font-bold text-white transition-colors rounded-2xl bg-brand-primary hover:bg-brand-accent"
          >
            Cerrar historial
          </button>
        </div>
      </div>
    </div>
  );
}