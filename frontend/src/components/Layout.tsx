import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/pedidos', label: 'Pedidos', icon: '📦' },
  { path: '/clientes', label: 'Clientes', icon: '👥' },
  { path: '/produtos', label: 'Produtos', icon: '🎀' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-rose-600 text-white sticky top-0 z-10 shadow">
        <div className="flex items-center justify-between px-4 h-14">
          <span className="font-bold text-lg">🌸 Andreia Biscuit</span>
          <button onClick={handleLogout} className="text-sm underline opacity-80 hover:opacity-100 min-h-[44px]">
            Sair
          </button>
        </div>
      </header>

      <main className="flex-1 pb-20 px-4 pt-4 max-w-2xl w-full mx-auto">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around z-10">
        {navItems.map((item) => {
          const active = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-2 px-3 min-h-[56px] justify-center flex-1 text-xs
                ${active ? 'text-rose-600 font-semibold' : 'text-gray-500'}`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
