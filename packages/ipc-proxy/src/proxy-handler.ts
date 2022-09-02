type Accepted = {
    // on: (event: any, listener: any) => any;
    on?: <T extends string, P extends (...args: any[]) => any>(event: T, listener: P) => any;
    off?: (event: any, listener: any) => any;
    removeAllListeners?: (event: any) => any;
};

type IsMethodCallable<T> = T extends (...args: infer A) => any ? A : never;

export interface IpcProxyHandlerOptions<Api extends Accepted> {
    onCreateInstance: (...args: any[]) => Promise<any>;
    onRequest?: <M extends keyof Api>(
        method: M,
        ...params: IsMethodCallable<Api[M]>
    ) => Promise<any>;
    onInvoke?: <M extends keyof Api>(method: M, ...params: Api[M][]) => Promise<any>;
    onAddListener?: NonNullable<Api['on']>;
    onRemoveListener?: NonNullable<Api['removeAllListeners']>;
    debug?: typeof console;
}

export const Foptions: IpcProxyHandlerOptions<FApi> = {
    onCreateInstance: () => Promise.resolve(1),
    onAddListener: (_event, _l) => {},
};

// Foptions.onAddListener!('mun-event-1', 1);

// partial electron IpcMain interface
// Electron.IpcMainEvent

interface IpcMainEvents<Api> {
    '/add-listener': [any, string]; // realEventName, ipcEventName
    '/remove-listener': [string]; // realEventName
    '/request': [keyof Api, string, ...IsMethodCallable<Api[keyof Api]>]; // methodName, responseName, ...params
}

interface IpcMainHandlers {
    '/create': [string, ...any[]]; // channelName, ...params of real interface constructor
    '/invoke': [any, ...any[]]; // methodName, ...params
}

// export declare interface CoinjoinClient {
//     on<K extends keyof CoinjoinClientEvents>(
//         type: K,
//         listener: (event: IpcMainEvent, ...args: CoinjoinClientEvents[K]) => void,
//     ): this;
//     // off<K extends keyof CoinjoinClientEvents>(
//     //     type: K,
//     //     listener: (
//     //         network: CoinjoinClientSettings['network'],
//     //         event: CoinjoinClientEvents[K],
//     //     ) => void,
//     // ): this;
//     // emit<K extends keyof CoinjoinClientEvents>(
//     //     type: K,
//     //     network: CoinjoinClientSettings['network'],
//     //     ...args: CoinjoinClientEvents[K][]
//     // ): boolean;
//     // removeAllListeners<K extends keyof CoinjoinClientEvents>(type?: K): this;
// }

interface ElectronIpcMainEvent {
    // reply: (channel: string, response: any) => any; // in electron it's defined as `Function`
    // eslint-disable-next-line @typescript-eslint/ban-types
    reply: Function; // in electron it's defined as `Function`
}
interface ElectronIpcMain<A> {
    // on: (channel: string, listener: (event: IpcMainEvent, ...args: any[]) => void) => any;
    on<K extends keyof IpcMainEvents<any>, Key extends string>(
        channel: `${Key}${K}`,
        listener: (event: ElectronIpcMainEvent, args: IpcMainEvents<A>[K]) => void,
    ): any;
    on(channel: string, listener: (event: any, ...args: any[]) => void): any; // just to type compatibility with original Electron.IpcMain
    handle<K extends keyof IpcMainHandlers, Key extends string>(
        channel: `${Key}${K}`,
        listener: (event: any, args: IpcMainHandlers[K]) => void, // event: Electron.IpcMainInvokeEvent not used, not worth typing
    ): any;
    handle(channel: string, listener: (event: any, ...args: any[]) => void): any;
    // on: <K extends string>(
    //     channel: `${K}/add-listener`,
    //     listener: (event: IpcMainEvent, ...args: any[]) => void,
    // ) => any;
    // on: <K extends string>(
    //     channel: `${K}/remove-listener`,
    //     listener: (event: IpcMainEvent, ...args: any[]) => void,
    // ) => any;
    removeAllListeners: (event?: string) => any;
    eventNames: () => (string | symbol)[];
    // handle: (name: string, listener: any) => any;
    removeHandler: (name: string) => any;
}

interface FApi {
    on(e: 'mun-event-1', _listener: 1): any;
    on(e: 'mun-event-2', _listener: 2): any;
}

const SERVICE_NAME = 'ipc-proxy';

export const createIpcProxyHandler = <Api extends Accepted>(
    ipcMain: ElectronIpcMain<Api>,
    channel: string,
    {
        onCreateInstance,
        onRequest,
        onInvoke,
        onAddListener,
        onRemoveListener,
        debug,
    }: IpcProxyHandlerOptions<Api>,
) => {
    debug?.info(SERVICE_NAME, `Init ipc interface ${channel}`);
    // Handle creation event from proxy-generator and creates actual interface instance
    ipcMain.handle(`${channel}/create`, async (_, [instancePrefix, params]) => {
        debug?.info(SERVICE_NAME, `Create ipc chanel ${instancePrefix}`);
        await onCreateInstance(...params);
        console.warn(SERVICE_NAME, 'Instance created', instancePrefix);
        if (onAddListener) {
            ipcMain.on(
                `${instancePrefix}/add-listener`,
                ({ reply }, [realEventName, ipcEventName]) => {
                    debug?.warn(SERVICE_NAME, `Adding listener ${realEventName}`);
                    onAddListener(realEventName, (...payload: any[]) => {
                        debug?.warn(SERVICE_NAME, `Emit ${realEventName} as ${ipcEventName}`);
                        reply(ipcEventName, payload);
                    });
                },
            );
        }

        if (onRemoveListener) {
            ipcMain.on(`${instancePrefix}/remove-listener`, (_, [realEventName]) => {
                debug?.warn(SERVICE_NAME, `Removing listeners ${realEventName}`);
                onRemoveListener(realEventName);
            });
        }

        if (onRequest) {
            ipcMain.on(
                `${instancePrefix}/request`,
                async ({ reply }, [method, responseEvent, ...params]) => {
                    // debug?.warn(SERVICE_NAME, 'Handle request', method, responseEvent, params);
                    // wrap failed requests and send to proxy-generator
                    // it will resolve or reject awaited promise basing on success field
                    try {
                        const payload = await onRequest(method, ...params);
                        // console.warn('OK!', payload);
                        reply(responseEvent, {
                            success: true,
                            payload,
                        });
                    } catch (error) {
                        console.warn('No ok', error);
                        reply(responseEvent, {
                            success: false,
                            error,
                        });
                    }
                },
            );
        }

        if (onInvoke) {
            ipcMain.handle(`${instancePrefix}/invoke`, async (_, [method, ...params]) => {
                const payload = await onInvoke(method, ...params);
                return payload;
            });
        }

        console.warn('-------------');
    });

    return () => {
        // TODO: walk thru all inscances, disable, remove listeners, remove references
        console.warn('Unregistering.....');
        const unregistered = [];
        ipcMain.eventNames().forEach(name => {
            if (typeof name === 'string' && name.startsWith(`${channel}/`)) {
                ipcMain.removeAllListeners(name);
                unregistered.push(name);
            }
        });

        ipcMain.removeHandler(`${channel}/create`);
        // ipcMain.removeHandler(`${instancePrefix}/invoke`); // TODO: filter unregistered to get instancePrefix
        // TODO remove invoke handlers
    };
};
