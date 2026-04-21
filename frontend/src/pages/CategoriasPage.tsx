import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function CategoriasPage() {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState<any[]>([]);
  const [editando, setEditando] = useState<any | null>(null);
  const [novo, setNovo] = useState(false);
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);

  function carregar() {
    api.get('/categorias').then((r) => setCategorias(r.data));
  }

  useEffect(() => { carregar(); }, []);

  function abrirNovo() { setNovo(true); setEditando(null); setNome(''); }
  function abrirEditar(c: any) { setEditando(c); setNovo(false); setNome(c.nome); }
  function fechar() { setNovo(false); setEditando(null); }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (novo) await api.post('/categorias', { nome });
      else await api.put(`/categorias/${editando.id}`, { nome });
      fechar();
      carregar();
    } finally {
      setLoading(false);
    }
  }

  async function excluir(id: number) {
    if (!confirm('Excluir esta categoria?')) return;
    await api.delete(`/categorias/${id}`);
    carregar();
  }

  const formularioAberto = novo || !!editando;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="text-gray-500 text-lg min-h-[44px] px-1">←</button>
        <h1 className="text-xl font-bold flex-1">Categorias</h1>
        {!formularioAberto && (
          <button onClick={abrirNovo} className="btn-primary text-xs px-3 py-2">+ Nova</button>
        )}
      </div>

      {formularioAberto && (
        <form onSubmit={salvar} className="card space-y-3 border-l-4 border-rose-400">
          <h2 className="font-semibold text-gray-700">{novo ? 'Nova categoria' : 'Editar categoria'}</h2>
          <div>
            <label className="label">Nome *</label>
            <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} required autoFocus />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
            <button type="button" onClick={fechar} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {categorias.length === 0 && (
          <div className="card text-center text-gray-400 py-8">Nenhuma categoria cadastrada</div>
        )}
        {categorias.map((c) => (
          <div key={c.id} className="card flex items-center gap-3">
            <span className="flex-1 font-medium">{c.nome}</span>
            <button onClick={() => abrirEditar(c)} className="btn-secondary text-xs px-3 py-2">Editar</button>
            <button onClick={() => excluir(c.id)} className="btn-danger text-xs px-3 py-2">Excluir</button>
          </div>
        ))}
      </div>
    </div>
  );
}
