import { Search, Bell, Shield } from 'lucide-react';

export default function Topbar({ currentSection = 'Inicio', user, onOpenProfile }) {
  return (
    <header className="flex flex-col justify-between w-full gap-4 px-8 py-5 sm:flex-row sm:items-center">
      {/* Breadcrumb izquierdo + Badge de alcance según el rol */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-stone-400">
          <span>Belia</span>
          <span>/</span>
          <span className="text-stone-600">{currentSection}</span>
        </div>

        <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-brand-soft/60 text-brand-primary">
          <Shield className="w-3 h-3" />
          {user.role === 'admin'
            ? 'Vista Admin: Todo el salón'
            : `Área: ${user.specialtyCategory}`}
        </span>
      </div>

      {/* Controles derechos */}
      <div className="flex items-center gap-3">
        {/* Buscador */}
        <div className="relative w-full sm:w-56">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full py-2 pr-4 text-xs transition-all bg-white border rounded-full pl-9 border-stone-100 text-stone-700 placeholder:text-stone-300 shadow-2xs focus:outline-none focus:border-brand-light"
          />
        </div>

        {/* Campana de notificaciones */}
        {/* 
        <button
          type="button"
          className="relative flex items-center justify-center transition-colors bg-white border rounded-full w-9 h-9 border-stone-100 text-stone-600 hover:text-brand-primary shadow-2xs shrink-0"
          aria-label="Notificaciones"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
        </button> 
        */}

        {/* Chip de Usuario */}
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex items-center gap-2.5 pl-2 pr-1 py-1 rounded-full hover:bg-white/80 transition-colors"
        >
          <span className="hidden text-xs font-medium text-stone-700 xl:inline">
            {user.firstName}
          </span>
          <div className="w-8 h-8 rounded-full bg-brand-soft flex items-center justify-center text-brand-primary font-bold text-[11px]">
            {user.initials}
          </div>
        </button>
      </div>
    </header>
  );
}