import { ipcRenderer, contextBridge } from 'electron';

// This file should be eventually added to trezor-connect/plugins.
// Provide ipc communication channel similar to desktopApi.
// TrezorConnectIpcChannel should not be used directly. Used only in ./packages/suite-desktop/src/support/trezor-connect-ipc-wrapper

type IpcListener = {
    type: string;
    listener: (...args: any[]) => any; // Real listener function
    ipcListener: Parameters<typeof ipcRenderer.on>[1]; // ipc listener function (wrapper for real listener)
};

const init = () => {
    let id = 0;

    // ipc listeners manager
    // ipcRenderer.on listener callback contains additional param at position 0. (Electron.IpcRendererEvent)
    // suite is not expecting this param therefore "real" listener needs to be wrapped by a function where this param is omitted.
    // both "real" and "wrapped" listeners references are stored and used as callbacks and removed by remove listener process.

    const ipcListeners: IpcListener[] = [];

    const addIpcListener = (type: string, fn: IpcListener['listener']) => {
        const listener: IpcListener = {
            type,
            listener: fn,
            ipcListener: (_, ...args) => fn(...args),
        };
        ipcRenderer.on(listener.type, listener.ipcListener);
        ipcListeners.push(listener);
    };

    const removeIpcListener = (type: string, fn: IpcListener['listener']) => {
        const listener = ipcListeners.find(
            item => item.type === type && item.listener.toString() === fn.toString(),
        );
        if (listener) {
            ipcRenderer.off(listener.type, listener.ipcListener);
            ipcListeners.splice(ipcListeners.indexOf(listener), 1);
        }
    };

    return (method: string, ...args: any[]) => {
        if (ipcRenderer.listenerCount('trezor-connect-event') === 0) {
            ipcRenderer.on('trezor-connect-event', (_, event) => {
                ipcListeners.filter(l => l.type === event.event).forEach(l => l.listener(event));
                ipcListeners
                    .filter(l => l.type === event.type)
                    .forEach(l => l.listener(event.payload));
            });
        }
        if (method === 'on') {
            return addIpcListener(args[0], args[1]);
        }
        if (method === 'off') {
            return removeIpcListener(args[0], args[1]);
        }
        // why not to use ipcRenderer.invoke? see description in ./src-electron/modules/trezor-connect-ipc
        // return ipcRenderer.invoke('trezor-connect-call', [method, ...args]);
        return new Promise(resolve => {
            id++;
            const responseEvent = `trezor-connect-response/${id}`;
            ipcRenderer.once(responseEvent, (_, r) => resolve(r));
            ipcRenderer.send('trezor-connect-call', [method, responseEvent, ...args]);
        });
    };
};

export const initTrezorConnectIpcChannel = () => {
    const TrezorConnectIpcChannel = init();
    contextBridge.exposeInMainWorld('TrezorConnectIpcChannel', TrezorConnectIpcChannel);
};
