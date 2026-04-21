import { useRef, useState } from 'react';
import Lightbox from './Lightbox';

interface Props {
  imagens: string[];
  onChange: (imagens: string[]) => void;
  maxImagens?: number;
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
