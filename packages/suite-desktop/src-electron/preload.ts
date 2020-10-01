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
];

contextBridge.exposeInMainWorld('desktopApi', {
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
    // App ready
    ready: () => ipcRenderer.send('ready'),
    // Updater
    checkForUpdates: () => ipcRenderer.send('update/check'),
    downloadUpdate: () => ipcRenderer.send('update/download'),
    installUpdate: () => ipcRenderer.send('update/install'),
});
