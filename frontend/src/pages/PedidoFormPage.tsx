import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import ImageUpload from '../components/ImageUpload';

const STATUS_ITEM = ['pendente', 'em_producao', 'pronto', 'entregue', 'cancelado'];
const STATUS_LABEL: Record<string, string> = {
  pendente: 'Pendente', em_producao: 'Em produção', pronto: 'Pronto', entregue: 'Entregue', cancelado: 'Cancelado',
};
const FORMA_PAG = [
  { value: 'entrada_50', label: 'Entrada 50%' },
  { value: 'total_pedido', label: 'Total no pedido' },
  { value: 'total_entrega', label: 'Total na entrega' },
];
const TIPO_PAG = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'final', label: 'Pagamento final' },
  { value: 'outros', label: 'Outros' },
];

interface Item {
  id?: number;
  produto_id: string;
  descricao_personalizacao: string;
  observacao: string;
  valor: string;
  status: string;
  previsao_entrega: string;
  data_entrega: string;
  imagens: string[];
}

interface Pagamento {
  id?: number;
  valor: string;
  data_pagamento: string;
  tipo: string;
  observacao: string;
}

const novoItem = (): Item => ({
  produto_id: '', descricao_personalizacao: '', observacao: '',
  valor: '', status: 'pendente', previsao_entrega: '', data_entrega: '', imagens: [],
});

const novoPagamento = (): Pagamento => ({
  valor: '', data_pagamento: new Date().toISOString().split('T')[0], tipo: 'entrada', observacao: '',
});

