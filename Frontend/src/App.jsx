import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Navbar from './components/ui/Navbar';
import CatalogoPage from './pages/cajero/CatalogoPage';
import ProductosAdminPage from './pages/admin/ProductosAdminPage';
import UsuariosAdminPage from './pages/admin/UsuariosAdminPage';
import ReportesPage from './pages/admin/ReportesPage';
import LoginPage from './pages/auth/LoginPage';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';

// Layout wrapping the authenticated areas
const DefaultLayout = () => (
  <div className="page-wrapper">
    <Navbar />
    <main className="main-content">
      <Outlet />
    </main>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes wrapped in layout */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DefaultLayout />}>
                <Route path="/" element={<Navigate to="/catalogo" replace />} />
                <Route path="/catalogo" element={<CatalogoPage />} />
                
                {/* Admin only routes */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                  <Route path="/admin/productos" element={<ProductosAdminPage />} />
                  <Route path="/admin/usuarios" element={<UsuariosAdminPage />} />
                  <Route path="/admin/reportes" element={<ReportesPage />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
