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
];

contextBridge.exposeInMainWorld('desktopApi', {
    send: (channel: string, data?: any) => {
        // whitelist channels
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    on: (channel: string, func: Function) => {
        if (validChannels.includes(channel)) {
            // event value not used on purpose
            ipcRenderer.on(channel, (_event, ...args) => func(...args));
        }
    },
    off: (channel: string, func: Function) => {
        if (validChannels.includes(channel)) {
            // event value not used on purpose
            ipcRenderer.off(channel, (_event, ...args) => func(...args));
        }
    },
});