export default function PedidoFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdicao = !!id;

  const [clientes, setClientes] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [abaPagamento, setAbaPagamento] = useState(false);

  const [form, setForm] = useState({
    cliente_id: '',
    data_pedido: new Date().toISOString().split('T')[0],
    valor_total: '',
    forma_pagamento: 'total_entrega',
    observacao: '',
  });
  const [itens, setItens] = useState<Item[]>([novoItem()]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);

  useEffect(() => {
    api.get('/clientes').then((r) => setClientes(r.data));
    api.get('/produtos').then((r) => setProdutos(r.data));
    if (id) {
      api.get(`/pedidos/${id}`).then((r) => {
        const p = r.data;
        setForm({
          cliente_id: String(p.cliente_id),
          data_pedido: p.data_pedido?.split('T')[0] || '',
          valor_total: String(p.valor_total),
          forma_pagamento: p.forma_pagamento,
          observacao: p.observacao || '',
        });
        setItens(
          (p.itens || []).map((i: any) => ({
            id: i.id,
            produto_id: i.produto_id ? String(i.produto_id) : '',
            descricao_personalizacao: i.descricao_personalizacao || '',
            observacao: i.observacao || '',
            valor: String(i.valor),
            status: i.status,
            previsao_entrega: i.previsao_entrega?.split('T')[0] || '',
            data_entrega: i.data_entrega?.split('T')[0] || '',
            imagens: (i.imagens || []).map((img: any) => img.imagem_base64),
          })),
        );
        setPagamentos(
          (p.pagamentos || []).map((pg: any) => ({
            id: pg.id,
            valor: String(pg.valor),
            data_pagamento: pg.data_pagamento?.split('T')[0] || '',
            tipo: pg.tipo,
            observacao: pg.observacao || '',
          })),
        );
      });
    }
  }, [id]);

  function setFormField(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function setItem(idx: number, field: keyof Item, value: any) {
    setItens((prev) => prev.map((it, i) => {
      if (i !== idx) return it;
      const atualizado = { ...it, [field]: value };
      if (field === 'data_entrega') {
        atualizado.status = value ? 'entregue' : (it.status === 'entregue' ? 'em_producao' : it.status);
      }
      return atualizado;
    }));
  }

  function addItem() { setItens((prev) => [...prev, novoItem()]); }
  function removeItem(idx: number) { setItens((prev) => prev.filter((_, i) => i !== idx)); }

  function setPagamentoField(idx: number, field: keyof Pagamento, value: string) {
    setPagamentos((prev) => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  }

  const valorTotal = itens.reduce((s, it) => s + (Number(it.valor) || 0), 0);
  const totalPago = pagamentos.reduce((s, p) => s + (Number(p.valor) || 0), 0);
  const saldo = valorTotal - totalPago;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        valor_total: valorTotal,
        itens: itens.map((it) => ({
          ...it,
          produto_id: it.produto_id ? Number(it.produto_id) : null,
          valor: Number(it.valor) || 0,
          previsao_entrega: it.previsao_entrega || null,
          data_entrega: it.data_entrega || null,
          imagens: it.imagens.map((img, ordem) => ({ imagem_base64: img, ordem })),
        })),
      };

      let pedidoId = id;
      if (isEdicao) {
        await api.put(`/pedidos/${id}`, payload);
      } else {
        const r = await api.post('/pedidos', payload);
        pedidoId = r.data.id;
      }

      // Salvar pagamentos novos (sem id)
      for (const pg of pagamentos.filter((p) => !p.id)) {
        await api.post(`/pedidos/${pedidoId}/pagamentos`, {
          ...pg, valor: Number(pg.valor),
        });
      }

      navigate(`/pedidos/${pedidoId}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Excluir este pedido?')) return;
    await api.delete(`/pedidos/${id}`);
    navigate('/pedidos');
  }

  async function removerPagamento(idx: number) {
    const pg = pagamentos[idx];
    if (pg.id) await api.delete(`/pedidos/${id}/pagamentos/${pg.id}`);
    setPagamentos((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="text-gray-500 text-lg min-h-[44px] px-1">←</button>
        <h1 className="text-xl font-bold">{isEdicao ? 'Editar pedido' : 'Novo pedido'}</h1>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        <button onClick={() => setAbaPagamento(false)} className={`px-4 py-2.5 text-sm font-medium ${!abaPagamento ? 'border-b-2 border-rose-600 text-rose-600' : 'text-gray-500'}`}>
          Pedido
        </button>
        <button onClick={() => setAbaPagamento(true)} className={`px-4 py-2.5 text-sm font-medium relative ${abaPagamento ? 'border-b-2 border-rose-600 text-rose-600' : 'text-gray-500'}`}>
          Pagamentos
          {saldo > 0 && <span className="ml-1 text-xs bg-orange-500 text-white rounded-full px-1.5">R$ {saldo.toFixed(0)}</span>}
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {!abaPagamento ? (
          <div className="space-y-4">
            <div className="card space-y-4">
              <h2 className="font-semibold text-gray-700">Dados do pedido</h2>
              <div>
                <label className="label">Cliente *</label>
                <select className="input" value={form.cliente_id} onChange={(e) => setFormField('cliente_id', e.target.value)} required>
                  <option value="">Selecione...</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Data do pedido *</label>
                <input className="input" type="date" value={form.data_pedido} onChange={(e) => setFormField('data_pedido', e.target.value)} required />
              </div>
              <div>
                <label className="label">Valor total (R$)</label>
                <div className="input bg-gray-50 text-gray-700 font-semibold">
                  R$ {valorTotal.toFixed(2)}
                  <span className="text-xs font-normal text-gray-400 ml-2">calculado automaticamente</span>
                </div>
              </div>
              <div>
                <label className="label">Forma de pagamento</label>
                <select className="input" value={form.forma_pagamento} onChange={(e) => setFormField('forma_pagamento', e.target.value)}>
                  {FORMA_PAG.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Observação geral</label>
                <textarea className="input min-h-[80px] resize-none" value={form.observacao} onChange={(e) => setFormField('observacao', e.target.value)} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-700">Itens do pedido</h2>
                <button type="button" onClick={addItem} className="btn-secondary text-xs px-3 py-2">+ Item</button>
              </div>

              {itens.map((item, idx) => (
                <div key={idx} className="card space-y-3 border-l-4 border-rose-300">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-rose-700">Item {idx + 1}</span>
                    {itens.length > 1 && (
                      <button type="button" onClick={() => removeItem(idx)} className="text-red-500 text-sm min-h-[44px] px-2">Remover</button>
                    )}
                  </div>

                  <div>
                    <label className="label">Produto (opcional)</label>
                    <select className="input" value={item.produto_id} onChange={(e) => setItem(idx, 'produto_id', e.target.value)}>
                      <option value="">Personalizado / sem produto</option>
                      {produtos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="label">Descrição / personalização</label>
                    <textarea className="input min-h-[70px] resize-none" value={item.descricao_personalizacao} onChange={(e) => setItem(idx, 'descricao_personalizacao', e.target.value)} placeholder="Ex: Urso com nome João, cor azul..." />
                  </div>

                  <div>
                    <label className="label">Observação do item</label>
                    <textarea className="input min-h-[60px] resize-none" value={item.observacao} onChange={(e) => setItem(idx, 'observacao', e.target.value)} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Valor (R$)</label>
                      <input className="input" type="number" step="0.01" min="0" value={item.valor} onChange={(e) => setItem(idx, 'valor', e.target.value)} placeholder="0,00" />
                    </div>
                    <div>
                      <label className="label">Status</label>
                      <select className="input" value={item.status} onChange={(e) => setItem(idx, 'status', e.target.value)}>
                        {STATUS_ITEM.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Previsão entrega</label>
                      <input className="input" type="date" value={item.previsao_entrega} onChange={(e) => setItem(idx, 'previsao_entrega', e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Data entregue</label>
                      <input className="input" type="date" value={item.data_entrega} onChange={(e) => setItem(idx, 'data_entrega', e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label className="label">Fotos de referência (máx. 3)</label>
                    <ImageUpload imagens={item.imagens} onChange={(imgs) => setItem(idx, 'imagens', imgs)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="card">
              <div className="flex justify-between text-sm mb-3">
                <span className="text-gray-600">Total do pedido:</span>
                <strong>R$ {valorTotal.toFixed(2)}</strong>
              </div>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-gray-600">Total pago:</span>
                <strong className="text-green-700">R$ {totalPago.toFixed(2)}</strong>
              </div>
              <div className={`flex justify-between text-sm font-semibold ${saldo > 0 ? 'text-orange-600' : 'text-green-700'}`}>
                <span>Saldo devedor:</span>
                <span>R$ {saldo.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3">
              {pagamentos.map((pg, idx) => (
                <div key={idx} className="card space-y-3">
                  <div className="flex items-center justify-between">
                    <select className="input max-w-[160px]" value={pg.tipo} onChange={(e) => setPagamentoField(idx, 'tipo', e.target.value)}>
                      {TIPO_PAG.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <button type="button" onClick={() => removerPagamento(idx)} className="text-red-500 text-sm min-h-[44px] px-2">Remover</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Valor (R$)</label>
                      <input className="input" type="number" step="0.01" min="0" value={pg.valor} onChange={(e) => setPagamentoField(idx, 'valor', e.target.value)} placeholder="0,00" />
                    </div>
                    <div>
                      <label className="label">Data</label>
                      <input className="input" type="date" value={pg.data_pagamento} onChange={(e) => setPagamentoField(idx, 'data_pagamento', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="label">Observação</label>
                    <input className="input" value={pg.observacao} onChange={(e) => setPagamentoField(idx, 'observacao', e.target.value)} />
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setPagamentos((prev) => [...prev, novoPagamento()])} className="btn-secondary w-full">
                + Registrar pagamento
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-6">
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Salvando...' : 'Salvar pedido'}
          </button>
          {isEdicao && <button type="button" onClick={handleDelete} className="btn-danger">Excluir</button>}
        </div>
      </form>
    </div>
  );
}
