import { contextBridge, ipcRenderer } from 'electron';

// todo: would be great to have these channels strongly typed. for example this is nice reading: https://blog.logrocket.com/electron-ipc-response-request-architecture-with-typescript/
const validChannels = [
    // oauth
    'oauth/response',

    // Update events
    'update/enable',
    'update/checking',
    'update/available',
    'update/not-available',
    'update/error',
    'update/downloading',
    'update/downloaded',
    'update/new-version-first-run',
    'update/allow-prerelease',

    // invity
    'spend/message',

    // tor
    'tor/status',

    // custom protocol
    'protocol/open',
];

contextBridge.exposeInMainWorld('desktopApi', {
    on: (channel: string, func: (...args: any[]) => any) => {
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (_, ...args) => func(...args));
        }
    },
    once: (channel: string, func: (...args: any[]) => any) => {
        if (validChannels.includes(channel)) {
            ipcRenderer.once(channel, (_, ...args) => func(...args));
        }
    },
    removeAllListeners: (channel: string) => {
        if (validChannels.includes(channel)) {
            ipcRenderer.removeAllListeners(channel);
        }
    },

    // App
    appRestart: () => ipcRenderer.send('app/restart'),
    appFocus: () => ipcRenderer.send('app/focus'),

    // Auto-updater
    checkForUpdates: (isManual?: boolean) => ipcRenderer.send('update/check', isManual),
    downloadUpdate: () => ipcRenderer.send('update/download'),
    installUpdate: () => ipcRenderer.send('update/install'),
    cancelUpdate: () => ipcRenderer.send('update/cancel'),
    allowPrerelease: (value?: boolean) => ipcRenderer.send('update/allow-prerelease', value),

    // Theme
    themeChange: (theme: SuiteThemeVariant) => ipcRenderer.send('theme/change', theme),
    themeSystem: () => ipcRenderer.send('theme/system'),

    // Client
    clientReady: () => ipcRenderer.send('client/ready'),

    // Metadata
    metadataRead: (options: { file: string }) => ipcRenderer.invoke('metadata/read', options),
    metadataWrite: (options: { file: string; content: string }) =>
        ipcRenderer.invoke('metadata/write', options),

    // HttpReceiver
    getHttpReceiverAddress: (route: string) => ipcRenderer.invoke('server/request-address', route),

    // Tor
    getStatus: () => ipcRenderer.send('tor/get-status'),
    toggleTor: (start: boolean) => ipcRenderer.send('tor/toggle', start),
    getTorAddress: () => ipcRenderer.invoke('tor/get-address'),
    setTorAddress: (address: string) => ipcRenderer.send('tor/set-address', address),

    // Store
    clearStore: () => ipcRenderer.send('store/clear'),

    // Udev rules
    installUdevRules: () => ipcRenderer.invoke('udev/install'),
});
