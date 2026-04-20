import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export default function PedidosPage() {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [busca, setBusca] = useState('');
  const [filtroMesAno, setFiltroMesAno] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    api.get('/pedidos').then((r) => { setPedidos(r.data); setLoading(false); });
  }, []);

  const mesesDisponiveis = useMemo(() => {
    const set = new Set<string>();
    pedidos.forEach((p) => {
      const d = new Date(p.data_pedido);
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    return Array.from(set).sort().reverse();
  }, [pedidos]);

  const filtrados = pedidos.filter((p) => {
    const d = new Date(p.data_pedido);
    const mesAno = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (filtroMesAno && mesAno !== filtroMesAno) return false;
    const status = derivarStatus(p.item_statuses || []);
    if (filtroStatus && status !== filtroStatus) return false;
    if (busca && !p.cliente_nome.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  const totalValor = filtrados.reduce((s, p) => s + Number(p.valor_total || 0), 0);
  const totalRecebido = filtrados.reduce((s, p) => s + Number(p.total_pago || 0), 0);

  function formatarMesAno(valor: string) {
    const [ano, mes] = valor.split('-');
    return `${MESES[Number(mes) - 1]} ${ano}`;
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Carregando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Pedidos</h1>
        <button onClick={() => navigate('/pedidos/novo')} className="btn-primary text-xs px-3 py-2">+ Novo</button>
      </div>

      <select
        className="input"
        value={filtroMesAno}
        onChange={(e) => setFiltroMesAno(e.target.value)}
      >
        <option value="">Todos os meses</option>
        {mesesDisponiveis.map((m) => (
          <option key={m} value={m}>{formatarMesAno(m)}</option>
        ))}
      </select>

      <input className="input" placeholder="Buscar por cliente..." value={busca} onChange={(e) => setBusca(e.target.value)} />

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFiltroStatus('')} className={`btn text-xs whitespace-nowrap ${!filtroStatus ? 'btn-primary' : 'btn-secondary'}`}>
          Todos
        </button>
        {Object.entries(STATUS_LABELS).map(([key, { label, cor }]) => (
          <button
            key={key}
            onClick={() => setFiltroStatus(filtroStatus === key ? '' : key)}
            className={`btn text-xs whitespace-nowrap ${filtroStatus === key ? cor + ' font-semibold' : 'btn-secondary'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="card grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs text-gray-500">Pedidos</p>
          <p className="text-lg font-bold text-gray-800">{filtrados.length}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-lg font-bold text-gray-800">R$ {totalValor.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Recebido</p>
          <p className={`text-lg font-bold ${totalRecebido < totalValor ? 'text-orange-600' : 'text-green-700'}`}>
            R$ {totalRecebido.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {filtrados.length === 0 && <div className="card text-center text-gray-400 py-8">Nenhum pedido encontrado</div>}
        {filtrados.map((p) => {
          const status = derivarStatus(p.item_statuses || []);
          const { label, cor } = STATUS_LABELS[status] || STATUS_LABELS.pendente;
          const saldo = Number(p.valor_total) - Number(p.total_pago || 0);
          return (
            <Link key={p.id} to={`/pedidos/${p.id}`} className="card flex items-start gap-3 hover:border-rose-300 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{p.cliente_nome}</p>
                <p className="text-sm text-gray-500">
                  {new Date(p.data_pedido).toLocaleDateString('pt-BR')}
                </p>
                <div className="flex gap-3 mt-1 text-xs text-gray-500">
                  <span>Total: <strong className="text-gray-800">R$ {Number(p.valor_total).toFixed(2)}</strong></span>
                  {saldo > 0 && <span className="text-orange-600">Saldo: R$ {saldo.toFixed(2)}</span>}
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap mt-1 ${cor}`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
