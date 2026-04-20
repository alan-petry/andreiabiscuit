import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const STATUS_LABELS: Record<string, { label: string; cor: string }> = {
  pendente: { label: 'Pendente', cor: 'bg-yellow-100 text-yellow-800' },
  em_producao: { label: 'Em produção', cor: 'bg-blue-100 text-blue-800' },
  pronto: { label: 'Pronto', cor: 'bg-green-100 text-green-800' },
  parcialmente_entregue: { label: 'Parcial', cor: 'bg-orange-100 text-orange-800' },
  entregue: { label: 'Entregue', cor: 'bg-gray-100 text-gray-600' },
  cancelado: { label: 'Cancelado', cor: 'bg-red-100 text-red-700' },
};

function derivarStatus(statuses: string[]) {
  if (!statuses?.length) return 'pendente';
  const s = statuses;
  if (s.every((x) => x === 'entregue')) return 'entregue';
  if (s.every((x) => x === 'cancelado')) return 'cancelado';
  if (s.some((x) => x === 'entregue')) return 'parcialmente_entregue';
  if (s.some((x) => x === 'pronto')) return 'pronto';
  if (s.some((x) => x === 'em_producao')) return 'em_producao';
  return 'pendente';
}

export default function DashboardPage() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/pedidos').then((r) => {
      setPedidos(r.data);
      setLoading(false);
    });
  }, []);

  const ativos = pedidos.filter((p) => {
    const s = derivarStatus(p.item_statuses || []);
    return s !== 'entregue' && s !== 'cancelado';
  });

  const contagem = pedidos.reduce<Record<string, number>>((acc, p) => {
    const s = derivarStatus(p.item_statuses || []);
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  if (loading) return <div className="text-center py-12 text-gray-400">Carregando...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>

      <div className="grid grid-cols-2 gap-3">
        {Object.entries(STATUS_LABELS).map(([key, { label, cor }]) => (
          <div key={key} className="card flex items-center gap-3">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cor}`}>{label}</span>
            <span className="font-bold text-lg ml-auto">{contagem[key] || 0}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-4">
        <h2 className="font-semibold text-gray-700">Pedidos em aberto</h2>
        <Link to="/pedidos/novo" className="btn-primary text-xs px-3 py-2">+ Novo pedido</Link>
      </div>

      {ativos.length === 0 ? (
        <div className="card text-center text-gray-400 py-8">Nenhum pedido em aberto 🎉</div>
      ) : (
        <div className="space-y-2">
          {ativos.map((p) => (
            <Link key={p.id} to={`/pedidos/${p.id}`} className="card flex items-center gap-3 hover:border-rose-300 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{p.cliente_nome}</p>
                <p className="text-sm text-gray-500">
                  {new Date(p.data_pedido).toLocaleDateString('pt-BR')} · R$ {Number(p.valor_total).toFixed(2)}
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_LABELS[derivarStatus(p.item_statuses || [])]?.cor}`}>
                {STATUS_LABELS[derivarStatus(p.item_statuses || [])]?.label}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
