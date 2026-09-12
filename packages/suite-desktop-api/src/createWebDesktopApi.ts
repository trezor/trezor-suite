import { type DesktopApi } from './api';
import { factory } from './factory';

const unavailable = (...args: unknown[]) => console.error('desktopApi not available:', ...args);

// Web has no Electron main process to talk to, so every call is reported and every invoke rejects.
const webIpcRenderer: any = {
    on: unavailable,
    once: unavailable,
    removeAllListeners: unavailable,
    send: unavailable,
    invoke: (...args: unknown[]) =>
        Promise.reject(new Error(`desktopApi not available: ${args.join(',')}`)),
};

export const createWebDesktopApi = (): DesktopApi => ({
    ...factory(webIpcRenderer),
    available: false,
});
