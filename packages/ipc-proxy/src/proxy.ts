// return type of ./proxy-generator
type IpcProxyGenerator<T> = (
    name: string,
    ...params: any[]
) => {
    target: T;
    proxy: {
        get(target: T, p: string | symbol): any;
    };
};

const getIpcProxy = <T>(proxyName: string): IpcProxyGenerator<T> | undefined =>
    // @ts-expect-error the only window reference. not worth typing in global scope
    typeof window !== 'undefined' ? window[proxyName] : undefined;

interface IpcProxyOptions {
    proxyName?: string; // needs to be also set in `exposeIpcProxy` if changed here (see ./proxy-generator)
    target?: Record<string, any>; // set default fields in Proxy (fields which are not an async functions called on main context)
}

// This should be used only in renderer context.
// `Proxy` object cannot be established and returned from `electron preload` context.
export const createIpcProxy = <T>(
    channelName: string, // declared in `exposeIpcProxy` (see ./proxy-generator)
    options: IpcProxyOptions = {},
    ...constructorParams: any[] // constructor of <T> params, could be undefined
): T => {
    const proxyName = options?.proxyName || 'ipcProxy';
    const generator = getIpcProxy<T>(proxyName);
    if (!generator) {
        throw new Error(`${proxyName} not exposed in window`);
    }
    const { target, proxy } = generator(channelName, ...constructorParams);
    return new Proxy(
        { ...target, ...options.target },
        {
            // NOTE: filter only serializable params of ProxyHandler. `receiver` parameter (3rd) is an instance of Proxy object and could not be sent via ipc
            get: (target: any, name: string | symbol) => proxy.get(target, name),
        },
    );
};
