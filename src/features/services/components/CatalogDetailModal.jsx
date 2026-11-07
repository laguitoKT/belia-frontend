import {
  X,
  Scissors,
  Sparkles,
  Clock,
  Calendar,
  Tag,
  FileText,
  Pencil,
  Power,
} from 'lucide-react';

export default function CatalogDetailModal({
  item,
  mode = 'service', // 'service' | 'promotion'
  isOpen,
  onClose,
  onEdit,
  onToggleStatus,
  formatCurrency,
  formatPromoPeriod,
}) {
  if (!isOpen || !item) return null;

  const isPromotion = mode === 'promotion';
  const isActive = item.status === 'Activo';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-[30px] shadow-card border border-stone-100 p-7 sm:p-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-primary via-brand-accent to-brand-secondary" />

        <button
          type="button"
          onClick={onClose}
          className="absolute flex items-center justify-center transition-colors top-5 right-5 w-9 h-9 rounded-xl bg-surface-bg text-stone-400 hover:text-brand-primary"
          aria-label="Cerrar detalle"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Encabezado */}
        <div className="flex items-start gap-4 pr-8 mt-2 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#FDECEF] flex items-center justify-center text-brand-primary shrink-0">
            {isPromotion ? (
              <Sparkles className="w-6 h-6" />
            ) : (
              <Scissors className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold tracking-[0.14em] text-brand-primary uppercase">
                {isPromotion ? 'PAQUETE / PROMOCIÓN' : 'DETALLE DEL SERVICIO'}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  isActive
                    ? 'bg-[#E8F6F0] text-[#1E7E5A]'
                    : 'bg-stone-100 text-stone-500'
                }`}
              >
                {item.status}
              </span>
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-stone-900">
              {item.name}
            </h3>
          </div>
        </div>

        {/* Bloque de información detallada */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-surface-bg p-4 rounded-2xl border border-stone-100 text-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center bg-white w-9 h-9 rounded-xl text-brand-primary shadow-2xs shrink-0">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-stone-400">
                {isPromotion ? 'Clasificación BD' : 'Categoría / Tipo'}
              </p>
              <p className="font-bold text-stone-800">{item.category}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center bg-white w-9 h-9 rounded-xl text-brand-primary shadow-2xs shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-stone-400">
                Duración estimada
              </p>
              <p className="font-bold text-stone-800">
                {item.durationMinutes || 60} minutos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center text-xs font-bold bg-white w-9 h-9 rounded-xl text-brand-primary shadow-2xs shrink-0">
              $
            </div>
            <div>
              <p className="text-[11px] font-medium text-stone-400">Precio</p>
              <p className="text-base font-bold text-stone-900">
                {formatCurrency(item.price)} MXN
              </p>
            </div>
          </div>

          {isPromotion && (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center bg-white w-9 h-9 rounded-xl text-brand-primary shadow-2xs shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-stone-400">
                  Periodo de vigencia
                </p>
                <p className="text-xs font-bold text-stone-800">
                  {formatPromoPeriod(item.validFrom, item.validUntil)}
                </p>
              </div>
            </div>
          )}

          {isPromotion && (
            <div className="pt-2 border-t sm:col-span-2 border-stone-200/60">
              <p className="text-[11px] font-medium text-stone-400 mb-1">
                Servicios incluidos en el paquete
              </p>
              <span className="inline-block px-3 py-1 rounded-xl text-xs font-bold bg-[#FDECEF] text-brand-primary">
                {item.serviceIncluded}
              </span>
            </div>
          )}

          <div className="flex items-start gap-3 pt-2 border-t sm:col-span-2 border-stone-200/60">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-brand-primary shadow-2xs shrink-0 mt-0.5">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-stone-400">
                Descripción completa
              </p>
              <p className="text-xs font-medium text-stone-700 leading-relaxed mt-0.5">
                {item.description}
              </p>
            </div>
          </div>
        </div>

        {/* Acciones rápidas en el pie de la modal */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-6">
          <button
            type="button"
            onClick={() => {
              onClose();
              onToggleStatus(item);
            }}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 ${
              isActive
                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{isActive ? 'Desactivar' : 'Activar'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(item);
              }}
              className="px-4 py-2.5 rounded-xl bg-[#FADCE6] text-brand-primary text-xs font-bold inline-flex items-center gap-1.5 hover:bg-brand-light/60"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Editar</span>
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