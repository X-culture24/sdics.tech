import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'tech.sdics.officer',
  appName: 'SDICS Officer',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    webContentsDebuggingEnabled: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a2332',
      showSpinner: true,
      spinnerColor: '#00D084',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1a2332',
    },
  },
};

export default config;
