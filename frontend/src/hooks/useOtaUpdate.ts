import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { LiveUpdate } from '@capawesome/capacitor-live-update';

// Deriva a URL de updates do domínio da API (remove /api, adiciona /updates/latest.json)
const OTA_LATEST_URL =
  (import.meta.env.VITE_API_URL ?? '').replace(/\/api$/, '') + '/updates/latest.json';

interface LatestBundle {
  bundleId: string;
  url: string;
}

export function useOtaUpdate() {
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    async function checkForUpdate() {
      try {
        // Sinaliza que o app iniciou com sucesso (evita rollback automático)
        await LiveUpdate.ready();

        const { bundleId: currentBundleId } = await LiveUpdate.getCurrentBundle();

        const response = await fetch(OTA_LATEST_URL);
        if (!response.ok) return;

        const latest: LatestBundle = await response.json();
        if (!latest.bundleId || latest.bundleId === currentBundleId) return;

        await LiveUpdate.downloadBundle({ bundleId: latest.bundleId, url: latest.url });
        await LiveUpdate.setNextBundle({ bundleId: latest.bundleId });

        setUpdating(true);
        await new Promise<void>((resolve) => setTimeout(resolve, 1200));
        await LiveUpdate.reload();
      } catch {
        // Falha silenciosa — OTA nunca deve derrubar o app
      }
    }

    checkForUpdate();
  }, []);

  return { updating };
}
