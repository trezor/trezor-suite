import type { IpcProxyApi } from './types';

const getIpcProxyApi = (proxyName: string): IpcProxyApi | undefined =>
    // @ts-expect-error this is the only window reference. not worth typing in global scope
    typeof window !== 'undefined' ? window[proxyName] : undefined;

const getIpcMethods = (ipcProxy: IpcProxyApi, channelName: string, instanceId: string) => {
    let listeners: { eventName: string; listener: (...args: any[]) => any }[] = [];
    let created = false;

    const create = async (constructorParams: any) => {
        if (created) return true;
        // Handshake with electron main
        await ipcProxy.create(channelName, instanceId, constructorParams);
        created = true;
    };

    // It would be easier to use ipcRenderer.invoke and return a promise directly from API[method]
    // read more in ./proxy-handler
    const request =
        (method: string) =>
        (...args: any[]) =>
            ipcProxy.request(channelName, instanceId, method, args);

    const invoke =
        (method: string) =>
        (...args: any[]) =>
            ipcProxy.invoke(channelName, instanceId, method, args);

    const setOrClearHandler = (eventName: string) => {
        const eventListeners = listeners.filter(l => l.eventName === eventName);
        if (eventListeners.length) {
            ipcProxy.setHandler(channelName, instanceId, eventName, (event: any) =>
                eventListeners.forEach(l => l.listener(...event)),
            );
        } else {
            ipcProxy.clearHandler(channelName, instanceId, eventName);
        }
    };

    const addListener = (eventName: string, listener: any) => {
        listeners.push({ eventName, listener });
        setOrClearHandler(eventName);
    };

    const removeListener = (eventName: string, listener?: any) => {
        listeners = listeners.filter(
            l => l.eventName !== eventName || (listener && l.listener !== listener),
        );
        setOrClearHandler(eventName);
    };

    return {
        create,
        request,
        invoke,
        addListener,
        removeListener,
    };
};

interface IpcProxyOptions {
    proxyName?: string; // needs to be also set in `exposeIpcProxy` if changed here (see ./proxy-generator)
    target?: Record<string, any>; // set default fields in Proxy (initial fields which are not functions called on electron main context)
}

// This should be used only in electron renderer context.
// `Proxy` object cannot be defined and returned from electron preload native code context.
export const createIpcProxy = async <T extends object>(
    channelName: string, // declared in `exposeIpcProxy` (see ./proxy-generator)
    options: IpcProxyOptions = {},
    ...constructorParams: any[] // constructor of <T> params, could be undefined
): Promise<T> => {
    const proxyName = options?.proxyName || 'ipcProxy';

    const ipcProxyApi = getIpcProxyApi(proxyName);
    if (!ipcProxyApi) {
        throw new Error(`${proxyName} not found`);
    }

    const instanceId = (Date.now() + Math.random()).toString(36);

    const { create, request, addListener, removeListener } = getIpcMethods(
        ipcProxyApi,
        channelName,
        instanceId,
    );

    // try to handshake electron main layer (See ./proxy-handler)
    await create(constructorParams);

    const prefix = `${channelName}/${instanceId}`;

    const target = { _ipcProxy: prefix, ...options.target } as T;

    const proxyHandler: ProxyHandler<T> = {
        // NOTE: pass only serializable object, params of `ProxyHandler` (target, name) to electron preload context.
        // `receiver` parameter (3rd) is an instance of Proxy object and could not be serialized
        get: (proxyTarget: any, name) => {
            if (typeof name === 'symbol') return proxyTarget[name];

            // exclude promise-like methods. they presence may be checked since the whole process is async
            if (['then', 'catch', 'finally'].includes(name)) return undefined;

            if (proxyTarget[name]) {
                return proxyTarget[name];
            }

            // handle event-emitter-like methods
            if (name === 'on') {
                proxyTarget[name] = addListener;

                return proxyTarget[name];
            }

            if (name === 'off' || name === 'removeAllListeners') {
                proxyTarget[name] = removeListener;

                return proxyTarget[name];
            }

            proxyTarget[name] = request(name);

            return proxyTarget[name];
        },
    };

    return new Proxy(target, proxyHandler);
};
