export {};
declare global {
    interface Window {
        __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: () => any | null;
        desktop_api: DesktopApi; // Electron API
    }
}

// Interface for exposed Electron API (ipcRenderer)
interface DesktopApi {
    send: (channel: string, data?: any) => void;
    on: (channel: string, func: function) => void;
    off: (channel: string, func: function) => void;
}
