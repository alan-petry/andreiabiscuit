import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

function ClienteForm({ id }: { id?: string }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nome: '', telefone: '', endereco: '', email: '', observacao: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) api.get(`/clientes/${id}`).then((r) => setForm(r.data));
  }, [id]);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (id) await api.put(`/clientes/${id}`, form);
      else await api.post('/clientes', form);
      navigate('/clientes');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Excluir este cliente?')) return;
    await api.delete(`/clientes/${id}`);
    navigate('/clientes');
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="text-gray-500 text-lg min-h-[44px] px-1">←</button>
        <h1 className="text-xl font-bold">{id ? 'Editar cliente' : 'Novo cliente'}</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 card">
        <div>
          <label className="label">Nome *</label>
          <input className="input" value={form.nome} onChange={(e) => set('nome', e.target.value)} required />
        </div>
        <div>
          <label className="label">Telefone</label>
          <input className="input" type="tel" value={form.telefone} onChange={(e) => set('telefone', e.target.value)} placeholder="(00) 00000-0000" />
        </div>
        <div>
          <label className="label">Endereço</label>
          <input className="input" value={form.endereco} onChange={(e) => set('endereco', e.target.value)} placeholder="Rua, número, bairro, cidade..." />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
        </div>
        <div>
          <label className="label">Observação</label>
          <textarea className="input min-h-[80px] resize-none" value={form.observacao} onChange={(e) => set('observacao', e.target.value)} />
        </div>
        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
          {id && (
            <button type="button" onClick={handleDelete} className="btn-danger">Excluir</button>
          )}
        </div>
      </form>
    </div>
  );
}

function ClienteLista() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<any[]>([]);
  const [busca, setBusca] = useState('');

  useEffect(() => { api.get('/clientes').then((r) => setClientes(r.data)); }, []);

  const filtrados = clientes.filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.telefone?.includes(busca),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Clientes</h1>
        <button onClick={() => navigate('/clientes/novo')} className="btn-primary text-xs px-3 py-2">+ Novo</button>
      </div>
      <input className="input" placeholder="Buscar por nome ou telefone..." value={busca} onChange={(e) => setBusca(e.target.value)} />
      <div className="space-y-2">
        {filtrados.length === 0 && <div className="card text-center text-gray-400 py-8">Nenhum cliente encontrado</div>}
        {filtrados.map((c) => (
          <button key={c.id} onClick={() => navigate(`/clientes/${c.id}`)} className="card w-full text-left hover:border-rose-300 transition-colors">
            <p className="font-medium">{c.nome}</p>
            {c.telefone && <p className="text-sm text-gray-500">{c.telefone}</p>}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ClientesPage() {
  const { id } = useParams();
  if (id === 'novo') return <ClienteForm />;
  if (id) return <ClienteForm id={id} />;
  return <ClienteLista />;
}
