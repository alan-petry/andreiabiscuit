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

export default function App() {
  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}
