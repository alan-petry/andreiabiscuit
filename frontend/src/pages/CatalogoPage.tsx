import { useEffect, useState } from 'react';
import api from '../services/api';
import Lightbox from '../components/Lightbox';

const WHATSAPP = '5554981197803';

export default function CatalogoPage() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [ampliada, setAmpliada] = useState<string | null>(null);

  useEffect(() => {
    api.get('/catalogo').then((r) => { setProdutos(r.data); setLoading(false); });
  }, []);

  const categorias = Array.from(
    new Map(
      produtos.filter((p) => p.categoria_id).map((p) => [p.categoria_id, p.categoria_nome])
    ).entries()
  );

  const filtrados = filtroCategoria
    ? produtos.filter((p) => String(p.categoria_id) === filtroCategoria)
    : produtos;

  function whatsappUrl(nome: string) {
    const texto = encodeURIComponent(`Olá! Tenho interesse no produto: *${nome}*`);
    return `https://wa.me/${WHATSAPP}?text=${texto}`;
  }

  return (
    <div className="min-h-screen bg-rose-50">
      {ampliada && <Lightbox src={ampliada} onClose={() => setAmpliada(null)} />}

      <header className="bg-rose-600 text-white sticky top-0 z-10 shadow">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-lg">🌸 Andreia Biscuit</span>
          <a
            href={`https://wa.me/${WHATSAPP}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs bg-white text-rose-600 px-3 py-1.5 rounded-full font-semibold"
          >
            WhatsApp
          </a>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Catálogo de Produtos</h1>
          <p className="text-sm text-gray-500">Peças artesanais em Biscuit feitas com carinho 🎀</p>
        </div>

        {categorias.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setFiltroCategoria('')}
              className={`btn text-xs whitespace-nowrap ${!filtroCategoria ? 'btn-primary' : 'btn-secondary'}`}
            >
              Todos
            </button>
            {categorias.map(([id, nome]) => (
              <button
                key={id}
                onClick={() => setFiltroCategoria(filtroCategoria === String(id) ? '' : String(id))}
                className={`btn text-xs whitespace-nowrap ${filtroCategoria === String(id) ? 'bg-rose-100 text-rose-700 font-semibold' : 'btn-secondary'}`}
              >
                {nome}
              </button>
            ))}
          </div>
        )}

        {loading && <div className="text-center py-12 text-gray-400">Carregando...</div>}

        {!loading && filtrados.length === 0 && (
          <div className="card text-center text-gray-400 py-12">
            <p className="text-4xl mb-2">🎀</p>
            <p>Nenhum produto disponível no momento</p>
          </div>
        )}

        <div className="space-y-4">
          {filtrados.map((p) => (
            <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {p.imagens?.length > 0 && (
                <div className="flex gap-1 p-2 overflow-x-auto">
                  {p.imagens.map((img: any, idx: number) => (
                    <img
                      key={idx}
                      src={img.imagem_base64}
                      alt=""
                      className="w-28 h-28 object-cover rounded-lg flex-shrink-0 cursor-zoom-in"
                      onClick={() => setAmpliada(img.imagem_base64)}
                    />
                  ))}
                </div>
              )}
              <div className="px-4 pb-4 pt-2 space-y-2">
                <div>
                  <p className="font-semibold text-gray-800">{p.nome}</p>
                  {p.categoria_nome && (
                    <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">{p.categoria_nome}</span>
                  )}
                </div>
                {p.descricao && <p className="text-sm text-gray-600">{p.descricao}</p>}
                {p.dimensoes && <p className="text-xs text-gray-400">📐 {p.dimensoes}</p>}
                <div className="flex items-center justify-between pt-1">
                  {Number(p.valor_base) > 0
                    ? <span className="font-bold text-rose-700 text-lg">R$ {Number(p.valor_base).toFixed(2)}</span>
                    : <span className="text-sm text-gray-400">Consulte o preço</span>
                  }
                  <a
                    href={whatsappUrl(p.nome)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn bg-green-500 text-white hover:bg-green-600 text-sm px-4"
                  >
                    Pedir pelo WhatsApp
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
