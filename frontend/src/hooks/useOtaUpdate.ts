import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { LiveUpdate } from '@capawesome/capacitor-live-update';

const OTA_LATEST_URL =
  (import.meta.env.VITE_API_URL ?? '').replace(/\/api$/, '') + '/updates/latest.json';

const CHECK_INTERVAL_MS = 30 * 60 * 1000; // 30 minutos

interface LatestBundle {
  bundleId: string;
  url: string;
}

export function useOtaUpdate() {
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let checking = false;

    async function checkForUpdate() {
      if (checking) return;
      checking = true;
      try {
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
      } finally {
        checking = false;
      }
    }

    checkForUpdate();

    // Verifica quando o app volta ao foreground
    function onVisibilityChange() {
      if (document.visibilityState === 'visible') checkForUpdate();
    }
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Verifica periodicamente enquanto o app está aberto
    const interval = setInterval(checkForUpdate, CHECK_INTERVAL_MS);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearInterval(interval);
    };
  }, []);

  return { updating };
}
