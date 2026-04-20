import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

function ProdutoForm({ id }: { id?: string }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nome: '', descricao: '', valor_base: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) api.get(`/produtos/${id}`).then((r) => setForm({ ...r.data, valor_base: String(r.data.valor_base) }));
  }, [id]);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, valor_base: Number(form.valor_base) || 0 };
      if (id) await api.put(`/produtos/${id}`, payload);
      else await api.post('/produtos', payload);
      navigate('/produtos');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Excluir este produto?')) return;
    await api.delete(`/produtos/${id}`);
    navigate('/produtos');
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="text-gray-500 text-lg min-h-[44px] px-1">←</button>
        <h1 className="text-xl font-bold">{id ? 'Editar produto' : 'Novo produto'}</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 card">
        <div>
          <label className="label">Nome *</label>
          <input className="input" value={form.nome} onChange={(e) => set('nome', e.target.value)} required />
        </div>
        <div>
          <label className="label">Descrição</label>
          <textarea className="input min-h-[80px] resize-none" value={form.descricao} onChange={(e) => set('descricao', e.target.value)} />
        </div>
        <div>
          <label className="label">Valor base (R$)</label>
          <input className="input" type="number" step="0.01" min="0" value={form.valor_base} onChange={(e) => set('valor_base', e.target.value)} placeholder="0,00" />
        </div>
        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
          {id && <button type="button" onClick={handleDelete} className="btn-danger">Excluir</button>}
        </div>
      </form>
    </div>
  );
}

function ProdutoLista() {
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState<any[]>([]);
  const [busca, setBusca] = useState('');

  useEffect(() => { api.get('/produtos').then((r) => setProdutos(r.data)); }, []);

  const filtrados = produtos.filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Produtos</h1>
        <button onClick={() => navigate('/produtos/novo')} className="btn-primary text-xs px-3 py-2">+ Novo</button>
      </div>
      <input className="input" placeholder="Buscar produto..." value={busca} onChange={(e) => setBusca(e.target.value)} />
      <div className="space-y-2">
        {filtrados.length === 0 && <div className="card text-center text-gray-400 py-8">Nenhum produto encontrado</div>}
        {filtrados.map((p) => (
          <button key={p.id} onClick={() => navigate(`/produtos/${p.id}`)} className="card w-full text-left hover:border-rose-300 transition-colors">
            <p className="font-medium">{p.nome}</p>
            {Number(p.valor_base) > 0 && <p className="text-sm text-gray-500">R$ {Number(p.valor_base).toFixed(2)}</p>}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ProdutosPage() {
  const { id } = useParams();
  if (id === 'novo') return <ProdutoForm />;
  if (id) return <ProdutoForm id={id} />;
  return <ProdutoLista />;
}
