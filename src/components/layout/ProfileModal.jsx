import { X, Phone, Mail, Sparkles, Clock, ShieldCheck } from 'lucide-react';

export default function ProfileModal({ isOpen, onClose, onLogout, user }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div 
        className="relative w-full max-w-md bg-white rounded-[28px] shadow-card border border-stone-100 p-7 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra decorativa superior */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-primary via-brand-accent to-brand-secondary" />

        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute flex items-center justify-center w-8 h-8 transition-colors rounded-full top-5 right-5 bg-surface-bg text-stone-400 hover:text-brand-primary hover:bg-brand-soft/50"
          aria-label="Cerrar modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Encabezado del Perfil */}
        <div className="flex items-center gap-4 mt-2 mb-6">
          <div className="flex items-center justify-center w-16 h-16 text-xl font-bold border-2 rounded-full bg-brand-soft text-brand-primary border-brand-light/40 shrink-0">
            {user.initials}
          </div>
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-soft/70 text-brand-primary mb-1">
              <ShieldCheck className="w-3 h-3" />
              {user.roleLabel}
            </span>
            <h3 className="text-xl font-bold tracking-tight text-stone-900">
              {user.name}
            </h3>
          </div>
        </div>

        {/* Lista de Información Requerida */}
        <div className="space-y-3.5 bg-surface-bg p-4 rounded-2xl border border-stone-100 text-sm">
          <div className="flex items-center gap-3.5">
            <div className="flex items-center justify-center bg-white w-9 h-9 rounded-xl text-brand-primary shadow-2xs shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-stone-400">Especialidad</p>
              <p className="font-semibold text-stone-800">{user.specialty}</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="flex items-center justify-center bg-white w-9 h-9 rounded-xl text-brand-primary shadow-2xs shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-stone-400">Teléfono</p>
              <p className="font-semibold text-stone-800">{user.phone}</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="flex items-center justify-center bg-white w-9 h-9 rounded-xl text-brand-primary shadow-2xs shrink-0">
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
        <div className="flex flex-col gap-2 mt-6">
          <button
            type="button"
            onClick={onLogout}
            className="w-full py-3 text-xs font-semibold text-white transition-colors rounded-xl bg-brand-primary hover:bg-brand-accent"
          >
            Cerrar sesión
          </button>

        </div>
      </div>
    </div>
  );
}