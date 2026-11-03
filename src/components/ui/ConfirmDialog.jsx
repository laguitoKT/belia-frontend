import { AlertTriangle, Trash2, Power, X } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = '¿Estás seguro?',
  message = 'Esta acción no se puede deshacer.',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger', // 'danger' | 'warning'
}) {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-[28px] shadow-card border border-stone-100 p-7 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute flex items-center justify-center transition-colors top-5 right-5 w-9 h-9 rounded-xl bg-surface-bg text-stone-400 hover:text-stone-700"
          aria-label="Cerrar advertencia"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isDanger
                ? 'bg-red-50 text-red-600'
                : 'bg-amber-50 text-amber-600'
            }`}
          >
            {isDanger ? (
              <Trash2 className="w-5 h-5" />
            ) : variant === 'status' ? (
              <Power className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>

          <div className="pr-6">
            <span
              className={`block text-[10px] font-bold tracking-[0.14em] uppercase mb-1 ${
                isDanger ? 'text-red-600' : 'text-amber-600'
              }`}
            >
              {isDanger ? 'ACCIÓN PERMANENTE' : 'ADVERTENCIA DEL SISTEMA'}
            </span>
            <h3 className="text-xl font-bold tracking-tight text-stone-900">
              {title}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-stone-500">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t mt-7 border-stone-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-700 hover:bg-surface-bg transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-opacity hover:opacity-95 ${
              isDanger
                ? 'bg-red-600 shadow-xs'
                : 'bg-gradient-to-r from-brand-accent to-brand-primary shadow-button'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}