type SuiteThemeVariant = 'light' | 'dark' | 'custom';

// Interface for exposed Electron API (ipcRenderer)
interface DesktopApi {
    on: (channel: string, func: (...args: any[]) => any) => void;
    once: (channel: string, func: (...args: any[]) => any) => void;
    removeAllListeners: (channel: string) => void;
    // App
    appRestart: () => void;
    appFocus: () => void;
    // Auto-updater
    checkForUpdates: (isManual?: boolean) => void;
    allowPrerelease: (value?: boolean) => void;
    downloadUpdate: () => void;
    installUpdate: () => void;
    cancelUpdate: () => void;
    // Theme
    themeChange: (theme: SuiteThemeVariant) => void;
    themeSystem: () => void;
    // Client controls
    clientReady: () => void;
    // Metadata
    metadataWrite: (options: {
        file: string;
        content: string;
    }) => Promise<{ success: true } | { success: false; error: string }>;
    metadataRead: (options: {
        file: string;
    }) => Promise<{ success: true; payload: string } | { success: false; error: string }>;
    // HttpReceiver
    getHttpReceiverAddress: (route: string) => Promise<string>;
    // Tor
    getStatus: () => void;
    toggleTor: (start: boolean) => void;
    getTorAddress: () => Promise<string>;
    setTorAddress: (address: string) => void;
    // Store
    clearStore: () => void;
    // Udev rules
    installUdevRules: () => Promise<{ success: true } | { success: false; error: string }>;
}

interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: (props: any) => any | null;
    desktopApi?: DesktopApi; // Electron API
    chrome?: any; // Only in Chromium browsers

    // Needed for Cypress
    Cypress?: any;
    TrezorConnect?: any;
    store?: any;
}
