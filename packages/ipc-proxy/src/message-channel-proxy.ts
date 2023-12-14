export interface ProxyChannel {
    channelName: string;
    postMessage: (...args: any[]) => any;
    handleMessage: (...args: any[]) => any;
}

export interface ProxyOptions {
    overrideApiMethods?: boolean;
    target?: any;
}

// interface ProxyMessage {
//     channelName: string;
//     instanceId: string;
// }

const getMethods = (channel: ProxyChannel, instanceId: string) => {
    let listeners: { eventName: string; listener: (...args: any[]) => any }[] = [];
    let created = false;
    let messageId = 0;
    const promises: Record<number, any> = {};

    const messageHeader = {
        channelName: channel.channelName,
        instanceId,
    };

    const request =
        (method: string) =>
        (...methodArgs: any[]) =>
            new Promise<any>(resolve => {
                promises[messageId] = resolve;
                channel.postMessage({
                    ...messageHeader,
                    id: messageId,
                    method,
                    methodArgs,
                });
                messageId++;
            });

    const create = async (constructorParams: any) => {
        if (created) return true;
        // TODO: handshake timeout
        await request('proxy-create')(constructorParams);
        created = true;
    };

    channel.handleMessage((data: any) => {
        if (promises[data.id]) {
            promises[data.id](data.payload);
            delete promises[data.id];
        }
    });

    const setOrClearHandler = (eventName: string) => {
        const eventListeners = listeners.filter(l => l.eventName === eventName);
        if (eventListeners.length) {
            channel.postMessage(channel.channelName, instanceId, eventName, (event: any) =>
                eventListeners.forEach(l => l.listener(...event)),
            );
        } else {
            channel.postMessage(channel.channelName, instanceId, eventName);
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
        addListener,
        removeListener,
    };
};

// Proxy. request function using message chanel
export const createProxy = async <T extends object>(
    apiFactory: () => Promise<{ api: T; channel: ProxyChannel }>,
    options?: ProxyOptions,
    ...constructorParams: any[] // constructor of <T> params, could be undefined
) => {
    const { api, channel } = await apiFactory();

    const instanceId = (Date.now() + Math.random()).toString(36);

    const { create, request, addListener, removeListener } = getMethods(channel, instanceId);

    await create(constructorParams);

    const prefix = `${channel.channelName}/${instanceId}`;

    const target = { _ipcProxy: prefix, ...options?.target } as T;

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

    const proxy = new Proxy(target, proxyHandler);

    // override each method of @trezor/connect using worker-proxy
    if (options?.overrideApiMethods) {
        Object.keys(api).forEach(method => {
            // @ts-expect-error
            if (typeof api[method] === 'function') {
                // @ts-expect-error
                api[method] = proxy[method];
            }
        });
    }

    return () => {
        // TODO: cleanup
    };
};
