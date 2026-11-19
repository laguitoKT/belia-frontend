import { NavLink } from 'react-router-dom';
import {
  Home,
  Sparkles,
  Calendar,
  Box,
  Users,
  UserCheck,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import logo from '../../assets/LogoB2.png';

const navItems = [
  { name: 'Inicio', path: '/inicio', icon: Home, adminOnly: false },
  { name: 'Servicios', path: '/servicios', icon: Sparkles, adminOnly: false },
  { name: 'Citas', path: '/citas', icon: Calendar, adminOnly: false },
  { name: 'Inventario', path: '/inventario', icon: Box, adminOnly: false },
  { name: 'Clientes', path: '/clientes', icon: Users, adminOnly: false },
  { name: 'Empleados', path: '/empleados', icon: UserCheck, adminOnly: true },
];

export default function Sidebar({
  user,
  isCollapsed,
  onToggleCollapse,
  onOpenProfile,
  onClose,
  onNavigate,
}) {
  // Filtra los módulos: Empleados solo aparece si user.role === 'admin'
  const visibleNavItems = navItems.filter(
    (item) => !item.adminOnly || user?.role === 'admin'
  );

  return (
    <aside
      id={onClose ? 'mobile-navigation' : undefined}
      aria-label="Navegación principal"
      className={`relative h-full bg-white flex flex-col justify-between shrink-0 select-none transition-all duration-300 ease-in-out z-30 ${
        isCollapsed ? 'w-20' : 'w-64 max-w-[85vw]'
      }`}
    >
      {onClose ? (
        <button
          type="button"
          autoFocus
          onClick={onClose}
          aria-label="Cerrar menú de navegación"
          className="absolute z-40 flex items-center justify-center w-9 h-9 rounded-xl right-2 top-2 bg-white text-brand-primary hover:bg-brand-soft"
        >
          <X className="w-5 h-5" />
        </button>
      ) : (
      <button
        type="button"
        onClick={onToggleCollapse}
        aria-label={isCollapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
        title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
        className="absolute z-40 flex items-center justify-center w-6 h-6 transition-colors rounded-lg shadow-xs bg-stone-50 hover:bg-brand-primary -right-3 top-8 border-brand-soft text-brand-primary hover:text-brand-soft hover:border-brand-primary"
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
      )}

      <div className={`p-4 ${isCollapsed ? 'px-3' : 'p-6'} overflow-y-auto overflow-x-hidden`}>
        <div
          className={`flex items-center mb-10 bg-brand-primary p-3 pl-3  rounded-2xl ${
            isCollapsed ? 'justify-center' : 'gap-3.5 pl-1'
          }`}
        >
          {/* Logo de Belia */}
          <div className="brand-logo flex items-center justify-center w-8 h-8 p-1 text-sm font-bold text-white bg-white rounded-lg shadow-xs shrink-0">
            <img src={logo} alt="Belia" className="object-contain w-full h-full" />
          </div>

          {!isCollapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <h1 className="font-bold leading-none tracking-tight text-white text-md">
                Belia
              </h1>
              <p className="text-[9px] font-semibold tracking-[0.2em] text-white uppercase mt-1.5">
                GESTIÓN DE SALÓN
              </p>
            </div>
          )}
        </div>

        {!isCollapsed ? (
          <p className="text-[10px] font-bold tracking-[0.16em] text-stone-400 uppercase px-3 mb-3 whitespace-nowrap">
            MENÚ PRINCIPAL
          </p>
        ) : (
          <div className="w-8 h-px mx-auto mb-4 bg-stone-100" />
        )}

        <nav className="space-y-1.5">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onNavigate}
                title={isCollapsed ? item.name : undefined}
                className={({ isActive }) =>
                  `relative flex items-center rounded-2xl text-sm font-medium transition-all ${
                    isCollapsed
                      ? 'justify-center py-3.5 px-0'
                      : 'justify-between px-4 py-3.5'
                  } ${
                    isActive
                      ? 'bg-[#FDF2F5] text-brand-primary font-semibold'
                      : 'text-stone-600 hover:bg-surface-bg hover:text-stone-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={`flex items-center ${
                        isCollapsed ? 'justify-center' : 'gap-3.5'
                      }`}
                    >
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? 'text-brand-primary' : 'text-stone-400'
                        }`}
                      />
                      {!isCollapsed && (
                        <span className="whitespace-nowrap">{item.name}</span>
                      )}
                    </div>

                    {isActive && !isCollapsed && (
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0" />
                    )}
                    {isActive && isCollapsed && (
                      <span className="absolute right-2 top-2 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-3 border-t border-stone-100/60">
        <button
          type="button"
          onClick={onOpenProfile}
          title={isCollapsed ? `${user.name} (${user.roleLabel})` : 'Ver perfil'}
          className={`w-full rounded-2xl bg-[#FAF6F7] hover:bg-brand-soft/40 border border-stone-100 flex items-center transition-colors text-left group ${
            isCollapsed ? 'justify-center p-2' : 'justify-between p-3'
          }`}
        >
          <div className="flex items-center min-w-0 gap-3">
            <div className="flex items-center justify-center w-10 h-10 text-xs font-bold rounded-full bg-brand-soft text-brand-primary shrink-0">
              {user.initials}
            </div>

            {!isCollapsed && (
              <div className="truncate">
                <p className="text-xs font-bold truncate transition-colors text-stone-900 group-hover:text-brand-primary">
                  {user.name}
                </p>
                <p className="text-[11px] text-stone-400 truncate">
                  {user.specialty}
                </p>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <MoreHorizontal className="w-4 h-4 ml-2 text-stone-400 shrink-0" />
          )}
        </button>
      </div>
    </aside>
  );
}