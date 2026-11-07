import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import LoginPage from '../features/auth/pages/LoginPage';
import MainLayout from '../components/layout/MainLayout';
import HomePage from '../features/dashboard/pages/HomePage';
import ServicesPage from '../features/services/pages/ServicesPage';
import InventoryPage from '../features/inventory/pages/InventoryPage';
import ClientsPage from '../features/clients/pages/ClientsPage';

// Componente de ruta protegida para rutas de administrador
function AdminRoute({ children }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) {
    return <Navigate to="/inicio" replace />;
  }
  return children;
}

// Componente principal del enrutador de la aplicación
export default function AppRouter() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<LoginPage />} />

    
          <Route element={<MainLayout />}>
            <Route path="/inicio" element={<HomePage />} />
            <Route path="/servicios" element={<ServicesPage />} />
            <Route path="/citas" element={<div className="p-4 text-sm text-stone-500">Módulo de Citas (En construcción)</div>} />
            <Route path="/inventario" element={<InventoryPage />} />
            <Route path="/clientes" element={<ClientsPage />} />
            
            {/* Ruta protegida para administradores */}
            <Route
              path="/empleados"
              element={
                <AdminRoute>
                  <div className="p-4 text-sm text-stone-500">Módulo de Empleados (Solo Admin)</div>
                </AdminRoute>
              }
            />
          </Route>
              
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}