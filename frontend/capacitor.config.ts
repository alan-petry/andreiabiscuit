import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'tech.apnet.andreiabiscuit',
  appName: 'Andreia Biscuit',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    LiveUpdate: {
      appId: 'andreiabiscuit',
      autoDeleteBundles: true,
    },
  },
};

export default config;
