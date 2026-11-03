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
} from 'lucide-react';

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
}) {
  // Filtra los módulos: Empleados solo aparece si user.role === 'admin'
  const visibleNavItems = navItems.filter(
    (item) => !item.adminOnly || user?.role === 'admin'
  );

  return (
    <aside
      className={`relative h-screen bg-white border-r border-stone-100 flex flex-col justify-between shrink-0 select-none transition-all duration-300 ease-in-out z-30 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <button
        type="button"
        onClick={onToggleCollapse}
        aria-label={isCollapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
        title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
        className="absolute z-40 flex items-center justify-center w-6 h-6 transition-colors bg-white border rounded-full shadow-xs -right-3 top-8 border-stone-200 text-stone-500 hover:text-brand-primary hover:border-brand-light"
      >
        {isCollapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>

      <div className={`p-4 ${isCollapsed ? 'px-3' : 'p-6'} overflow-y-auto overflow-x-hidden`}>
        <div
          className={`flex items-center mb-10 ${
            isCollapsed ? 'justify-center' : 'gap-3.5 pl-1'
          }`}
        >
          <div className="flex items-center justify-center w-10 h-10 text-sm font-bold text-white shadow-xs bg-brand-primary rounded-xs shrink-0">
            {isCollapsed ? 'B' : ''}
          </div>

          {!isCollapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <h1 className="text-lg font-bold leading-none tracking-tight text-stone-900">
                Belia
              </h1>
              <p className="text-[9px] font-semibold tracking-[0.2em] text-stone-400 uppercase mt-1.5">
                GESTIÓN DEL SALÓN
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
                        className={`w-4 h-4 shrink-0 ${
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