import { X, Phone, Mail, Sparkles, Clock, ShieldCheck } from 'lucide-react';

export default function ProfileModal({ isOpen, onClose, user }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4">
      <div 
        className="relative w-full max-w-md bg-white rounded-[28px] shadow-card border border-stone-100 p-7 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra decorativa superior */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-primary via-brand-accent to-brand-secondary" />

        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-surface-bg flex items-center justify-center text-stone-400 hover:text-brand-primary hover:bg-brand-soft/50 transition-colors"
          aria-label="Cerrar modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Encabezado del Perfil */}
        <div className="flex items-center gap-4 mt-2 mb-6">
          <div className="w-16 h-16 rounded-full bg-brand-soft flex items-center justify-center text-brand-primary font-bold text-xl border-2 border-brand-light/40 shrink-0">
            {user.initials}
          </div>
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-soft/70 text-brand-primary mb-1">
              <ShieldCheck className="w-3 h-3" />
              {user.roleLabel}
            </span>
            <h3 className="text-xl font-bold text-stone-900 tracking-tight">
              {user.name}
            </h3>
          </div>
        </div>

        {/* Lista de Información Requerida */}
        <div className="space-y-3.5 bg-surface-bg p-4 rounded-2xl border border-stone-100 text-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-brand-primary shadow-2xs shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-stone-400">Especialidad</p>
              <p className="font-semibold text-stone-800">{user.specialty}</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-brand-primary shadow-2xs shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-stone-400">Teléfono</p>
              <p className="font-semibold text-stone-800">{user.phone}</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-brand-primary shadow-2xs shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-stone-400">Correo electrónico</p>
              <p className="font-semibold text-stone-800">{user.email}</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 pt-1 border-t border-stone-200/60">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-brand-primary shadow-2xs shrink-0 mt-0.5">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-stone-400">Horario (Días y horas)</p>
              <p className="font-semibold text-stone-800">{user.scheduleDays}</p>
              <p className="text-xs text-stone-500 mt-0.5">{user.scheduleHours}</p>
            </div>
          </div>
        </div>

        {/* Botón inferior */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-brand-primary text-white text-xs font-semibold hover:bg-brand-accent transition-colors"
          >
            Cerrar perfil
          </button>
        </div>
      </div>
    </div>
  );
}