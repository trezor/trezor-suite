import { DesktopApi, RendererChannels } from './api';
import { StrictIpcRenderer } from './ipc';

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
    on(channel, (_, ...args) => listener(...args)); // call listener without event
};

export const factory = <R extends StrictIpcRenderer<any>>(ipcRenderer?: R): DesktopApi => {
    if (!ipcRenderer) return factory(ipcRendererFallback);
    return {
        available: ipcRenderer !== ipcRendererFallback,
        on: (channel, listener) =>
            omitElectronEvent(ipcRenderer.on.bind(ipcRenderer), channel, listener),
        once: (channel, listener) =>
            omitElectronEvent(ipcRenderer.on.bind(ipcRenderer), channel, listener),
        removeAllListeners: ipcRenderer.removeAllListeners,

        // App
        appRestart: () => ipcRenderer.send('app/restart'),
        appFocus: () => ipcRenderer.send('app/focus'),

        // Auto-updater
        checkForUpdates: isManual => ipcRenderer.send('update/check', isManual),
        downloadUpdate: () => ipcRenderer.send('update/download'),
        installUpdate: () => ipcRenderer.send('update/install'),
        cancelUpdate: () => ipcRenderer.send('update/cancel'),
        allowPrerelease: value => ipcRenderer.send('update/allow-prerelease', value),

        // Theme
        themeChange: theme => ipcRenderer.send('theme/change', theme),
        themeSystem: () => ipcRenderer.send('theme/system'),

        // Client
        clientReady: () => ipcRenderer.send('client/ready'),

        // Metadata
        metadataRead: options => ipcRenderer.invoke('metadata/read', options),
        metadataWrite: options => ipcRenderer.invoke('metadata/write', options),

        // HttpReceiver
        getHttpReceiverAddress: route => ipcRenderer.invoke('server/request-address', route),

        // Tor
        getStatus: () => ipcRenderer.send('tor/get-status'),
        toggleTor: start => ipcRenderer.send('tor/toggle', start),
        getTorAddress: () => ipcRenderer.invoke('tor/get-address'),
        setTorAddress: address => ipcRenderer.send('tor/set-address', address),

        // Store
        clearStore: () => ipcRenderer.send('store/clear'),

        // user-data
        clearUserData: () => ipcRenderer.invoke('user-data/clear'),
        getUserDataInfo: () => ipcRenderer.invoke('user-data/get-info'),

        // Udev rules
        installUdevRules: () => ipcRenderer.invoke('udev/install'),
    };
};
