import { createDeferred, Deferred } from '@trezor/utils/lib/createDeferred';

const getWorkerProxyApi = (proxyName: string) =>
    // @ts-expect-error
    typeof window !== 'undefined' ? window[proxyName] : undefined;

// BroadcastChannelApi
// type WorkerProxyApi = {
//     // TODO: should it be async?
//     init: (constructorParams: any) => Promise<any>;
//     // BroadCastChannel extends EventTarget
//     onmessage: ((channel: BroadcastChannel, ev: MessageEvent) => any) | null;
//     postMessage(message: any): void;
//     close(): void;
// };

let broadcastChannel: any;

let proxyCallId = 0;
let deferred: Deferred<any>[] = [];

const getWorkerProxyMethods = () =>
    // workerProxyApi: WorkerProxyApi,
    // channelName: string,
    // instanceId: string,
    {
        let initialized = false;

        const init = (constructorParams?: any) => {
            console.log('constructorParams in worker-proxy', constructorParams);
            if (initialized) return true;
            // Handshake with service worker
            broadcastChannel = new BroadcastChannel('connect-explorer');
            broadcastChannel.onmessage = (event: any) => {
                const { data } = event;
                const dfd = deferred.find(d => d.id === data.id);
                if (!dfd) {
                    return;
                }
                // TODO: handle errors.
                // if (data.type === RESPONSES.ERROR) {
                //     dfd.reject(new CustomError(data.payload.code, data.payload.message));
                // } else {
                //     dfd.resolve(data.payload);
                // }
                console.log('data.payload', data.payload);
                dfd.resolve(data.payload);
                deferred = deferred.filter(d => d !== dfd);
            };
            initialized = true;
        };

        const request =
            (method: string) =>
            (...args: any[]) => {
                console.log('request in worker proxy');
                console.log('method', method);
                console.log('args', args);
                console.log('broadcastChannel', broadcastChannel);
                if (!broadcastChannel) {
                    init();
                }
                const dfd = createDeferred(proxyCallId);
                deferred.push(dfd);
                broadcastChannel.postMessage({ method, args, id: proxyCallId });
                proxyCallId++;
                return dfd.promise;
            };

        return {
            init,
            request,
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
    const proxyName = options?.proxyName || 'BroadcastChannel';

    const workerProxyApi = getWorkerProxyApi(proxyName);
    if (!workerProxyApi) {
        throw new Error(`${proxyName} not found`);
    }

    // const instanceId = await workerProxyApi.create(channelName, options.target);
    const instanceId = 'test';

    // workerProxyApi, channelName, instanceId
    const { init, request } = getWorkerProxyMethods();

    await init(constructorParams);

    const prefix = `${channelName}/${instanceId}:`;
    const target = { _workerProxy: prefix, ...options.target } as T;

    const proxyHandler: ProxyHandler<T> = {
        get: (proxyTarget: any, name) => {
            if (typeof name === 'symbol') return proxyTarget[name];

            // exclude promise-like methods. they presence may be checked since the whole process is async
            if (['then', 'catch', 'finally'].includes(name)) return undefined;

            if (proxyTarget[name]) {
                return proxyTarget[name];
            }

            proxyTarget[name] = request(name);
            return proxyTarget[name];
        },
    };

    return new Proxy(target, proxyHandler);
};
