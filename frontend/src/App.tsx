import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientesPage from './pages/ClientesPage';
import ProdutosPage from './pages/ProdutosPage';
import PedidosPage from './pages/PedidosPage';
import PedidoFormPage from './pages/PedidoFormPage';
import UsuariosPage from './pages/UsuariosPage';
import CategoriasPage from './pages/CategoriasPage';
import CatalogoPage from './pages/CatalogoPage';
import { useOtaUpdate } from './hooks/useOtaUpdate';
import InstallAppBanner from './components/InstallAppBanner';

function AppContent() {
  const { updating } = useOtaUpdate();

  return (
    <>
      {updating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="rounded-2xl bg-white px-8 py-5 text-center shadow-xl">
            <p className="text-lg font-semibold text-gray-800">Atualizando...</p>
          </div>
        </div>
      )}
      <InstallAppBanner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/clientes" element={<PrivateRoute><ClientesPage /></PrivateRoute>} />
          <Route path="/clientes/:id" element={<PrivateRoute><ClientesPage /></PrivateRoute>} />
          <Route path="/produtos" element={<PrivateRoute><ProdutosPage /></PrivateRoute>} />
          <Route path="/produtos/:id" element={<PrivateRoute><ProdutosPage /></PrivateRoute>} />
          <Route path="/pedidos" element={<PrivateRoute><PedidosPage /></PrivateRoute>} />
          <Route path="/pedidos/novo" element={<PrivateRoute><PedidoFormPage /></PrivateRoute>} />
          <Route path="/pedidos/:id" element={<PrivateRoute><PedidoFormPage /></PrivateRoute>} />
          <Route path="/usuarios" element={<PrivateRoute><UsuariosPage /></PrivateRoute>} />
          <Route path="/categorias" element={<PrivateRoute><CategoriasPage /></PrivateRoute>} />
          <Route path="/catalogo" element={<CatalogoPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
