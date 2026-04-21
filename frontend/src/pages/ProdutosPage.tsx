import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import ImageUpload from '../components/ImageUpload';

function ProdutoForm({ id }: { id?: string }) {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState<any[]>([]);
  const [form, setForm] = useState({
    nome: '', categoria_id: '', descricao: '', dimensoes: '',
    catalogo_online: false, valor_base: '',
  });
  const [imagens, setImagens] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/categorias').then((r) => setCategorias(r.data));
    if (id) {
      api.get(`/produtos/${id}`).then((r) => {
        const p = r.data;
        setForm({
          nome: p.nome || '',
          categoria_id: p.categoria_id ? String(p.categoria_id) : '',
          descricao: p.descricao || '',
          dimensoes: p.dimensoes || '',
          catalogo_online: !!p.catalogo_online,
          valor_base: String(p.valor_base || ''),
        });
        setImagens((p.imagens || []).map((img: any) => img.imagem_base64));
      });
    }
  }, [id]);

  function set(field: string, value: any) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        categoria_id: form.categoria_id ? Number(form.categoria_id) : null,
        valor_base: Number(form.valor_base) || 0,
        imagens: imagens.map((img, ordem) => ({ imagem_base64: img, ordem })),
      };
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
          <div className="flex items-center justify-between mb-1">
            <label className="label mb-0">Categoria</label>
            <Link to="/categorias" className="text-xs text-rose-600 underline">Gerenciar categorias</Link>
          </div>
          <select className="input" value={form.categoria_id} onChange={(e) => set('categoria_id', e.target.value)}>
            <option value="">Sem categoria</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Descrição</label>
          <textarea className="input min-h-[80px] resize-none" value={form.descricao} onChange={(e) => set('descricao', e.target.value)} />
        </div>

        <div>
          <label className="label">Dimensões</label>
          <input className="input" value={form.dimensoes} onChange={(e) => set('dimensoes', e.target.value)} placeholder="Ex: 15cm x 10cm x 8cm" />
        </div>

        <div>
          <label className="label">Valor base (R$)</label>
          <input className="input" type="number" step="0.01" min="0" value={form.valor_base} onChange={(e) => set('valor_base', e.target.value)} placeholder="0,00" />
        </div>

        <div className="flex items-center justify-between py-2 border-t border-gray-100">
          <div>
            <p className="font-medium text-sm text-gray-700">Disponível no catálogo online</p>
            <p className="text-xs text-gray-400">Exibir este produto para clientes</p>
          </div>
          <button
            type="button"
            onClick={() => set('catalogo_online', !form.catalogo_online)}
            className={`relative w-12 h-6 rounded-full transition-colors ${form.catalogo_online ? 'bg-rose-500' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.catalogo_online ? 'translate-x-6' : ''}`} />
          </button>
        </div>

        <div>
          <label className="label">Fotos do produto (máx. 3)</label>
          <ImageUpload imagens={imagens} onChange={setImagens} />
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
          <button key={p.id} onClick={() => navigate(`/produtos/${p.id}`)} className="card w-full text-left flex items-center gap-3 hover:border-rose-300 transition-colors">
            {p.imagens?.[0] && (
              <img src={p.imagens[0].imagem_base64} alt="" className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{p.nome}</p>
              <div className="flex gap-2 text-xs text-gray-400 mt-0.5">
                {p.categoria_nome && <span>🏷️ {p.categoria_nome}</span>}
                {Number(p.valor_base) > 0 && <span>R$ {Number(p.valor_base).toFixed(2)}</span>}
                {p.catalogo_online ? <span className="text-green-600">● Catálogo</span> : null}
              </div>
            </div>
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
