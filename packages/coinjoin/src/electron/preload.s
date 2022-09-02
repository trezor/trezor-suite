/* eslint-disable max-classes-per-file */
// This file should be imported in electron preload
import { EventEmitter } from 'events';

import type { CoinjoinBackend } from '../backend/CoinjoinBackend';
import type { Account, CoinjoinClient, CoinjoinClientSettings } from '../client/CoinjoinClient';

type IpcCallback = (evt: string, ...therest: any[]) => void;

type IpcRenderer = {
    on: (event: string, callback: IpcCallback) => any;
    off: (event: string, callback: IpcCallback) => any;
    once: (event: string, callback: IpcCallback) => number;
    listenerCount: (event: string) => number;
    send: (event: string, ...args: any[]) => any;
};

type IpcListener = {
    realEventName: string;
    realListener: (...args: any[]) => any; // Real listener function
    ipcEventName: string;
};

const listenersManager = () => {
    const ipcListeners: IpcListener[] = [];

    const addIpcListener = (
        realEventName: string,
        realListener: IpcListener['realListener'],
        ipcEventName: string,
    ) => {
        const listener: IpcListener = {
            realEventName,
            realListener,
            ipcEventName,
        };
        ipcListeners.push(listener);
    };

    const removeIpcListener = (
        realEventName: string,
        realListener: IpcListener['realListener'],
    ) => {
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

class IpcInstance extends EventEmitter {
    private prefix: string;
    private ipcListeners: IpcListener[] = [];
    constructor(prefix: string) {
        super();
        this.prefix = prefix;
    }
    foo() {}
}

const getCoinjoinApi = (ipcRenderer: IpcRenderer) => {
    // ipc listeners manager
    // ipcRenderer.on listener callback contains additional param at position 0. (Electron.IpcRendererEvent)
    // suite is not expecting this param therefore "real" listener needs to be wrapped by a function where this param is omitted.
    // both "real" and "wrapped" listeners references are stored and used as callbacks and removed by remove listener process.

    const createClient = <C>(prefix: string) => {
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
            ipcRenderer.send(`${prefix}/remove-listener`, [eventName, ipcEventName]);
        };

        let requestId = 0;

        const request =
            (method: keyof C) =>
            (...args: any[]) =>
                new Promise<any>(resolve => {
                    requestId++;
                    const responseEvent = `${prefix}/response/${requestId}`;
                    ipcRenderer.once(responseEvent, (_, r) => resolve(r));
                    ipcRenderer.send(`${prefix}/request`, [method, responseEvent, ...args]);
                });

        return {
            addListener,
            removeListener,
            request,
        };
    };

    // const addListener = (eventName: string, listener: any): any => {
    //     const ipcEventName = `${prefix}/event-listener/${eventName}`;
    //     addIpcListener(eventName, listener, ipcEventName);

    //     if (ipcRenderer.listenerCount(ipcEventName) === 0) {
    //         // use only one ipc listener and resolve realListeners here
    //         ipcRenderer.send(`${prefix}/add-listener`, [eventName, ipcEventName]);
    //         ipcRenderer.on(ipcEventName, (_, event) => {
    //             ipcListeners
    //                 .filter(l => l.ipcEventName === ipcEventName)
    //                 .forEach(l => l.realListener(...event));
    //         });
    //     }
    // };

    // class CoinjoinIpcClient extends EventEmitter implements CoinjoinClient {
    //     readonly settings: CoinjoinClientSettings;
    //     private prefix: string;
    //     constructor(settings: CoinjoinClientSettings) {
    //         super();
    //         this.prefix = `coinjoin-client/${settings.network}`;
    //         this.settings = settings;
    //     }

    //     on(...args: Parameters<CoinjoinClient['on']>) {
    //         addListener(...args);
    //         return this;
    //     }
    //     off(...args: Parameters<CoinjoinClient['on']>) {
    //         addListener(...args);
    //         return this;
    //     }
    //     enable(): Promise<never[]> {
    //         throw new Error('Method not implemented.');
    //     }
    //     disable(): void {
    //         throw new Error('Method not implemented.');
    //     }
    //     registerAccount(_account: Account): void {
    //         throw new Error('Method not implemented.');
    //     }
    //     updateAccount(_account: Account): void {
    //         throw new Error('Method not implemented.');
    //     }
    //     unregisterAccount(_descriptor: string): void {
    //         throw new Error('Method not implemented.');
    //     }
    //     resolveRequest(): void {
    //         throw new Error('Method not implemented.');
    //     }
    // }

    return {
        createClientInstance: (settings: any) => {
            ipcRenderer.send('coinjoin-client/create', settings); // This is handled in electron main

            const clientPrefix = `coinjoin-client/${settings.network}`;
            const { addListener, removeListener, request } =
                createClient<CoinjoinClient>(clientPrefix);

            // return CoinjoinClient interface, this object is serialized it couldn't be actual class
            return {
                settings,
                on: addListener,
                off: removeListener,
                enable: request('enable'),
                disable: request('disable'), // TODO: cleanup ipcRenderer listeners
                registerAccount: request('registerAccount'),
                updateAccount: request('updateAccount'),
                unregisterAccount: request('unregisterAccount'),
                resolveRequest: request('resolveRequest'),
            };
        },
        createBackendInstance: (settings: any): CoinjoinBackend => {
            ipcRenderer.send('coinjoin-backend/create', settings); // This is handled in electron main

            const clientPrefix = `coinjoin-backend/${settings.network}`;
            const { addListener, removeListener, request } =
                createClient<CoinjoinBackend>(clientPrefix);

            // return CoinjoinBackend interface, this object is serialized it couldn't be actual class
            return {
                settings,
                on: addListener,
                off: removeListener,
                getAccountInfo: request('getAccountInfo'),
                getAddressInfo: request('getAddressInfo'),
                cancel: request('cancel'),
            };
        },
    };
};

// return parameters of contextBridge.exposeInMainWorld function
export const exposeCoinjoinApi = (ipcRenderer: IpcRenderer) => {
    const api = getCoinjoinApi(ipcRenderer);
    return ['CoinjoinIpcChannel', api];
};
