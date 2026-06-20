import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

const APK_URL = 'https://andreiabiscuit.apnet.tech/app.apk';
const DISMISSED_KEY = 'install-banner-dismissed';

function isAndroidChrome() {
  const ua = navigator.userAgent;
  return /Android/i.test(ua) && /Chrome/i.test(ua) && !/wv/.test(ua);
}

export default function InstallAppBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (
      !Capacitor.isNativePlatform() &&
      isAndroidChrome() &&
      !localStorage.getItem(DISMISSED_KEY)
    ) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3">
      <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-xl ring-1 ring-gray-100">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-rose-500 text-xl">
          🎀
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">Andreia Biscuit</p>
          <p className="text-xs text-gray-500">Instale o app para uma experiência melhor</p>
        </div>
        <a
          href={APK_URL}
          download="andreiabiscuit.apk"
          className="flex-shrink-0 rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white active:bg-rose-600"
        >
          Instalar
        </a>
        <button
          onClick={dismiss}
          className="flex-shrink-0 text-gray-400 active:text-gray-600"
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
