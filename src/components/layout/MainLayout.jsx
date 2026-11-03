import { useState } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ProfileModal from './ProfileModal';
import { useAuth } from '../../context/AuthContext';

const sectionNames = {
  '/inicio': 'Inicio',
  '/servicios': 'Servicios',
  '/citas': 'Citas',
  '/inventario': 'Inventario',
  '/clientes': 'Clientes',
  '/empleados': 'Empleados',
};

export default function MainLayout() {
  const { user } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const currentSection = sectionNames[location.pathname] || 'Inicio';

  return (
    <div className="flex w-full h-screen overflow-hidden bg-surface-bg text-stone-900">
      <Sidebar
        user={user}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      <div className="flex flex-col flex-1 h-screen min-w-0 overflow-hidden">
        <Topbar
          currentSection={currentSection}
          user={user}
          onOpenProfile={() => setIsProfileOpen(true)}
        />

        <main className="flex-1 px-8 pb-10 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
      />
    </div>
  );
}