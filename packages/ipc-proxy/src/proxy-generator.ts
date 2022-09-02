/* eslint-disable max-classes-per-file */
// This file should be imported in electron preload

// (IpcRendererEvent)
type IpcCallback = (event: any, ...args: any[]) => void;

// partial Electron.IpcRenderer
interface IpcRenderer {
    on: (channel: string, callback: IpcCallback) => any;
    off: (channel: string, callback: IpcCallback) => any;
    once: (channel: string, callback: IpcCallback) => any;
    removeAllListeners: (channel: string) => any;
    listenerCount: (channel: string) => number;
    send: (channel: string, ...args: any[]) => any;
    invoke: (channel: string, ...args: any[]) => Promise<any>;
}

interface IpcListener {
    realEventName: string;
    realListener: (...args: any[]) => any; // Real listener function
    ipcEventName: string;
}

// ipc listeners manager
// ipcRenderer.on listener callback contains additional param at position 0. (Electron.IpcRendererEvent)
// suite is not expecting this param therefore "real" listener needs to be wrapped by a function where this param is omitted.
// both "real" and "wrapped" listeners references are stored and used as callbacks and removed by remove listener process.

const listenersManager = () => {
    const ipcListeners: IpcListener[] = [];

    const addIpcListener = (
        realEventName: string,
        realListener: IpcListener['realListener'],
        ipcEventName: string,
    ) => {
        ipcListeners.push({
            realEventName,
            realListener,
            ipcEventName,
        });
    };

    const removeIpcListener = (
        realEventName: string,
        realListener?: IpcListener['realListener'],
    ) => {
        if (!realListener) {
            let i = ipcListeners.findIndex(item => item.realEventName === realEventName);
            while (i >= 0) {
                ipcListeners.splice(i, 1);
                i = ipcListeners.findIndex(item => item.realEventName === realEventName);
            }
            return;
        }
        const listener = ipcListeners.find(
            item =>
                item.realEventName === realEventName &&
                item.realListener.toString() === realListener.toString(),
        );
        if (listener) {
            ipcListeners.splice(ipcListeners.indexOf(listener), 1);
        }
    };

    return {
        ipcListeners,
        addIpcListener,
        removeIpcListener,
    };
};

export const getIpcMethods = (ipcRenderer: IpcRenderer, prefix: string) => {
    const { ipcListeners, addIpcListener, removeIpcListener } = listenersManager();

    const addListener = (eventName: string, listener: any): any => {
        const ipcEventName = `${prefix}/event-listener/${eventName}`;
        addIpcListener(eventName, listener, ipcEventName);

        if (ipcRenderer.listenerCount(ipcEventName) === 0) {
            // use only one ipc listener and resolve realListeners here
            ipcRenderer.send(`${prefix}/add-listener`, [eventName, ipcEventName]);
            ipcRenderer.on(ipcEventName, (_, event) => {
                ipcListeners
                    .filter(l => l.ipcEventName === ipcEventName)
                    .forEach(l => l.realListener(...event));
            });
        }
    };

    const removeListener = (eventName: string, listener: any): any => {
        const ipcEventName = `${prefix}/event-listener/${eventName}`;
        removeIpcListener(eventName, listener);

        if (ipcListeners.filter(l => l.ipcEventName === ipcEventName).length > 0) {
            ipcRenderer.removeAllListeners(ipcEventName);
            ipcRenderer.send(`${prefix}/remove-listener`, [eventName, ipcEventName]);
        }
    };

    let requestId = 0;

    const request =
        (method: string) =>
        (...args: any[]) =>
            new Promise<any>((resolve, reject) => {
                requestId++;
                const responseEvent = `${prefix}/response/${requestId}`;
                ipcRenderer.once(responseEvent, (_, response) => {
                    console.warn('RECEIVED!', responseEvent, response);
                    // success/failure is wrapped in object. see ipcProxyHandler
                    if (response.success) {
                        resolve(response.payload);
                    } else {
                        reject(response.error);
                    }
                });
                ipcRenderer.send(`${prefix}/request`, [method, responseEvent, ...args]);
            });

    const invoke =
        (method: string) =>
        (...args: any[]) =>
            ipcRenderer.invoke(`${prefix}/invoke`, [method, ...args]);

    return {
        addListener,
        removeListener,
        request,
        invoke,
    };
};

const factory =
    (ipcRenderer: IpcRenderer, validChannels: string[], channelName: string) =>
    (...params: any[]) => {
        if (!validChannels.includes(channelName))
            throw new Error(`Proxy name ${channelName} not registered in electron preload`);
        const instancePrefix = `${channelName}/${(Date.now() + Math.random()).toString(36)}`;
        const { addListener, removeListener, request } = getIpcMethods(ipcRenderer, instancePrefix);
        const ipcInterface: Record<string, any> = {
            _ipcProxy: instancePrefix,
        };

        // Handshake with electron main
        ipcRenderer.invoke(`${channelName}/create`, [instancePrefix, params]).catch(error => {
            console.error('IpcProxyGenerator', error); // unexpected error
        });

        const proxy = {
            get: (target: any, name: any) => {
                // exclude promise-like methods. they presence may be checked since the whole process is async
                if (['then', 'catch', 'finally'].includes(name)) return undefined;
                if (target[name]) {
                    return target[name];
                }
                // handle event-emitter-like methods
                if (name === 'on') {
                    target[name] = addListener;
                    return target[name];
                }
                if (['off', 'removeAllListeners'].includes(name)) {
                    target[name] = removeListener;
                    return target[name];
                }
                target[name] = request(name);
                return target[name];
            },
        };

        return { target: ipcInterface, proxy };
    };

// return params of electron contextBridge.exposeInMainWorld: [string, factoryFunction]

interface IpcProxyGeneratorOptions {
    proxyName?: string; // needs to be also set in `createIpcProxy` if changed here (see ./proxy)
}

export const exposeIpcProxy = (
    ipcRenderer: IpcRenderer,
    validChannels: string[] = [],
    options: IpcProxyGeneratorOptions = {},
) =>
    [
        options.proxyName || 'ipcProxy', // name used in window see ./proxy
        (channelName: string, ...params: any[]) =>
            factory(ipcRenderer, validChannels, channelName)(...params),
    ] as const;
