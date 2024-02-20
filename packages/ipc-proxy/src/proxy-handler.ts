import { EventEmitter } from 'events';

interface EventEmitterApi {
    on: (event: any, listener: (...args: any[]) => any) => any;
    off?: (event: any, listener: (...args: any[]) => any) => any;
    removeAllListeners?: (event?: any) => any;
}

type ApiMethods<Api> = {
    [K in keyof Api]: Api[K] extends (...args: any[]) => any
        ? (method: K, argsTuple: Parameters<Api[K]>) => any
        : never;
};

type ApiUnion<Api> = ApiMethods<Api>[Exclude<keyof Api, keyof EventEmitter>];

interface IpcProxyInstance<Api extends EventEmitterApi> {
    onRequest: (
        ...args: Parameters<ApiUnion<Api>>
    ) => Promise<(...params: any[]) => any> | ((...params: any[]) => any);
    onAddListener?: NonNullable<EventEmitterApi['on']>; // NOTE: should be NonNullable<Api['on']> but it doesn't work with connect
    onRemoveListener?: NonNullable<Api['removeAllListeners']>;
}

export interface IpcProxyHandlerOptions<Api extends EventEmitterApi> {
    // called as constructor, args: constructor arguments
    onCreateInstance: (
        ...constructorParams: any[]
    ) => Promise<IpcProxyInstance<Api>> | IpcProxyInstance<Api>;
    debug?: typeof console;
}

interface IpcMainEvents<Api> {
    '/add-listener': [any, string]; // realEventName, ipcEventName
    '/remove-listener': [string]; // realEventName
    '/request': [string, ...Parameters<ApiUnion<Api>>]; // responseEvent, methodName, ...params
}

interface IpcMainHandlers<Api> {
    '/create': [string, ...any[]]; // channelName, ...params of interface constructor
    '/invoke': Parameters<ApiUnion<Api>>; // methodName, ...params
}

interface ElectronIpcMainEvent {
    // reply: (channel: string, response: any) => any; // in electron it's defined as `Function`
    // eslint-disable-next-line @typescript-eslint/ban-types
    reply: Function; // in electron it's defined as `Function`
}

interface ElectronIpcMain<Api> {
    on<K extends keyof IpcMainEvents<any>, Key extends string>(
        channel: `${Key}${K}`,
        listener: (event: ElectronIpcMainEvent, args: IpcMainEvents<Api>[K]) => void,
    ): any;
    on(channel: string, listener: (event: any, ...args: any[]) => void): any; // just to type compatibility with original Electron.IpcMain
    handle<K extends keyof IpcMainHandlers<Api>, Key extends string>(
        channel: `${Key}${K}`,
        listener: (event: any, args: IpcMainHandlers<Api>[K]) => void, // event: Electron.IpcMainInvokeEvent not used, not worth typing
    ): any;
    handle(channel: string, listener: (event: any, ...args: any[]) => void): any;
    removeAllListeners: (event?: string) => any;
    eventNames: () => (string | symbol)[];
    removeHandler: (name: string) => any;
}

const SERVICE_NAME = 'ipc-proxy';

/**
 * Create proxy
 */

export const createIpcProxyHandler = <Api extends EventEmitterApi>(
    ipcMain: ElectronIpcMain<Api>,
    channel: string,
    { onCreateInstance, debug }: IpcProxyHandlerOptions<Api>,
) => {
    debug?.info(SERVICE_NAME, `Init ipc interface ${channel}`);
    // Handle creation event from proxy-generator and creates actual interface instance
    ipcMain.handle(`${channel}/create`, async (_, [instancePrefix, constructorParams]) => {
        debug?.info(SERVICE_NAME, `Create ipc chanel ${instancePrefix}`);
        const { onRequest, onAddListener, onRemoveListener } = await onCreateInstance(
            ...constructorParams,
        );
        if (onAddListener) {
            ipcMain.on(
                `${instancePrefix}/add-listener`,
                ({ reply }, [realEventName, ipcEventName]) => {
                    debug?.info(SERVICE_NAME, `Adding listener ${realEventName}`);
                    onAddListener(realEventName, (...payload: any[]) => {
                        debug?.info(SERVICE_NAME, `Emit ${realEventName} as ${ipcEventName}`);
                        reply(ipcEventName, payload);
                    });
                },
            );
        }

        if (onRemoveListener) {
            ipcMain.on(`${instancePrefix}/remove-listener`, (_, [realEventName]) => {
                debug?.info(SERVICE_NAME, `Removing listeners ${realEventName}`);
                onRemoveListener(realEventName);
            });
        }

        // It would be easier to use ipcRenderer.invoke and return a promise directly from API[method]
        // BUT unfortunately ipcRenderer.invoke and ipcRenderer.on event listener works asynchronously and results with race conditions (possible electron bug)
        // instead of cycle of messages: START > progress > progress > progress > RESULT the Renderer process receives: START > progress > progress > RESULT > progress
        ipcMain.on(`${instancePrefix}/request`, async ({ reply }, [responseEvent, ...params]) => {
            // wrap failed requests and send to proxy-generator
            // it will resolve or reject awaited promise basing on success field
            try {
                // request function from api
                const payload = await onRequest(...params);
                reply(responseEvent, {
                    success: true,
                    payload,
                });
            } catch (error) {
                // catch runtime error
                reply(responseEvent, {
                    success: false,
                    error,
                });
            }
        });

        ipcMain.handle(`${instancePrefix}/invoke`, async (_, params) => {
            const payload = await onRequest(...params);

            return payload;
        });
    });

    return () => {
        // TODO: walk thru all instances, disable, remove listeners, remove references
        const unregistered = [];
        ipcMain.eventNames().forEach(name => {
            if (typeof name === 'string' && name.startsWith(`${channel}/`)) {
                ipcMain.removeAllListeners(name);
                unregistered.push(name);
            }
        });

        ipcMain.removeHandler(`${channel}/create`);
        // ipcMain.removeHandler(`${instancePrefix}/invoke`); // TODO: filter unregistered to get instancePrefix
        // TODO remove all invoke handlers
    };
};
