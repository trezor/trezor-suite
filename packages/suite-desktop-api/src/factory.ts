import { DesktopApi, RendererChannels } from './api';
import { StrictIpcRenderer } from './ipc';
import * as validation from './validation';

// Provide fallback for missing ipcRenderer
const fallbackMethod = (...args: any[]) => console.error('desktopApi not available:', ...args);
const ipcRendererFallback: any = {
    on: fallbackMethod,
    once: fallbackMethod,
    removeAllListeners: fallbackMethod,
    send: fallbackMethod,
    invoke: (...args: any[]) =>
        Promise.reject(new Error(`desktopApi not available: ${args.join(',')}`)),
};

// ipcRenderer.on listener appends additional param `event: Electron.IpcRendererEvent`
const omitElectronEvent = <
    On extends (channel: any, listener: (_: any, ...arg: any[]) => void) => void, // interface of ipcRenderer.on/once
    Channel extends keyof RendererChannels,
    Listener extends (...args: any[]) => any,
>(
    on: On,
    channel: Channel,
    listener: Listener,
) => {
    if (validation.isValidChannel(channel)) on(channel, (_, ...args) => listener(...args)); // call listener without event
};

export const factory = <R extends StrictIpcRenderer<any>>(ipcRenderer?: R): DesktopApi => {
    if (!ipcRenderer) return factory(ipcRendererFallback);
    return {
        available: ipcRenderer !== ipcRendererFallback,
        on: (channel, listener) =>
            omitElectronEvent(ipcRenderer.on.bind(ipcRenderer), channel, listener),
        once: (channel, listener) =>
            omitElectronEvent(ipcRenderer.once.bind(ipcRenderer), channel, listener),
        removeAllListeners: channel => {
            if (validation.isValidChannel(channel)) ipcRenderer.removeAllListeners(channel);
        },

        // App
        appRestart: () => ipcRenderer.send('app/restart'),
        appFocus: () => ipcRenderer.send('app/focus'),

        // Auto-updater
        checkForUpdates: isManual => {
            if (validation.isPrimitive(['boolean', true], isManual))
                ipcRenderer.send('update/check', isManual);
        },
        downloadUpdate: () => ipcRenderer.send('update/download'),
        installUpdate: () => ipcRenderer.send('update/install'),
        cancelUpdate: () => ipcRenderer.send('update/cancel'),
        allowPrerelease: value => {
            if (validation.isPrimitive('boolean', value))
                ipcRenderer.send('update/allow-prerelease', value);
        },

        // Theme
        themeChange: theme => {
            if (validation.isTheme(theme)) ipcRenderer.send('theme/change', theme);
        },

        // Client
        clientReady: () => ipcRenderer.send('client/ready'),

        // Metadata
        metadataRead: options => {
            if (validation.isObject({ file: 'string' }, options)) {
                return ipcRenderer.invoke('metadata/read', options);
            }
            return Promise.resolve({ success: false, error: 'invalid params' });
        },
        metadataWrite: options => {
            if (validation.isObject({ file: 'string', content: 'string' }, options)) {
                return ipcRenderer.invoke('metadata/write', options);
            }
            return Promise.resolve({ success: false, error: 'invalid params' });
        },

        // HttpReceiver
        getHttpReceiverAddress: route => {
            if (validation.isPrimitive('string', route)) {
                return ipcRenderer.invoke('server/request-address', route);
            }
            return Promise.resolve(undefined);
        },

        // Tor
        getTorStatus: () => ipcRenderer.send('tor/get-status'),
        toggleTor: start => {
            if (validation.isPrimitive('boolean', start)) ipcRenderer.send('tor/toggle', start);
        },

        // Store
        clearStore: () => ipcRenderer.send('store/clear'),

        // user-data
        clearUserData: () => ipcRenderer.invoke('user-data/clear'),
        getUserDataInfo: () => ipcRenderer.invoke('user-data/get-info'),

        // Udev rules
        installUdevRules: () => ipcRenderer.invoke('udev/install'),
    };
};
