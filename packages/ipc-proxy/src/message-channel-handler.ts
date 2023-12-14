import type { ProxyChannel } from './message-channel-proxy';

// Proxy handler. call actual api
export const createProxyHandler = async <T>(
    apiFactory: () => Promise<{ api: T; channel: ProxyChannel }>,
) => {
    const { api, channel } = await apiFactory();

    const response = (data: any, payload: any) => ({
        id: data.id,
        channelName: data.channelName,
        instanceId: data.instanceId,
        payload,
    });

    const handler = async (data: any) => {
        if (data.method === 'proxy-create') {
            channel.postMessage(
                response(data, {
                    success: true,
                    payload: 'Handshake-data?',
                }),
            );
            return;
        }
        // TODO: handle event listeners
        try {
            // @ts-expect-error
            const payload = await api[data.method](data.methodArgs);
            channel.postMessage(response(data, payload));
        } catch (error) {
            channel.postMessage(
                response(data, {
                    success: false,
                    payload: error,
                }),
            );
        }
    };

    channel.handleMessage(handler);

    return () => {
        // TODO: cleanup
    };
};
