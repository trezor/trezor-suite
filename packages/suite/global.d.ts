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
}

declare global {
    interface Window {
        __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: () => any | null;
        desktopApi?: DesktopApi; // Electron API
    }
}
