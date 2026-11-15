import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { useAuth } from '../context/useAuth';
import LoginPage from '../features/auth/pages/LoginPage';
import MainLayout from '../components/layout/MainLayout';
import HomePage from '../features/dashboard/pages/HomePage';
import ServicesPage from '../features/services/pages/ServicesPage';
import InventoryPage from '../features/inventory/pages/InventoryPage';
import ClientsPage from '../features/clients/pages/ClientsPage';
import EmployeesPage from '../features/employees/pages/EmployeesPage';
import AppointmentsPage from '../features/appointments/pages/AppointmentsPage';

// Componente de ruta protegida para rutas de administrador
function AdminRoute({ children }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) {
    return <Navigate to="/inicio" replace />;
  }
  return children;
}

function LoginRoute() {
  const { user } = useAuth();
  return user ? <Navigate to="/inicio" replace /> : <LoginPage />;
}

// Componente principal del enrutador de la aplicación
export default function AppRouter() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<LoginRoute />} />

    
          <Route element={<MainLayout />}>
            <Route path="/inicio" element={<HomePage />} />
            <Route path="/servicios" element={<ServicesPage />} />
            <Route path="/citas" element={<AppointmentsPage />} />
            <Route path="/inventario" element={<InventoryPage />} />
            <Route path="/clientes" element={<ClientsPage />} />
            
            {/* Ruta protegida para administradores */}
            <Route
              path="/empleados"
              element={
                <AdminRoute>
                  <EmployeesPage />
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