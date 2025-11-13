import { WebsocketClient } from '@trezor/websocket-client';

import { AbstractApi, AbstractApiConstructorParams } from './abstract';
import * as ERRORS from '../errors';
import { DescriptorApiLevel, PathInternal } from '../types';

type WebsocketRpcEvents = {
    descriptors: DescriptorApiLevel[];
};

/**
 * WebSocket API that proxies all calls to a remote WebSocket bridge server
 */
export class WebSocketProxyApi extends AbstractApi {
    private client: WebsocketClient<WebsocketRpcEvents>;
    public chunkSize = 64;

    constructor({ logger, type, url }: AbstractApiConstructorParams & { url: string }) {
        super({ logger, type });
        this.client = new WebsocketClient<WebsocketRpcEvents>({
            url,
            timeout: 20000,
            pingTimeout: 50000,
            keepAlive: true,
        });
    }

    async connect() {
        if (!this.client.isConnected()) {
            await this.client.connect();
        }
    }

    public isConnected(): boolean {
        return this.client.isConnected();
    }

    private async rpcCall<T = any>(method: string, params: Record<string, any> = {}): Promise<T> {
        await this.connect();

        // Convert Buffer to base64 string for transmission
        const serializedParams: Record<string, any> = {};
        for (const [key, value] of Object.entries(params)) {
            if (Buffer.isBuffer(value)) {
                serializedParams[key] = {
                    type: 'Buffer',
                    data: value.toString('base64'),
                };
            } else {
                serializedParams[key] = value;
            }
        }

        const response = await this.client.sendMessage({ method, ...serializedParams });

        if (!response.success) {
            throw new Error(response.error || 'RPC call failed');
        }

        // Convert base64 string back to Buffer if needed
        const payload = response.payload;
        if (
            payload &&
            typeof payload === 'object' &&
            payload.type === 'Buffer' &&
            typeof payload.data === 'string'
        ) {
            return Buffer.from(payload.data, 'base64') as T;
        }

        return payload;
    }

    public listen() {
        // Listen to WebSocket disconnection events
        this.client.on('disconnected', () => {
            this.logger?.debug('websocket: disconnected, emitting transport-interface-error');
            this.emit('transport-interface-error', { error: ERRORS.API_DISCONNECTED });
        });

        this.connect()
            .then(() => {
                // Subscribe to descriptor updates from server
                this.client.on('descriptors', (descriptors: DescriptorApiLevel[]) => {
                    this.emit('transport-interface-change', descriptors);
                });

                // Send listen request to server
                this.rpcCall('listen').catch(err => {
                    this.logger?.error('websocket: listen error', err);
                });
            })
            .catch(err => {
                this.logger?.error('websocket: connect error', err);
            });
    }

    public async enumerate(_signal?: AbortSignal) {
        try {
            const descriptors = await this.rpcCall<DescriptorApiLevel[]>('enumerate', {});

            return this.success(descriptors);
        } catch (err) {
            return this.unknownError(err);
        }
    }

    public async read(path: PathInternal, signal?: AbortSignal) {
        try {
            if (signal?.aborted) {
                return this.error({ error: ERRORS.ABORTED_BY_SIGNAL });
            }

            const buffer = await this.rpcCall<Buffer>('read', { path });

            return this.success(buffer);
        } catch (err) {
            return this.unknownError(err, [
                ERRORS.DEVICE_NOT_FOUND,
                ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE,
                ERRORS.INTERFACE_DATA_TRANSFER,
                ERRORS.DEVICE_DISCONNECTED_DURING_ACTION,
                ERRORS.UNEXPECTED_ERROR,
                ERRORS.ABORTED_BY_TIMEOUT,
                ERRORS.ABORTED_BY_SIGNAL,
            ]);
        }
    }

    public async write(path: PathInternal, buffer: Buffer, signal?: AbortSignal) {
        try {
            if (signal?.aborted) {
                return this.error({ error: ERRORS.ABORTED_BY_SIGNAL });
            }

            await this.rpcCall('write', {
                path,
                buffer,
            });

            return this.success(undefined);
        } catch (err) {
            return this.unknownError(err, [
                ERRORS.DEVICE_NOT_FOUND,
                ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE,
                ERRORS.INTERFACE_DATA_TRANSFER,
                ERRORS.DEVICE_DISCONNECTED_DURING_ACTION,
                ERRORS.ABORTED_BY_TIMEOUT,
                ERRORS.ABORTED_BY_SIGNAL,
                ERRORS.UNEXPECTED_ERROR,
            ]);
        }
    }

    public async openDevice(
        path: PathInternal,
        options?: {
            reset: boolean;
            signal?: AbortSignal;
            channel?: 'read' | 'trezor-push-notification' | 'battery-level';
        },
    ) {
        try {
            if (options?.signal?.aborted) {
                return this.error({ error: ERRORS.ABORTED_BY_SIGNAL });
            }

            await this.rpcCall('openDevice', {
                path,
                reset: options?.reset ?? false,
            });

            return this.success(undefined);
        } catch (err) {
            return this.unknownError(err, [
                ERRORS.DEVICE_NOT_FOUND,
                ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE,
                ERRORS.UNEXPECTED_ERROR,
                ERRORS.ABORTED_BY_TIMEOUT,
                ERRORS.ABORTED_BY_SIGNAL,
                ERRORS.LIBUSB_ERROR_ACCESS,
            ]);
        }
    }

    public async closeDevice(
        path: PathInternal,
        _options?: {
            channel?: 'read' | 'trezor-push-notification' | 'battery-level';
        },
    ) {
        try {
            await this.rpcCall('closeDevice', { path });

            return this.success(undefined);
        } catch (err) {
            return this.unknownError(err, [
                ERRORS.DEVICE_NOT_FOUND,
                ERRORS.INTERFACE_UNABLE_TO_CLOSE_DEVICE,
                ERRORS.UNEXPECTED_ERROR,
            ]);
        }
    }

    public dispose() {
        this.client.dispose();
    }
}
