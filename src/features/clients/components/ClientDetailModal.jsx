import {
  X,
  Phone,
  Mail,
  Sparkles,
  Clock,
  FileText,
  History,
  Pencil,
  UserCheck,
} from 'lucide-react';
import { formatVisitDateTime } from '../services/clientsService';
import { getCategoryTheme } from '../../../components/ui/categoryThemes';
import { getInitialsTheme } from '../../../components/ui/initialsThemes';

export default function ClientDetailModal({
  client,
  isOpen,
  onClose,
  onEdit,
  onOpenFullHistory,
}) {
  if (!isOpen || !client) return null;

  // Últimos 3 servicios realizados
  const recentThreeVisits = (client.visits || []).slice(0, 3);
  const clientTheme = getCategoryTheme(client.lastCategory);
  const initialsTheme = getInitialsTheme(client.id || client.name);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="responsive-dialog relative w-full max-w-xl bg-white rounded-[30px] shadow-card border border-stone-100 p-7 sm:p-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-primary via-brand-accent to-brand-secondary" />

        <button
          type="button"
          onClick={onClose}
          className="absolute flex items-center justify-center transition-colors top-5 right-5 w-9 h-9 rounded-xl bg-surface-bg text-stone-400 hover:text-brand-primary"
          aria-label="Cerrar información del cliente"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Encabezado del Cliente */}
        <div className="flex items-center gap-4 pr-8 mt-2 mb-6">
          <div className={`w-16 h-16 rounded-full ${initialsTheme.background} border-4 border-white flex items-center justify-center ${initialsTheme.text} font-bold text-lg shrink-0`}>
            {client.initials}
          </div>
          <div>
            <span className="block text-[10px] font-bold tracking-[0.14em] text-brand-primary uppercase mb-1">
              INFORMACIÓN GENERAL DEL CLIENTE
            </span>
            <h3 className="text-2xl font-bold tracking-tight text-stone-900">
              {client.name}
            </h3>
          </div>
        </div>

        {/* Datos de Contacto y Último Servicio */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-surface-bg p-4 rounded-2xl border border-stone-100 text-sm mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center bg-white w-9 h-9 rounded-xl text-brand-primary shadow-2xs shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-stone-400">Teléfono</p>
              <p className="font-bold text-stone-800">{client.phone}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center bg-white w-9 h-9 rounded-xl text-brand-primary shadow-2xs shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-stone-400">
                Correo electrónico
              </p>
              <p className="font-bold truncate text-stone-800">{client.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center bg-white w-9 h-9 rounded-xl text-brand-primary shadow-2xs shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-stone-400">
                Último servicio
              </p>
              <p className={`font-bold ${clientTheme.text}`}>{client.lastService}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center bg-white w-9 h-9 rounded-xl text-brand-primary shadow-2xs shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-stone-400">
                Última visita
              </p>
              <p className="font-bold text-stone-800">
                {client.lastVisitFormatted}
              </p>
            </div>
          </div>

          {client.notes && (
            <div className="flex items-start gap-3 pt-2 border-t sm:col-span-2 border-stone-200/60">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-brand-primary shadow-2xs shrink-0 mt-0.5">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-stone-400">
                  Notas y preferencias del cliente
                </p>
                <p className="text-xs font-medium text-stone-700 mt-0.5">
                  {client.notes}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Resumen de los últimos 3 servicios realizados */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold tracking-[0.14em] text-brand-primary uppercase">
                ÚLTIMOS SERVICIOS
            </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenFullHistory(client);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:text-brand-accent transition-colors"
            >
              <History className="w-3.5 h-3.5" />
              <span>Ver historial completo </span>
            </button>
          </div>

          {recentThreeVisits.length === 0 ? (
            <div className="p-4 text-xs text-center border rounded-2xl bg-surface-bg border-stone-100 text-stone-400">
              Este cliente aún no cuenta con servicios registrados.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentThreeVisits.map((visit) => {
                const theme = getCategoryTheme(visit.category);
                return (
                <div
                  key={visit.id}
                  className="p-3.5 rounded-2xl bg-[#FAF7F8] border border-stone-100 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-900">
                        {visit.service}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${theme.bg} ${theme.text}`}>
                        {visit.category}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-400 mt-1">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-brand-primary" />
                        {formatVisitDateTime(visit)}{visit.endTime ? ` - ${visit.endTime} hrs` : ' hrs'}
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />
                        {visit.employee}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="block text-sm font-bold text-stone-900">
                      ${visit.price}
                    </span>
                    <span className="inline-block text-[10px] font-semibold text-emerald-600">
                      {visit.status}
                    </span>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Botones inferiores */}
        <div className="gap-2 pt-4 mt-6 border-t justify-items-end border-stone-100">
          {/*<button
            type="button"
            onClick={() => {
              onClose();
              onOpenFullHistory(client);
            }}
            className="px-4 py-2.5 rounded-xl bg-surface-bg hover:bg-brand-soft/50 text-brand-primary text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
          >
            <History className="w-4 h-4" />
            <span>Ver historial de visitas</span>
          </button>*/}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(client);
              }}
              className="px-4 py-2.5 rounded-xl bg-[#FADCE6] text-brand-primary text-xs font-bold inline-flex items-center gap-1.5 hover:bg-brand-light/60"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Editar cliente</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-accent"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}