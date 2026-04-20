import { useRef, useState } from 'react';

interface Props {
  imagens: string[];
  onChange: (imagens: string[]) => void;
  maxImagens?: number;
}

function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white text-3xl leading-none w-10 h-10 flex items-center justify-center"
        onClick={onClose}
      >
        ×
      </button>
      <img
        src={src}
        alt=""
        className="max-w-full max-h-full object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export default function ImageUpload({ imagens, onChange, maxImagens = 3 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [ampliada, setAmpliada] = useState<string | null>(null);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const disponivel = maxImagens - imagens.length;
    const selecionados = Array.from(files).slice(0, disponivel);
    Promise.all(
      selecionados.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          }),
      ),
    ).then((novas) => onChange([...imagens, ...novas]));
  }

  function remover(e: React.MouseEvent, idx: number) {
    e.stopPropagation();
    onChange(imagens.filter((_, i) => i !== idx));
  }

  return (
    <>
      {ampliada && <Lightbox src={ampliada} onClose={() => setAmpliada(null)} />}

      <div className="space-y-2">
        <div className="flex gap-2 flex-wrap">
          {imagens.map((src, idx) => (
            <div key={idx} className="relative w-24 h-24">
              <img
                src={src}
                alt=""
                className="w-24 h-24 object-cover rounded-lg border border-gray-200 cursor-zoom-in active:opacity-80"
                onClick={() => setAmpliada(src)}
              />
              <button
                type="button"
                onClick={(e) => remover(e, idx)}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
          {imagens.length < maxImagens && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-rose-400 hover:text-rose-400 transition-colors"
            >
              <span className="text-2xl">+</span>
              <span className="text-xs">Foto</span>
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <p className="text-xs text-gray-400">{imagens.length}/{maxImagens} fotos</p>
      </div>
    </>
  );
}
