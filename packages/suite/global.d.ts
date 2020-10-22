// Interface for exposed Electron API (ipcRenderer)
export interface DesktopApi {
    send: (channel: string, data?: any) => void;
    on: (channel: string, func: Function) => void;
    off: (channel: string, func: Function) => void;
    // App Ready
    ready: () => void;
    // Auto Updater
    checkForUpdates: () => void;
    downloadUpdate: () => void;
    installUpdate: () => void;
    cancelUpdate: () => void;
    skipUpdate: (version: string) => void;
    // Window controls
    windowClose: () => void;
    windowMinimize: () => void;
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
}

declare global {
    interface Window {
        __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: () => any | null;
        desktopApi?: DesktopApi; // Electron API
    }
}
