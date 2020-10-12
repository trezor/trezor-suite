import { contextBridge, ipcRenderer } from 'electron';

// todo: would be great to have these channels strongly typed. for example this is nice reading: https://blog.logrocket.com/electron-ipc-response-request-architecture-with-typescript/
const validChannels = [
    'app/restart',
    'bridge/start',

    'oauth/request-oauth-code',
    'oauth/code',
    'server/request-address',
    'server/address',

    'app/focus',

    // Update events
    'update/checking',
    'update/available',
    'update/not-available',
    'update/error',
    'update/downloading',
    'update/downloaded',
    'update/skip',

    // invity
    'buy-receiver',

    // window
    'window/is-maximized',
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
    on: (channel: string, func: Function) => {
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (_, ...args) => func(...args));
        }
    },
    off: (channel: string, func: Function) => {
        if (validChannels.includes(channel)) {
            ipcRenderer.off(channel, (_, ...args) => func(...args));
        }
    },
    // Updater
    checkForUpdates: () => ipcRenderer.send('update/check'),
    downloadUpdate: () => ipcRenderer.send('update/download'),
    installUpdate: () => ipcRenderer.send('update/install'),
    cancelUpdate: () => ipcRenderer.send('update/cancel'),
    skipUpdate: (version: string) => ipcRenderer.send('update/skip', version),

    // Window controls
    windowClose: () => ipcRenderer.send('window/close'),
    windowMinimize: () => ipcRenderer.send('window/minimize'),
    windowMaximize: () => ipcRenderer.send('window/maximize'),
    windowUnmaximize: () => ipcRenderer.send('window/unmaximize'),

    // Client
    clientReady: () => ipcRenderer.send('client/ready'),
});
