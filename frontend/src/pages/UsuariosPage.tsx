import { useEffect, useState } from 'react';
import api from '../services/api';

interface Usuario { id: number; email: string; created_at: string; }

interface FormState { email: string; senha: string; }

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [novo, setNovo] = useState(false);
  const [form, setForm] = useState<FormState>({ email: '', senha: '' });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  function carregar() {
    api.get('/usuarios').then((r) => setUsuarios(r.data));
  }

  useEffect(() => { carregar(); }, []);

  function abrirNovo() {
    setNovo(true);
    setEditando(null);
    setForm({ email: '', senha: '' });
    setErro('');
  }

  function abrirEditar(u: Usuario) {
    setEditando(u);
    setNovo(false);
    setForm({ email: u.email, senha: '' });
    setErro('');
  }

  function fechar() {
    setNovo(false);
    setEditando(null);
    setErro('');
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    if (novo && !form.senha) { setErro('Senha obrigatória para novo usuário'); return; }
    setLoading(true);
    try {
      if (novo) {
        await api.post('/usuarios', form);
      } else if (editando) {
        await api.put(`/usuarios/${editando.id}`, form);
      }
      fechar();
      carregar();
    } catch (err: any) {
      setErro(err.response?.data?.error || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  }

  async function excluir(id: number) {
    if (!confirm('Excluir este usuário?')) return;
    try {
      await api.delete(`/usuarios/${id}`);
      carregar();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao excluir');
    }
  }

  const formularioAberto = novo || !!editando;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Usuários</h1>
        {!formularioAberto && (
          <button onClick={abrirNovo} className="btn-primary text-xs px-3 py-2">+ Novo</button>
        )}
      </div>

      {formularioAberto && (
        <form onSubmit={salvar} className="card space-y-4 border-l-4 border-rose-400">
          <h2 className="font-semibold text-gray-700">{novo ? 'Novo usuário' : 'Editar usuário'}</h2>
          <div>
            <label className="label">Email *</label>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="label">{novo ? 'Senha *' : 'Nova senha (deixe em branco para não alterar)'}</label>
            <input
              className="input"
              type="password"
              value={form.senha}
              onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
              placeholder="••••••••"
            />
          </div>
          {erro && <p className="text-red-600 text-sm">{erro}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
            <button type="button" onClick={fechar} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {usuarios.length === 0 && (
          <div className="card text-center text-gray-400 py-8">Nenhum usuário</div>
        )}
        {usuarios.map((u) => (
          <div key={u.id} className="card flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{u.email}</p>
              <p className="text-xs text-gray-400">
                Criado em {new Date(u.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <button onClick={() => abrirEditar(u)} className="btn-secondary text-xs px-3 py-2">Editar</button>
            <button onClick={() => excluir(u.id)} className="btn-danger text-xs px-3 py-2">Excluir</button>
          </div>
        ))}
      </div>
    </div>
  );
}
