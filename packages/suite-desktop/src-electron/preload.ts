import { contextBridge, ipcRenderer } from 'electron';

// TODO: Move to exported constant (to be shared)
const validChannels = [
    'restart-app',
    'start-bridge',
    'oauth-receiver',
    'oauth',
    // Events
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
