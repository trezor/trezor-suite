import { Store } from '@suite-types';

declare global {
    interface Window {
        Cypress: any;
        store: Store;
        __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: () => any | null;
        desktopApi: DesktopApi; // Electron API
    }
}

// Interface for exposed Electron API (ipcRenderer)
interface DesktopApi {
    send: (channel: string, data?: any) => void;
    on: (channel: string, func: function) => void;
    off: (channel: string, func: function) => void;
}
