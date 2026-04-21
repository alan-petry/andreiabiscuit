import { useEffect, useState } from 'react';
import api from '../services/api';
import Lightbox from '../components/Lightbox';

const WHATSAPP = '5554981197803';

function whatsappUrl(nome: string) {
  const texto = encodeURIComponent(`Olá! Tenho interesse no produto: *${nome}*`);
  return `https://wa.me/${WHATSAPP}?text=${texto}`;
}

function ModalProduto({ produto, onClose }: { produto: any; onClose: () => void }) {
  const [imgIdx, setImgIdx] = useState(0);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const imagens = produto.imagens || [];

  return (
    <>
      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
      <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Carrossel */}
        <div className="relative bg-gray-100">
          {imagens.length > 0 ? (
            <img
              src={imagens[imgIdx].imagem_base64}
              alt=""
              className="w-full h-64 object-contain cursor-zoom-in"
              onClick={() => setLightbox(imagens[imgIdx].imagem_base64)}
            />
          ) : (
            <div className="w-full h-48 flex items-center justify-center text-gray-300 text-5xl">🎀</div>
          )}
          {imagens.length > 1 && (
            <>
              <button
                onClick={() => setImgIdx((i) => (i - 1 + imagens.length) % imagens.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white w-8 h-8 rounded-full flex items-center justify-center text-lg"
              >‹</button>
              <button
                onClick={() => setImgIdx((i) => (i + 1) % imagens.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white w-8 h-8 rounded-full flex items-center justify-center text-lg"
              >›</button>
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                {imagens.map((_: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    className={`w-2 h-2 rounded-full ${i === imgIdx ? 'bg-rose-500' : 'bg-white/70'}`}
                  />
                ))}
              </div>
            </>
          )}
          <button onClick={onClose} className="absolute top-2 right-2 bg-black/40 text-white w-8 h-8 rounded-full flex items-center justify-center text-lg">×</button>
        </div>

        {/* Detalhes */}
        <div className="p-4 overflow-y-auto space-y-3">
          {produto.categoria_nome && (
            <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">{produto.categoria_nome}</span>
          )}
          <h2 className="font-bold text-lg text-gray-800">{produto.nome}</h2>
          {produto.descricao && <p className="text-sm text-gray-600">{produto.descricao}</p>}
          {produto.dimensoes && <p className="text-xs text-gray-400">📐 {produto.dimensoes}</p>}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            {Number(produto.valor_base) > 0
              ? <span className="font-bold text-rose-700 text-xl">R$ {Number(produto.valor_base).toFixed(2)}</span>
              : <span className="text-sm text-gray-400">Consulte o preço</span>
            }
          </div>
          <a
            href={whatsappUrl(produto.nome)}
            target="_blank"
            rel="noreferrer"
            className="btn bg-green-500 text-white hover:bg-green-600 w-full justify-center text-base font-semibold"
          >
            💬 Pedir pelo WhatsApp
          </a>
        </div>
      </div>
    </div>
    </>
  );
}

function ProdutoCard({ produto, onClick }: { produto: any; onClick: () => void }) {
  const img = produto.imagens?.[0]?.imagem_base64;
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      <button onClick={onClick} className="block w-full">
        {img
          ? <img src={img} alt={produto.nome} className="w-full h-44 object-cover" />
          : <div className="w-full h-44 bg-rose-50 flex items-center justify-center text-4xl">🎀</div>
        }
      </button>
      <div className="p-2 flex flex-col flex-1 gap-1">
        <p className="text-xs font-semibold text-gray-800 leading-tight line-clamp-2">{produto.nome}</p>
        {produto.dimensoes && <p className="text-xs text-gray-400 truncate">📐 {produto.dimensoes}</p>}
        <p className="text-sm font-bold text-rose-700 mt-auto">
          {Number(produto.valor_base) > 0 ? `R$ ${Number(produto.valor_base).toFixed(2)}` : 'Consulte'}
        </p>
        <a
          href={whatsappUrl(produto.nome)}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="btn bg-green-500 text-white hover:bg-green-600 w-full justify-center text-xs py-2 mt-1"
        >
          Pedir pelo WhatsApp
        </a>
      </div>
    </div>
  );
}

export default function CatalogoPage() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [selecionado, setSelecionado] = useState<any | null>(null);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {selecionado && <ModalProduto produto={selecionado} onClose={() => setSelecionado(null)} />}

      <header className="bg-rose-600 text-white sticky top-0 z-10 shadow">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
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

      <main className="max-w-6xl mx-auto px-3 py-4 space-y-4">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Catálogo de Produtos</h1>
          <p className="text-xs text-gray-500">Peças artesanais em Biscuit feitas com carinho 🎀</p>
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
                className={`btn text-xs whitespace-nowrap ${filtroCategoria === String(id) ? 'bg-rose-100 text-rose-700 font-semibold border border-rose-300' : 'btn-secondary'}`}
              >
                {nome}
              </button>
            ))}
          </div>
        )}

        {loading && <div className="text-center py-12 text-gray-400">Carregando...</div>}

        {!loading && filtrados.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            <p className="text-4xl mb-2">🎀</p>
            <p>Nenhum produto disponível no momento</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtrados.map((p) => (
            <ProdutoCard key={p.id} produto={p} onClick={() => setSelecionado(p)} />
          ))}
        </div>
      </main>
    </div>
  );
}
