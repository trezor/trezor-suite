import { arrayPartition, isNotUndefined, resolveAfter } from '@trezor/utils';

import { AbstractApi, AbstractApiAwaitedResult, AbstractApiConstructorParams } from './abstract';
import { DEVICE_TYPE } from '../constants';
import * as ERRORS from '../errors';
import { DescriptorApiLevel, PathInternal } from '../types';
import { readMessageBuffer } from '../utils/readMessageBuffer';

// Define types locally to avoid importing from dgram in browser environments
type RemoteInfo = {
    address: string;
    family: 'IPv4' | 'IPv6';
    port: number;
    size: number;
};

type SocketType = {
    send(msg: Buffer, port: number, address: string, callback: (error: Error | null) => void): void;
    addListener(event: 'message', listener: (msg: Buffer, rinfo: RemoteInfo) => void): void;
    addListener(event: 'error', listener: (err: Error) => void): void;
    removeListener(event: 'message', listener: (msg: Buffer, rinfo: RemoteInfo) => void): void;
    removeListener(event: 'error', listener: (err: Error) => void): void;
    removeAllListeners(): void;
    close(): void;
};

const PING = Buffer.from('PINGPING');
const PONG = Buffer.from('PONGPONG');

export class UdpApi extends AbstractApi {
    chunkSize = 64;

    protected devices: DescriptorApiLevel[] = [];
    private listenAbortController = new AbortController();
    protected interface?: SocketType;
    private debugLink?: boolean;
    private readBuffer: ReturnType<typeof readMessageBuffer>;
    private interfacePromise?: Promise<SocketType>;

    constructor({
        logger,
        debugLink,
    }: Omit<AbstractApiConstructorParams, 'type'> & { debugLink?: boolean }) {
        super({ logger, type: 'udp' });
        this.debugLink = debugLink;
        this.readBuffer = readMessageBuffer();
    }

    private async getInterface(): Promise<SocketType> {
        if (this.interface) {
            return this.interface;
        }

        if (!this.interfacePromise) {
            this.interfacePromise = this.initInterface();
        }

        return this.interfacePromise;
    }

    private async initInterface(): Promise<SocketType> {
        // Dynamic import to avoid loading dgram in browser environments
        if (typeof window !== 'undefined') {
            throw new Error('UDP transport is not supported in browser environment');
        }
        // todo: looool
        // Dynamic module name to prevent webpack from trying to resolve at build time
        const moduleName = ['d', 'g', 'r', 'a', 'm'].join('');
        const dgram = await import(/* webpackIgnore: true */ moduleName);

        this.interface = dgram.default.createSocket({
            type: 'udp4',
            signal: this.listenAbortController.signal,
        });

        const onMessage = (message: Buffer, info: RemoteInfo) => {
            if (message.compare(PONG) === 0) {
                return;
            }

            const id = `${info.address}:${info.port}`;
            this.readBuffer.onMessage(id, message);
            this.logger?.debug('udp: globalOnMessage log:', message.toString('hex'));
        };
        this.interface!.addListener('message', onMessage);

        return this.interface!;
    }

    async listen() {
        if (this.listening) return;
        this.listening = true;
        await this.getInterface();
        this.listenLoop();
    }

    private async listenLoop() {
        while (this.listening) {
            await resolveAfter(500);
            if (!this.listening) break;
            await this.enumerate(this.listenAbortController.signal);
        }
    }

    public async write(path: string, buffer: Buffer, signal?: AbortSignal) {
        const [hostname, port] = path.split(':');

        const iface = await this.getInterface();

        return new Promise<AbstractApiAwaitedResult<'write'>>(resolve => {
            const listener = () => {
                resolve(
                    this.error({
                        error: ERRORS.ABORTED_BY_SIGNAL,
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

            iface.send(chunk, Number.parseInt(port, 10), hostname, (err: Error | null) => {
                signal?.removeEventListener('abort', listener);

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

    public read(path: string, signal?: AbortSignal) {
        return this.readBuffer.read(path, signal);
    }

    private async ping(path: string, signal?: AbortSignal) {
        await this.write(path, PING, signal);
        if (signal?.aborted) {
            throw new Error(ERRORS.ABORTED_BY_SIGNAL);
        }

        const iface = await this.getInterface();
        const pinged = new Promise<boolean>(resolve => {
            /* eslint-disable @typescript-eslint/no-use-before-define */
            const onClear = () => {
                iface.removeListener('error', onError);
                iface.removeListener('message', onMessage);
                clearTimeout(timeout);
                signal?.removeEventListener('abort', onError);
            };
            /* eslint-enable @typescript-eslint/no-use-before-define */
            const onError = () => {
                resolve(false);
                onClear();
            };
            const onMessage = (message: Buffer, _info: RemoteInfo) => {
                if (message.compare(PONG) === 0) {
                    resolve(true);
                    onClear();
                }
            };

            signal?.addEventListener('abort', onError);
            iface.addListener('error', onError);
            iface.addListener('message', onMessage);

            // TODO temporarily increased from 1s to 4s until success screen is solved on fw side
            const timeout = setTimeout(onError, 4000);
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

            return this.success(enumerateResult);
        } catch {
            this.handleDevicesChange([]);

            return this.error({ error: ERRORS.ABORTED_BY_SIGNAL });
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
            device => !devices.find(d => d.path === device.path),
        );
        disconnected.forEach(d => this.readBuffer.cancelRead(d.path));

        if (known.length !== this.devices.length || unknown.length > 0) {
            this.devices = devices;
            if (this.listening) {
                this.emit('transport-interface-change', this.devices);
            }
        }
    }

    public openDevice(_path: string) {
        // todo: maybe ping?
        return Promise.resolve(this.success(undefined));
    }

    public closeDevice(path: string) {
        this.readBuffer.cancelRead(path);

        return Promise.resolve(this.success(undefined));
    }

    public dispose() {
        if (this.interface) {
            this.interface.removeAllListeners();
            this.interface.close();
        }
        this.listening = false;
        this.listenAbortController.abort();
    }
}
