import type { IpcProxyGenerator } from './types';

const getIpcProxy = <T>(proxyName: string): IpcProxyGenerator<T> | undefined =>
    // @ts-expect-error this is the only window reference. not worth typing in global scope
    typeof window !== 'undefined' ? window[proxyName] : undefined;

interface IpcProxyOptions {
    proxyName?: string; // needs to be also set in `exposeIpcProxy` if changed here (see ./proxy-generator)
    target?: Record<string, any>; // set default fields in Proxy (initial fields which are not functions called on electron main context)
}

// This should be used only in electron renderer context.
// `Proxy` object cannot be defined and returned from electron preload native code context.
export const createIpcProxy = async <T>(
    channelName: string, // declared in `exposeIpcProxy` (see ./proxy-generator)
    options: IpcProxyOptions = {},
    ...constructorParams: any[] // constructor of <T> params, could be undefined
): Promise<T> => {
    const proxyName = options?.proxyName || 'ipcProxy';
    const generator = getIpcProxy<T>(proxyName);
    if (!generator) {
        throw new Error(`${proxyName} not found`);
    }
    const { target, proxy } = await generator(channelName, ...constructorParams);
    return new Proxy(
        { ...target, ...options.target },
        {
            // NOTE: pass only serializable object, params of `ProxyHandler` (target, name) to electron preload context.
            // `receiver` parameter (3rd) is an instance of Proxy object and could not be serialized
            get: (t, n) => proxy.get(t, n),
        },
    );
};
