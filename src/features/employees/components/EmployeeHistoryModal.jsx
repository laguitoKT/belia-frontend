import {
  X,
  Calendar,
  User,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { formatEmployeeServiceDate } from '../services/employeesService';
import { getInitialsTheme } from '../../../components/ui/initialsThemes';

export default function EmployeeHistoryModal({ employee, isOpen, onClose }) {
  if (!isOpen || !employee) return null;

  const history = employee.serviceHistory || [];
  const totalGenerated = history.reduce(
    (acc, item) => acc + (Number(item.price) || 0),
    0
  );
  const initialsTheme = getInitialsTheme(employee.id || employee.name);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-card border border-stone-100 p-7 sm:p-9 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
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

        {/* Encabezado */}
        <div className="flex items-center gap-4 pr-12 mb-6 shrink-0">
          <div className={`w-14 h-14 rounded-full ${initialsTheme.background} flex items-center justify-center ${initialsTheme.text} font-bold text-base shrink-0`}>
            {employee.initials}
          </div>
          <div>
            <span className="block text-[10px] font-bold tracking-[0.14em] text-brand-primary uppercase mb-1">
              HISTORIAL DE SERVICIOS ATENDIDOS
            </span>
            <h3 className="text-2xl font-bold tracking-tight text-stone-900">
              Servicios de {employee.name}
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              {employee.specialty} • {history.length} citas atendidas 
            </p>
          </div>
        </div>

        {/* Lista de servicios realizados */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3.5">
          {history.length === 0 ? (
            <div className="py-12 text-center border bg-surface-bg rounded-2xl border-stone-100">
              <p className="text-sm font-bold text-stone-700">
                Sin historial de servicios
              </p>
              <p className="mt-1 text-xs text-stone-400">
                Este especialista aún no tiene citas registradas.
              </p>
            </div>
          ) : (
            history.map((item, idx) => {
              const theme = getCategoryTheme(item.category);
              return (
              <div
                key={item.id}
                className="p-5 transition-all border rounded-2xl bg-surface-bg border-stone-100 hover:border-brand-light/50"
              >
                <div className="flex flex-col justify-between gap-2 pb-3 border-b sm:flex-row sm:items-center border-stone-200/70">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-brand-soft text-brand-primary font-bold text-[11px] flex items-center justify-center">
                      #{history.length - idx}
                    </span>
                    <h4 className="text-base font-bold text-stone-900">
                      {item.service}
                    </h4>
                    <span className={`px-3 py-0.5 rounded-full text-[11px] font-semibold ${theme.bg} ${theme.text}`}>
                      {item.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E8F6F0] text-[#1E7E5A]">
                      <CheckCircle2 className="w-3 h-3" />
                      {item.status}
                    </span>
                    <span className="text-lg font-bold text-stone-900">
                      ${item.price} MXN
                    </span>
                  </div>
                </div>

                {/* Detalles unificados: Fecha + Horario y Cliente atendido */}
                <div className="grid grid-cols-1 gap-3 pt-3 text-xs sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-stone-600">
                    <Calendar className="w-4 h-4 text-brand-primary shrink-0" />
                    <div>
                      <span className="block text-[10px] text-stone-400">
                        Fecha y horario de la cita
                      </span>
                      <span className="font-semibold text-stone-800">
                        {formatEmployeeServiceDate(item)}
                        {item.endTime ? ` - ${item.endTime} hrs` : ' hrs'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-stone-600">
                    <User className="w-4 h-4 text-brand-primary shrink-0" />
                    <div>
                      <span className="block text-[10px] text-stone-400">
                        Cliente atendido
                      </span>
                      <span className="font-semibold text-stone-800">
                        {item.client}{' '}
                        {item.clientPhone ? `(${item.clientPhone})` : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {item.notes && (
                  <div className="mt-3 pt-2.5 border-t border-stone-200/50 flex items-start gap-2 text-xs text-stone-600">
                    <FileText className="w-3.5 h-3.5 text-brand-primary shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-stone-700">Especificación:</strong>{' '}
                      {item.notes}
                    </span>
                  </div>
                )}
              </div>
              );
            })
          )}
        </div>

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