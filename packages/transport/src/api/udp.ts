import UDP from 'dgram';
import { isNotUndefined } from '@trezor/utils';

import {
    AbstractApi,
    AbstractApiAwaitedResult,
    AbstractApiConstructorParams,
    DEVICE_TYPE,
} from './abstract';

import * as ERRORS from '../errors';

export class UdpApi extends AbstractApi {
    chunkSize = 64;

    protected interface = UDP.createSocket('udp4');
    protected communicating = false;

    private enumerationTimeout: ReturnType<typeof setTimeout> | undefined;
    private enumerateAbortController = new AbortController();

    constructor({ logger }: AbstractApiConstructorParams) {
        super({ logger });
    }

    listen() {
        if (this.listening) return;
        this.listening = true;

        const enumerateRecursive = () => {
            if (!this.listening) return;

            this.enumerationTimeout = setTimeout(() => {
                this.enumerate(this.enumerateAbortController.signal).finally(enumerateRecursive);
            }, 500);
        };

        enumerateRecursive();
    }

    public write(path: string, buffer: Buffer, signal?: AbortSignal) {
        const [hostname, port] = path.split(':');

        return new Promise<AbstractApiAwaitedResult<'write'>>(resolve => {
            signal?.addEventListener('abort', () => {
                resolve(
                    this.error({
                        error: ERRORS.ABORTED_BY_SIGNAL,
                    }),
                );
            });

            this.interface.send(buffer, Number.parseInt(port, 10), hostname, err => {
                if (signal?.aborted) {
                    return;
                }

                if (err) {
                    this.logger?.error(err.message);

                    resolve(
                        this.error({
                            error: ERRORS.INTERFACE_DATA_TRANSFER,
                            message: err.message,
                        }),
                    );
                }

                resolve(this.success(undefined));
            });
        });
    }

    public read(_path: string, signal?: AbortSignal) {
        this.communicating = true;

        return new Promise<AbstractApiAwaitedResult<'read'>>(resolve => {
            const onClear = () => {
                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                this.interface.removeListener('error', onError);
                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                this.interface.removeListener('message', onMessage);
            };

            const onError = (err: Error) => {
                this.logger?.error(err.message);

                resolve(
                    this.error({
                        error: ERRORS.INTERFACE_DATA_TRANSFER,
                        message: err.message,
                    }),
                );
                onClear();
            };
            const onMessage = (message: Buffer, _info: UDP.RemoteInfo) => {
                if (message.toString() === 'PONGPONG') {
                    return;
                }
                onClear();

                resolve(this.success(message));
            };
            const onAbort = () => {
                onClear();

                return resolve(
                    this.error({
                        error: ERRORS.ABORTED_BY_SIGNAL,
                    }),
                );
            };

            signal?.addEventListener('abort', onAbort);
            this.interface.addListener('error', onError);
            this.interface.addListener('message', onMessage);
        }).finally(() => {
            this.communicating = false;
        });
    }

    private async ping(path: string, signal?: AbortSignal) {
        await this.write(path, Buffer.from('PINGPING'), signal);
        if (signal?.aborted) {
            throw new Error(ERRORS.ABORTED_BY_SIGNAL);
        }

        const pinged = new Promise<boolean>(resolve => {
            const onError = () => {
                resolve(false);
                this.interface.removeListener('error', onError);
                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                this.interface.removeListener('message', onMessage);
                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                clearTimeout(timeout);
            };
            const onMessage = (message: Buffer, _info: UDP.RemoteInfo) => {
                if (message.toString() === 'PONGPONG') {
                    resolve(true);
                    this.interface.removeListener('error', onError);
                    this.interface.removeListener('message', onMessage);
                    // eslint-disable-next-line @typescript-eslint/no-use-before-define
                    clearTimeout(timeout);
                }
            };

            signal?.addEventListener('abort', onError);
            this.interface.addListener('error', onError);
            this.interface.addListener('message', onMessage);

            const timeout = setTimeout(onError, this.communicating ? 10000 : 500);
        });

        return pinged;
    }

    public async enumerate(signal?: AbortSignal) {
        // in theory we could support multiple devices, but we don't yet
        const paths = ['127.0.0.1:21324'];

        try {
            const enumerateResult = await Promise.all(
                paths.map(path =>
                    this.ping(path, signal).then(pinged =>
                        pinged ? { path, type: DEVICE_TYPE.TypeEmulator } : undefined,
                    ),
                ),
            ).then(res => res.filter(isNotUndefined));

            return this.success(enumerateResult);
        } catch (e) {
            return this.error({ error: ERRORS.ABORTED_BY_SIGNAL });
        }
    }

    public openDevice(_path: string, _first: boolean, _signal?: AbortSignal) {
        // todo: maybe ping?
        return Promise.resolve(this.success(undefined));
    }

    public closeDevice(_path: string) {
        return Promise.resolve(this.success(undefined));
    }

    public dispose() {
        this.interface.removeAllListeners();
        this.interface.close();
        this.listening = false;
        clearTimeout(this.enumerationTimeout);
        this.enumerateAbortController.abort();
    }
}
