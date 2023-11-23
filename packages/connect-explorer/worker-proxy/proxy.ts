// TODO: Crete new method getWorkerProxyMethods that will provide the methods that allow communication with service worker:

const getWorkerProxyApi = (proxyName: string) => {
    console.log('proxyName', proxyName);
    console.log('typeof window !== undefined', typeof window !== 'undefined');
    console.log('window[proxyName]', window[proxyName]);
    return typeof window !== 'undefined' ? window[proxyName] : undefined;
};

// BroadcastChannelApi
type WorkerProxyApi = {
    // TODO: should it be async?
    init: (constructorParams: any) => Promise<any>;
    // BroadCastChannel extends EventTarget
    onmessage: ((channel: BroadcastChannel, ev: MessageEvent) => any) | null;
    postMessage(message: any): void;
    close(): void;
};

let broadcastChannel;

const getWorkerProxyMethods = (
    workerProxyApi: WorkerProxyApi,
    channelName: string,
    instanceId: string,
) => {
    let initialized = false;

    const init = (constructorParams: any) => {
        console.log('create');
        console.log('constructorParams', constructorParams);
        if (initialized) return true;
        // Handshake with service worker
        broadcastChannel = new BroadcastChannel(`${channelName}/${instanceId}`);
        initialized = true;
        return new Promise(resolve => resolve(broadcastChannel));
    };

    const postMessage =
        (method: string) =>
        (...args: any[]) => {
            console.log('request in proxy');
            console.log('workerProxyApi', workerProxyApi);
            console.log('broadcastChannel', broadcastChannel);
            const channel = new BroadcastChannel(`${channelName}/${instanceId}`);
            return channel.postMessage({ method, args });
        };

    return {
        init,
        postMessage,
    };
};

interface WorkerProxyOptions {
    proxyName?: string;
    target?: Record<string, any>;
}

export const createWorkerProxy = async <T extends object>(
    channelName: string,
    options: WorkerProxyOptions = {},
    ...constructorParams: any[] // constructor of <T> params, could be undefined
) => {
    console.log('channelName', channelName);
    const proxyName = options?.proxyName || 'BroadcastChannel';

    const workerProxyApi = getWorkerProxyApi(proxyName);
    if (!workerProxyApi) {
        throw new Error(`${proxyName} not found`);
    }

    // const instanceId = await workerProxyApi.create(channelName, options.target);
    const instanceId = 'test';

    const { init, postMessage } = getWorkerProxyMethods(workerProxyApi, channelName, instanceId);

    await init(constructorParams);

    const prefix = `${channelName}/${instanceId}:`;
    const target = { _workerProxy: prefix, ...options.target } as T;

    const proxyHandler: ProxyHandler<T> = {
        get: (proxyTarget: any, name) => {
            console.log('get in proxy handler');
            console.log('proxyTarget', proxyTarget);
            console.log('name', name);

            if (typeof name === 'symbol') return proxyTarget[name];

            // exclude promise-like methods. they presence may be checked since the whole process is async
            if (['then', 'catch', 'finally'].includes(name)) return undefined;

            if (proxyTarget[name]) {
                return proxyTarget[name];
            }

            proxyTarget[name] = postMessage(name);
            return proxyTarget[name];
        },
    };

    return new Proxy(target, proxyHandler);
};
