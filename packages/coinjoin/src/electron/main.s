// This file should be imported in electron main

import { CoinjoinBackend } from '../backend/CoinjoinBackend';
import { CoinjoinClient, CoinjoinClientSettings } from '../client/CoinjoinClient';

type InitParams = {
    ipcMain: { on: (event: string, cb: any) => any }; // electron.ipcMain
};

type AppWithParams<T extends { [key: string]: any }> = {
    [K in keyof T]: T[K] extends (...args: any[]) => any
        ? {
              name: K;
              app: Parameters<T[K]>;
          }
        : never;
};

type M<C, K extends keyof C> = C[K] extends () => any ? C[K] : never;
type Listeners<C extends CoinjoinClient> = [Parameters<C['on']>[0], string];
// type Request<C> = [keyof C, string, Parameters<M<C, keyof C>>];
type Request<C> = [keyof AppWithParams<C>, string, any[]];

type Foo = AppWithParams<CoinjoinClient>['name'];

export const initCoinjoinChannel = ({ ipcMain }: InitParams) => {
    const backends: CoinjoinBackend[] = [];
    const clients: CoinjoinClient[] = [];

    const getBackendInstance = (settings: any) => {
        const instance = backends.find(i => i.settings.network === settings.network);
        if (instance) return instance;

        const client = new CoinjoinBackend(settings);
        backends.push(client);
        return client;
    };

    const getClientInstance = (settings: CoinjoinClientSettings) => {
        const instance = clients.find(i => i.settings.network === settings.network);
        if (instance) return instance;

        const client = new CoinjoinClient(settings);
        clients.push(client);
        return client;
    };

    // Handle creation event from renderer and creates actual CoinjoinClient instance
    ipcMain.on('coinjoin-client/create', (_: any, settings: CoinjoinClientSettings) => {
        const channel = `coinjoin-client/${settings.network}`;
        const client = getClientInstance(settings);
        ipcMain.on(
            `${channel}/add-listener`,
            (
                { reply }: any, // Electron.IpcMainEvent,
                [realEventName, ipcEventName]: Listeners<CoinjoinClient>,
            ) => {
                client.on(realEventName, (...payload: any[]) => reply(ipcEventName, payload));
            },
        );
        ipcMain.on(
            `${channel}/remove-listener`,
            (
                _: any, // Electron.IpcMainEvent,
                [realEventName]: Listeners<CoinjoinClient>,
            ) => {
                client.removeAllListeners(realEventName);
            },
        );
        ipcMain.on(
            `${channel}/request`,
            async (
                { reply }: any, // Electron.IpcMainEvent,
                [method, responseEvent, ...params]: Request<CoinjoinClient>,
            ) => {
                const response = await client[method](...params);
                reply(responseEvent, response);
            },
        );
    });

    // Handle creation event from renderer and creates actual CoinjoinBackend instance
    ipcMain.on('coinjoin-backend/create', (_: any, settings: any) => {
        const channel = `coinjoin-backend/${settings.network}`;
        const backend = getBackendInstance(settings);
        backends.push(backend);
        ipcMain.on(
            `${channel}/add-listener`,
            (
                { reply }: any, // Electron.IpcMainEvent,
                [realEventName, ipcEventName]: Listeners<CoinjoinBackend>,
            ) => {
                backend.on(realEventName as any, (...payload: any[]) =>
                    reply(ipcEventName, payload),
                );
            },
        );
        ipcMain.on(
            `${channel}/remove-listener`,
            (
                _: any, // Electron.IpcMainEvent,
                [realEventName]: Listeners<CoinjoinBackend>,
            ) => {
                backend.removeAllListeners(realEventName as any);
            },
        );
        ipcMain.on(
            `${channel}/request`,
            async (
                { reply }: any, // Electron.IpcMainEvent,
                [method, responseEvent, ...params]: Request<CoinjoinBackend>,
            ) => {
                const response = await backend[method](...params);
                reply(responseEvent, response);
            },
        );
    });

    const dispose = () => {
        backends.forEach(i => i.cancel());
        backends.splice(0);
        clients.forEach(i => i.disable());
        clients.splice(0);
    };

    // TODO this ----
    return {
        dispose,
    };
};
