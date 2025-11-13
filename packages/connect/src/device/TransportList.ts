import { SessionsClient, Transport, UsbApi, ApiType, UnifiedTransport } from '@trezor/transport';
import type { AbstractApi } from '@trezor/transport/src/api/abstract';

import { type UnifiedTransportParams } from '@trezor/transport/src/transports/unified';

type Params = Omit<UnifiedTransportParams, 'apis'> & {
    sessionsBackgroundUrl?: string | null;
} & {
    sessionsClient: SessionsClient;
};

const tryGetTransport = (transports: Transport[], name: string) =>
    transports.find(t => t.name === name);

/**
 * Check if running in browser environment
 */
const isBrowser = () => typeof window !== 'undefined' && typeof window.navigator !== 'undefined';

/**
 * Create appropriate USB API based on environment
 */
const createUsbApi = async (params: { logger?: Params['logger']; debugLink?: boolean }) => {
    if (isBrowser()) {
        // Browser environment: use WebUSB
        return new UsbApi({
            usbInterface: (navigator as any).usb,
            logger: params.logger,
            debugLink: params.debugLink,
        });
    } else {
        // Node.js environment: use node-usb
        const { WebUSB } = await import('usb');
        return new UsbApi({
            usbInterface: new WebUSB({ allowAllDevices: true }),
            logger: params.logger,
            debugLink: params.debugLink,
        });
    }
};

/**
 * Create UDP API (Node.js only)
 */
const createUdpApi = async (params: { logger?: Params['logger']; debugLink?: boolean }) => {
    const { UdpApi } = await import('@trezor/transport/src/api/udp');
    return new UdpApi({
        logger: params.logger,
        debugLink: params.debugLink,
    });
};

/**
 * Create WebSocket proxy API for bridge connection
 */
const createWebSocketProxyApi = async (params: {
    url: string;
    logger?: Params['logger'];
    type: 'usb' | 'udp';
}) => {
    const { WebSocketProxyApi } = await import('@trezor/transport/src/api/ws-proxy');
    return new WebSocketProxyApi(params);
};

const getDefaultSessionsBackgroundUrl = () => {
    if (isBrowser()) {
        return (
            window.location.origin +
            `${process.env.ASSET_PREFIX || ''}/workers/sessions-background-sharedworker.js`.replace(
                /\/+/g,
                '/',
            )
        );
    }
    return undefined;
};

const getOrCreateTransport = async (
    transports: Transport[],
    apiTypes: ApiType[] | undefined,
    params: Params,
): Promise<Transport> => {
    // Check if unified transport already exists
    const existing = tryGetTransport(transports, 'UnifiedTransport');
    if (existing) {
        return existing;
    }

    const apis: AbstractApi[] = [];

    // Determine which API types to create based on configuration
    // If apiTypes not specified, create all available APIs
    const shouldCreateUsb = !apiTypes || apiTypes.includes('usb');
    const shouldCreateUdp = !apiTypes || apiTypes.includes('udp');

    // Create APIs based on configuration

    // 1. WebSocket proxy APIs for bridge connections (if USB is enabled)
    if (shouldCreateUsb) {
        apis.push(
            await createWebSocketProxyApi({
                url: 'ws://127.0.0.1:21328/ws',
                logger: params.logger,
                type: 'usb',
            }),
        );
        apis.push(
            await createWebSocketProxyApi({
                url: 'ws://127.0.0.1:21325/ws',
                logger: params.logger,
                type: 'usb',
            }),
        );

        // 2. USB API (direct WebUSB or Node USB)
        apis.push(await createUsbApi({ logger: params.logger, debugLink: false }));
    }

    // 3. UDP API (Node.js only, for emulator, if UDP is enabled)
    if (shouldCreateUdp && !isBrowser()) {
        apis.push(await createUdpApi({ logger: params.logger, debugLink: false }));
    }

    const sessionsBackgroundUrl = params.sessionsBackgroundUrl ?? getDefaultSessionsBackgroundUrl();

    return new UnifiedTransport({
        ...params,
        apis,
        sessionsBackgroundUrl,
    });
};

export const createTransportList =
    (params: Params) => async (existing: Transport[], apiTypes?: ApiType[]) => {
        const transport = await getOrCreateTransport(existing, apiTypes, params);
        return [transport];
    };
