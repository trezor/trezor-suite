import type { IpcProxyApi } from './types';

// partial Electron.IpcRendererEvent
type IpcCallback = (event: unknown, ...args: unknown[]) => void;

// partial Electron.IpcRenderer
interface IpcRenderer {
    on: (channel: string, callback: IpcCallback) => unknown;
    off: (channel: string, callback: IpcCallback) => unknown;
    once: (channel: string, callback: IpcCallback) => unknown;
    removeAllListeners: (channel: string) => unknown;
    listenerCount: (channel: string) => number;
    send: (channel: string, args: unknown[]) => unknown;
    invoke: (channel: string, args: unknown[]) => Promise<unknown>;
}

const createIpcProxyApi = (ipcRenderer: IpcRenderer, validChannels: string[]): IpcProxyApi => {
    let requestId = 0;

    const validateChannel = (channelName: string): true => {
        if (!validChannels.includes(channelName))
            throw new Error(`Proxy name ${channelName} not registered in electron preload`);

        return true;
    };

    const create = (channelName: string, instanceId: string, constructorParams: unknown) =>
        validateChannel(channelName) &&
        ipcRenderer.invoke(`${channelName}/create`, [
            `${channelName}/${instanceId}`,
            constructorParams,
        ]);

    const request = (channelName: string, instanceId: string, method: string, args: unknown[]) =>
        validateChannel(channelName) &&
        new Promise<unknown>((resolve, reject) => {
            requestId++;
            const responseEvent = `${channelName}/${instanceId}/response/${requestId}`;
            ipcRenderer.once(responseEvent, (_, response) => {
                // success/failure is wrapped in object. see ipcProxyHandler
                const { success, payload, error } = response as {
                    success: boolean;
                    payload: unknown;
                    error: unknown;
                };
                if (success) {
                    resolve(payload);
                } else {
                    reject(error);
                }
            });
            ipcRenderer.send(`${channelName}/${instanceId}/request`, [responseEvent, method, args]);
        });

    const setHandler = (
        channelName: string,
        instanceId: string,
        eventName: string,
        listener: (event: unknown[]) => void,
    ) => {
        validateChannel(channelName);
        const ipcEventName = `${channelName}/${instanceId}/event-listener/${eventName}`;
        if (ipcRenderer.listenerCount(ipcEventName)) {
            ipcRenderer.removeAllListeners(ipcEventName);
        } else {
            ipcRenderer.send(`${channelName}/${instanceId}/add-listener`, [
                eventName,
                ipcEventName,
            ]);
        }
        ipcRenderer.on(ipcEventName, (_, event) => listener(event as unknown[]));
    };

    const clearHandler = (channelName: string, instanceId: string, eventName: string) => {
        validateChannel(channelName);
        const ipcEventName = `${channelName}/${instanceId}/event-listener/${eventName}`;
        ipcRenderer.removeAllListeners(ipcEventName);
        ipcRenderer.send(`${channelName}/${instanceId}/remove-listener`, [eventName, ipcEventName]);
    };

    return {
        create,
        request,
        setHandler,
        clearHandler,
    };
};

interface IpcProxyGeneratorOptions {
    proxyName?: string; // needs to be also set in `createIpcProxy` if changed here (see ./proxy)
}

export const exposeIpcProxy = (
    ipcRenderer: IpcRenderer,
    validChannels: string[] = [],
    options: IpcProxyGeneratorOptions = {},
) => [options.proxyName || 'ipcProxy', createIpcProxyApi(ipcRenderer, validChannels)] as const;
