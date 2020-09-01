import { contextBridge, ipcRenderer } from 'electron';

const validChannels = ['restart-app', 'start-bridge', 'oauth-receiver', 'oauth'];

contextBridge.exposeInMainWorld('desktop_api', {
    send: (channel: string, data?: any) => {
        // whitelist channels
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    on: (channel: string, func: Function) => {
        if (validChannels.includes(channel)) {
            // @ts-ignore: event value not used on purpose
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    },
    off: (channel: string, func: Function) => {
        if (validChannels.includes(channel)) {
            // @ts-ignore: event value not used on purpose
            ipcRenderer.off(channel, (event, ...args) => func(...args));
        }
    },
});
