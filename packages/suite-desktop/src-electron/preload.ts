import { contextBridge, ipcRenderer } from 'electron';

// todo: would be great to have these channels strongly typed. for example this is nice reading: https://blog.logrocket.com/electron-ipc-response-request-architecture-with-typescript/
const validChannels = [
    // app
    'app/restart',
    'app/focus',

    // bridge
    'bridge/start',

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
    'update/skip',

    // invity
    'buy-receiver',
    'spend/message',

    // window
    'window/is-maximized',
    'window/is-active',

    // tor
    'tor/status',
];

contextBridge.exposeInMainWorld('desktopApi', {
    /**
     * @deprecated Use dedicated methods instead of send
     */
    send: (channel: string, data?: any) => {
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
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
    // Updater
    checkForUpdates: (isManual?: boolean) => ipcRenderer.send('update/check', isManual),
    downloadUpdate: () => ipcRenderer.send('update/download'),
    installUpdate: () => ipcRenderer.send('update/install'),
    cancelUpdate: () => ipcRenderer.send('update/cancel'),
    skipUpdate: (version: string) => ipcRenderer.send('update/skip', version),

    // Window controls
    windowClose: () => ipcRenderer.send('window/close'),
    windowFocus: () => ipcRenderer.send('window/focus'),
    windowMinimize: () => ipcRenderer.send('window/minimize'),
    windowMaximize: () => ipcRenderer.send('window/maximize'),
    windowUnmaximize: () => ipcRenderer.send('window/unmaximize'),

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

    // Analytics
    getOSVersion: () => ipcRenderer.invoke('analytics/get-os-version'),
});
