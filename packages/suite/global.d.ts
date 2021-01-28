// Interface for exposed Electron API (ipcRenderer)
export interface DesktopApi {
    send: (channel: string, data?: any) => void;
    on: (channel: string, func: (...args: any[]) => any) => void;
    once: (channel: string, func: (...args: any[]) => any) => void;
    removeAllListeners: (channel: string) => void;
    // App Ready
    ready: () => void;
    // Auto Updater
    checkForUpdates: (isManual?: boolean) => void;
    downloadUpdate: () => void;
    installUpdate: () => void;
    cancelUpdate: () => void;
    skipUpdate: (version: string) => void;
    // Window controls
    windowClose: () => void;
    windowMinimize: () => void;
    windowFocus: () => void;
    windowMaximize: () => void;
    windowUnmaximize: () => void;
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
    // Analytics
    getOSVersion: () => Promise<
        | { success: true; payload: { platform: string; release: string } }
        | { success: false; error: string }
    >;
}

declare global {
    interface Window {
        __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: () => any | null;
        desktopApi?: DesktopApi; // Electron API
    }
}
