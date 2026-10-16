import type { IpcProxyApi } from './types';

// partial Electron.IpcRendererEvent
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

// APIs callers may rely on rejections, other channels relies on resolve `{ success: false }` shape.
// - '*' allows rejection of every method of the channel.
// - string[] the list of methods allowed to reject for a specific channel.
type Rejectable = '*' | string[];
type AllowedToReject = Record<string, Rejectable | undefined>;

const isAllowedToReject = (channelName: string, method: string, all: AllowedToReject) => {
    const allowed = all[channelName];

    return allowed && (allowed === '*' || allowed.includes(method));
};

const createIpcProxyApi = (
    ipcRenderer: IpcRenderer,
    validChannels: string[],
    allowedToReject: AllowedToReject = {},
): IpcProxyApi => {
    let requestId = 0;

    const validateChannel = (channelName: string): true => {
        if (!validChannels.includes(channelName))
            throw new Error(`Proxy name ${channelName} not registered in electron preload`);

        return true;
    };

    const create = (channelName: string, instanceId: string, constructorParams: any) =>
        validateChannel(channelName) &&
        ipcRenderer.invoke(`${channelName}/create`, [
            `${channelName}/${instanceId}`,
            constructorParams,
        ]);

    const request = (channelName: string, instanceId: string, method: string, args: any[]) =>
        validateChannel(channelName) &&
        new Promise<any>((resolve, reject) => {
            requestId++;
            const responseEvent = `${channelName}/${instanceId}/response/${requestId}`;
            ipcRenderer.once(responseEvent, (_, response) => {
                // success/failure is wrapped in object. see ipcProxyHandler
                if (response.success) {
                    resolve(response.payload);
                } else if (isAllowedToReject(channelName, method, allowedToReject)) {
                    reject(response.error);
                } else {
                    resolve({
                        success: false,
                        error: {
                            message: response.error?.message ?? String(response.error),
                            code: 'IPC_PROXY_ERROR',
                        },
                    });
                }
            });
            ipcRenderer.send(`${channelName}/${instanceId}/request`, [responseEvent, method, args]);
        });

    const setHandler = (
        channelName: string,
        instanceId: string,
        eventName: string,
        listener: any,
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
        ipcRenderer.on(ipcEventName, (_, event) => listener(event));
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
    allowedToReject?: AllowedToReject;
}

export const exposeIpcProxy = (
    ipcRenderer: IpcRenderer,
    validChannels: string[] = [],
    options: IpcProxyGeneratorOptions = {},
) =>
    [
        options.proxyName || 'ipcProxy',
        createIpcProxyApi(ipcRenderer, validChannels, options.allowedToReject),
    ] as const;
