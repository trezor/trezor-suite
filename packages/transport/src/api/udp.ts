import UDP from 'dgram';
import { isNotUndefined } from '@trezor/utils';

import { AbstractApi, AbstractApiConstructorParams } from './abstract';
import { AsyncResultWithTypedError, ResultWithTypedError } from '../types';

import * as ERRORS from '../errors';

export class UdpApi extends AbstractApi {
    interface = UDP.createSocket('udp4');
    protected communicating = false;

    constructor({ logger }: AbstractApiConstructorParams) {
        super({ logger });
    }

    public write(path: string, buffer: Buffer) {
        const [hostname, port] = path.split(':');

        return new Promise<
            ResultWithTypedError<
                undefined,
                typeof ERRORS.INTERFACE_DATA_TRANSFER | typeof ERRORS.UNEXPECTED_ERROR
            >
        >(resolve => {
            this.interface.send(buffer, Number.parseInt(port, 10), hostname, err => {
                if (err) {
                    this.logger.error(err.message);

                    return resolve(
                        this.error({
                            error: ERRORS.INTERFACE_DATA_TRANSFER,
                            message: err.message,
                        }),
                    );
                }

                return resolve(this.success(undefined));
            });
        });
    }

    public read(
        _path: string,
    ): AsyncResultWithTypedError<
        ArrayBuffer,
        | typeof ERRORS.DEVICE_NOT_FOUND
        | typeof ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE
        | typeof ERRORS.INTERFACE_DATA_TRANSFER
        | typeof ERRORS.DEVICE_DISCONNECTED_DURING_ACTION
        | typeof ERRORS.UNEXPECTED_ERROR
        | typeof ERRORS.ABORTED_BY_TIMEOUT
    > {
        this.communicating = true;

        return new Promise<
            ResultWithTypedError<
                ArrayBuffer,
                typeof ERRORS.INTERFACE_DATA_TRANSFER | typeof ERRORS.ABORTED_BY_TIMEOUT
            >
        >(resolve => {
            const onError = (err: Error) => {
                this.logger.error(err.message);

                resolve(
                    this.error({
                        error: ERRORS.INTERFACE_DATA_TRANSFER,
                        message: err.message,
                    }),
                );
                this.interface.removeListener('error', onError);
                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                this.interface.removeListener('message', onMessage);
            };
            const onMessage = (message: Buffer, _info: UDP.RemoteInfo) => {
                if (message.toString() === 'PONGPONG') {
                    return;
                }
                this.interface.removeListener('error', onError);
                this.interface.removeListener('message', onMessage);
                resolve(this.success(message));
            };
            this.interface.addListener('error', onError);
            this.interface.addListener('message', onMessage);
        }).finally(() => {
            this.communicating = false;
        });
    }

    private async ping(path: string) {
        await this.write(path, Buffer.from('PINGPING'));

        const pinged = new Promise<boolean>(resolve => {
            const onMessage = (message: Buffer, _info: UDP.RemoteInfo) => {
                if (message.toString() === 'PONGPONG') {
                    resolve(true);
                    this.interface.removeListener('message', onMessage);
                    // eslint-disable-next-line @typescript-eslint/no-use-before-define
                    clearTimeout(timeout);
                }
            };
            this.interface.addListener('message', onMessage);

            const timeout = setTimeout(
                () => {
                    this.interface.removeListener('message', onMessage);
                    resolve(false);
                },
                this.communicating ? 10000 : 500,
            );
        });

        return pinged;
    }

    public async enumerate() {
        // in theory we could support multiple devices, but we don't yet
        const paths = ['127.0.0.1:21324'];

        const enumerateResult = await Promise.all(
            paths.map(path => this.ping(path).then(pinged => (pinged ? path : undefined))),
        ).then(res => res.filter(isNotUndefined));

        return this.success(enumerateResult);
    }

    public openDevice(_path: string, _first: boolean) {
        // todo: maybe ping?
        return Promise.resolve(this.success(undefined));
    }

    public closeDevice(_path: string) {
        return Promise.resolve(this.success(undefined));
    }
}
