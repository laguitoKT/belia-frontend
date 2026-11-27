import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ProfileModal from './ProfileModal';
import { useAuth } from '../../context/useAuth';

const sectionNames = {
  '/inicio': 'Inicio',
  '/servicios': 'Servicios',
  '/citas': 'Citas',
  '/inventario': 'Inventario',
  '/clientes': 'Clientes',
  '/empleados': 'Empleados',
};

export default function MainLayout() {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const currentSection = sectionNames[location.pathname] || 'Inicio';
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    menuButtonRef.current?.focus();
  };

  return (
    <div className="flex w-full h-screen overflow-hidden bg-surface-bg text-stone-900">
      <div className="hidden lg:flex">
        <Sidebar
          user={user}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          onOpenProfile={() => setIsProfileOpen(true)}
        />
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 w-full h-full bg-stone-900/40"
            onClick={closeMobileMenu}
            aria-label="Cerrar menú de navegación"
          />
          <Sidebar
            user={user}
            isCollapsed={false}
            onClose={closeMobileMenu}
            onNavigate={closeMobileMenu}
            onOpenProfile={() => {
              setIsMobileMenuOpen(false);
              setIsProfileOpen(true);
            }}
          />
        </div>
      )}

      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
        <Topbar
          currentSection={currentSection}
          user={user}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenMenu={() => setIsMobileMenuOpen(true)}
          isMobileMenuOpen={isMobileMenuOpen}
          menuButtonRef={menuButtonRef}
        />

        <main className="flex-1 min-h-0 px-4 pb-8 overflow-y-auto sm:px-6 lg:px-8 lg:pb-10">
          <Outlet />
        </main>
      </div>

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onLogout={logout}
        user={user}
      />
    </div>
  );
}