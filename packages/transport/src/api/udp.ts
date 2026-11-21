import UDP from 'dgram';

import {
    AbstractApi,
    type AbstractApiArgs,
    type AbstractApiAwaitedResult,
    type AbstractApiConstructorParams,
    DEVICE_TYPE,
    type DescriptorApiLevel,
    TRANSPORT_ERROR as ERRORS,
    PathInternal,
    error,
    readMessageBuffer,
    success,
} from '@trezor/transport-common';
import { arrayPartition, isNotUndefined, resolveAfter } from '@trezor/utils';

const PING = Buffer.from('PINGPING');
const PONG = Buffer.from('PONGPONG');
const PING_TIMEOUT = 1000;

export class UdpApi extends AbstractApi {
    chunkSize = 64;

    protected devices: DescriptorApiLevel[] = [];
    private listenAbortController = new AbortController();
    protected interface = UDP.createSocket({
        type: 'udp4',
        signal: this.listenAbortController.signal,
    });
    private debugLink?: boolean;
    private readBuffer: ReturnType<typeof readMessageBuffer>;
    private openedDevices = new Set<string>();
    private lastPongTimestamp = 0;

    constructor({
        logger,
        debugLink,
    }: Omit<AbstractApiConstructorParams, 'type'> & { debugLink?: boolean }) {
        super({ logger, type: 'udp' });
        this.debugLink = debugLink;
        this.readBuffer = readMessageBuffer();

        const onMessage = (message: Buffer, info: UDP.RemoteInfo) => {
            this.lastPongTimestamp = Date.now();

            if (message.compare(PONG) === 0) {
                return;
            }

            const id = `${info.address}:${info.port}`;
            if (this.openedDevices.has(id)) {
                this.readBuffer.onMessage(id, message);
            }
            this.logger?.debug('udp: globalOnMessage log:', message.toString('hex'));
        };
        this.interface.addListener('message', onMessage);
    }

    listen() {
        if (this.listening) return;
        this.listening = true;
        this.listenLoop();
    }

    private async listenLoop() {
        while (this.listening) {
            await resolveAfter(500);
            if (!this.listening) break;
            await this.enumerate(this.listenAbortController.signal);
        }
    }

    public write(...[path, buffer, options]: AbstractApiArgs<'write'>) {
        const parts = path.split(':');
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const hostname: string = parts[0];
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const port: string = parts[1];
        const signal = options?.signal;

        return new Promise<AbstractApiAwaitedResult<'write'>>(resolve => {
            const listener = () => {
                resolve(
                    error({
                        code: ERRORS.ABORTED_BY_SIGNAL,
                    }),
                );
            };
            signal?.addEventListener('abort', listener);

            let chunk;
            if (buffer.compare(PING) === 0) {
                // PINGPING is expected to be 8 bytes
                chunk = buffer;
            } else {
                // other messages are expected to be 64 bytes
                chunk = Buffer.alloc(this.chunkSize);
                buffer.copy(chunk);
            }

            this.interface.send(chunk, Number.parseInt(port, 10), hostname, err => {
                signal?.removeEventListener('abort', listener);

                if (signal?.aborted) {
                    return;
                }

                if (err) {
                    this.logger?.error(err.message);

                    resolve(
                        error({
                            code: ERRORS.INTERFACE_DATA_TRANSFER,
                            message: err.message,
                        }),
                    );
                }

                resolve(success(undefined));
            });
        });
    }

    public read(...[path, options]: AbstractApiArgs<'read'>) {
        return this.readBuffer.read(path, options?.signal);
    }

    private async ping(path: PathInternal, signal?: AbortSignal) {
        const diff = Date.now() - this.lastPongTimestamp;
        if (diff < PING_TIMEOUT) {
            return true;
        }

        await this.write(path, PING, { signal });
        if (signal?.aborted) {
            throw new Error(ERRORS.ABORTED_BY_SIGNAL);
        }

        const pinged = new Promise<boolean>(resolve => {
            /* eslint-disable @typescript-eslint/no-use-before-define */
            const onClear = () => {
                this.interface.removeListener('error', onError);
                this.interface.removeListener('message', onMessage);
                clearTimeout(timeout);
                signal?.removeEventListener('abort', onError);
            };
            /* eslint-enable @typescript-eslint/no-use-before-define */
            const onError = () => {
                resolve(false);
                onClear();
            };
            const onMessage = (message: Buffer, _info: UDP.RemoteInfo) => {
                if (message.compare(PONG) === 0) {
                    resolve(true);
                    onClear();
                }
            };

            signal?.addEventListener('abort', onError);
            this.interface.addListener('error', onError);
            this.interface.addListener('message', onMessage);

            const timeout = setTimeout(onError, PING_TIMEOUT);
        });

        return pinged;
    }

    public async enumerate(signal?: AbortSignal) {
        // in theory we could support multiple devices, but we don't yet
        const paths = this.debugLink
            ? [PathInternal('127.0.0.1:21325')]
            : [PathInternal('127.0.0.1:21324')];

        try {
            const enumerateResult = await Promise.all(
                paths.map(path =>
                    this.ping(path, signal).then(pinged =>
                        pinged
                            ? {
                                  path,
                                  type: DEVICE_TYPE.TypeEmulator,
                                  product: 0,
                                  vendor: 0,
                                  id: path,
                                  apiType: this.type,
                              }
                            : undefined,
                    ),
                ),
            ).then(res => res.filter(isNotUndefined));
            this.handleDevicesChange(enumerateResult);

            return success(enumerateResult);
        } catch {
            this.handleDevicesChange([]);

            return error({ code: ERRORS.ABORTED_BY_SIGNAL });
        }
    }

    private handleDevicesChange(devices: DescriptorApiLevel[]) {
        const [known, unknown] = arrayPartition(
            devices,
            device => !!this.devices.find(d => d.path === device.path),
        );

        // find all disconnected devices and cancel reading (if any)
        const [disconnected] = arrayPartition(
            this.devices,
            device => !devices.some(d => d.path === device.path),
        );
        disconnected.forEach(({ path }) => {
            this.openedDevices.delete(path);
            this.readBuffer.cancelRead(path);
        });

        if (known.length !== this.devices.length || unknown.length > 0) {
            this.devices = devices;
            if (this.listening) {
                this.emit('transport-interface-change', this.devices);
            }
        }
    }

    public openDevice(...[path]: AbstractApiArgs<'openDevice'>) {
        // todo: maybe ping?
        this.openedDevices.add(path);

        return Promise.resolve(success(undefined));
    }

    public closeDevice(...[path]: AbstractApiArgs<'closeDevice'>) {
        this.openedDevices.delete(path);
        this.readBuffer.cancelRead(path);

        return Promise.resolve(success(undefined));
    }

    public dispose() {
        this.interface.removeAllListeners();
        this.interface.close();
        this.listening = false;
        this.listenAbortController.abort();
    }
}
