// original file https://github.com/trezor/connect/blob/develop/src/js/device/DeviceCommands.js

import { MessagesSchema as Messages } from '@trezor/protobuf';
import { TransportProtocol } from '@trezor/protocol';
import { Assert } from '@trezor/schema-utils';
import { Session, TRANSPORT_ERROR, Transport } from '@trezor/transport';
import { createDeferred, resolveAfter, versionUtils } from '@trezor/utils';

import { ERRORS } from '../constants';
import { Device } from './Device';
import { DEVICE } from '../events';
import { initLog } from '../utils/debug';

const blacklist: Record<string, string[] | true> = {
    PassphraseAck: ['passphrase'],
    CipheredKeyValue: ['value'],
    GetPublicKey: ['address_n'],
    PublicKey: ['node', 'xpub'],
    DecryptedMessage: ['message', 'address'],
    Features: true,
};

const filterForLog = (type: string, msg: any) =>
    blacklist[type] === true
        ? '(redacted...)'
        : (blacklist[type] ?? []).reduce((prev, cur) => ({ ...prev, [cur]: '(redacted...)' }), msg);

const logger = initLog('DeviceCommands');

export interface TypedCallProvider {
    typedCall: Messages.TypedCall;
    cancelCall: DeviceCurrentSession['cancelCall'];
    isDisposed: () => boolean;
}

export class DeviceCurrentSession implements TypedCallProvider {
    private readonly device: Device;
    private readonly transport: Transport;
    private readonly protocol: TransportProtocol;
    private readonly session: Session;

    private disposed: boolean;
    private callPromise?: Promise<unknown>;

    constructor(
        device: Device,
        transport: Transport,
        protocol: TransportProtocol,
        session: Session,
    ) {
        this.device = device;
        this.transport = transport;
        this.protocol = protocol;
        this.session = session;
        this.disposed = false;
    }

    isDisposed() {
        return this.disposed;
    }

    async typedCall(
        type: Messages.MessageKey,
        resType: Messages.MessageKey | Messages.MessageKey[],
        msg: Messages.MessagePayload = {},
    ) {
        // Assert message type
        // msg is allowed to be undefined for some calls, in that case the schema is an empty object
        Assert(Messages.MessageType.properties[type], msg);
        const response = await this.callLoop(type, msg);

        try {
            const splitResTypes = Array.isArray(resType) ? resType : resType.split('|');
            if (!splitResTypes.includes(response.type)) {
                throw ERRORS.TypedError(
                    'Runtime',
                    `assertType: Response of unexpected type: ${response.type}. Should be ${resType}`,
                );
            }
        } catch (error) {
            // handle possible race condition
            // Bridge may have some unread message in buffer, read it
            const abortController = new AbortController();
            const timeout = setTimeout(() => {
                abortController.abort();
            }, 500);

            await this.transport
                .receive({
                    session: this.session,
                    protocol: this.protocol,
                    signal: abortController.signal,
                })
                .finally(() => {
                    clearTimeout(timeout);
                });
            // throw error anyway, next call should be resolved properly
            throw error;
        }

        return response;
    }

    private async callLoop<T extends Messages.MessageKey>(
        type: T,
        msg: Messages.MessagePayload<T>,
    ): Promise<Messages.MessageResponse> {
        let [name, data] = [type, msg];
        let pinUnlocked = false;
        const { protocol, session } = this;

        while (true) {
            if (this.disposed) {
                throw ERRORS.TypedError('Runtime', 'typedCall: DeviceCommands already disposed');
            }

            logger.debug('Sending', name, filterForLog(name, data));

            const promise = this.transport.call({ session, name, data, protocol });

            this.callPromise = promise;
            const response = await promise;
            this.callPromise = undefined;

            if (!response.success) {
                // res.message is not propagated to higher levels, only logged here. webusb/node-bridge may return message with additional information
                logger.warn('Received transport error', response.error, response.message);
                throw new Error(response.error, { cause: 'transport-error' });
            }

            const res = response.payload;

            logger.debug('Received', res.type, filterForLog(res.type, res.message));

            this.clearCancel();

            switch (res.type) {
                case 'Failure': {
                    const { code, message } = res.message;

                    // pass code and message from firmware error
                    return Promise.reject(
                        new ERRORS.TrezorError(
                            (code as any) || 'Failure_UnknownCode',
                            message ||
                                // T1B1 does not send any message in firmware update
                                // https://github.com/trezor/trezor-firmware/issues/1334
                                (code === Messages.FailureType.Failure_FirmwareError &&
                                    'Firmware installation failed') ||
                                // Failure_ActionCancelled message could be also missing
                                // https://github.com/trezor/connect/issues/865
                                (code === Messages.FailureType.Failure_ActionCancelled &&
                                    'Action cancelled by user') ||
                                'Failure_UnknownMessage',
                        ),
                    );
                }
                case 'ButtonRequest': {
                    this.awaitCancel().then(async ({ resolve }) => {
                        /**
                         * Bridge version =< 2.0.28 throws "other call in progress" error.
                         * as workaround takeover transportSession (acquire) before sending Cancel, this will resolve previous pending call.
                         */
                        if (
                            this.transport.name === 'BridgeTransport' &&
                            !versionUtils.isNewer(this.transport.version, '2.0.28')
                        ) {
                            try {
                                // UI_EVENT is send right before ButtonAck, make sure that ButtonAck is sent
                                await resolveAfter(1);
                                await this.device.acquire();
                                await this.device.getCurrentSession().cancelCall(false);
                                await this.device.release();
                            } catch {
                                // ignore whatever happens
                            }
                        } else {
                            await this.cancelCall(false);
                        }

                        resolve();
                    });

                    if (res.message.code === 'ButtonRequest_PassphraseEntry') {
                        this.device.emit(DEVICE.PASSPHRASE_ON_DEVICE);
                    } else {
                        this.device.emit(DEVICE.BUTTON, {
                            device: this.device,
                            payload: res.message,
                        });
                    }

                    [name, data] = ['ButtonAck', {}];
                    break;
                }
                case 'PinMatrixRequest': {
                    const promptRes = await Promise.race([
                        this.device.prompt(DEVICE.PIN, { type: res.message.type }),
                        this.awaitCancel().then(resp => ({ success: false as const, ...resp })),
                    ]);
                    this.clearCancel();

                    if (!promptRes.success) {
                        const cancelRes = await this.cancelCall();

                        if ('resolve' in promptRes) promptRes.resolve();

                        return Promise.reject(
                            cancelRes.success ? promptRes.error : cancelRes.error,
                        );
                    }

                    pinUnlocked = true;
                    [name, data] = ['PinMatrixAck', { pin: promptRes.payload }];
                    break;
                }
                case 'PassphraseRequest': {
                    const promptRes = await Promise.race([
                        this.device.prompt(DEVICE.PASSPHRASE, {}),
                        this.awaitCancel().then(resp => ({ success: false as const, ...resp })),
                    ]);
                    this.clearCancel();

                    if (!promptRes.success) {
                        const cancelRes = await this.cancelCall();

                        if ('resolve' in promptRes) promptRes.resolve();

                        return Promise.reject(
                            cancelRes.success ? promptRes.error : cancelRes.error,
                        );
                    }

                    [name, data] = [
                        'PassphraseAck',
                        promptRes.payload.passphraseOnDevice
                            ? { on_device: true }
                            : { passphrase: promptRes.payload.value.normalize('NFKD') },
                    ];
                    break;
                }
                case 'WordRequest': {
                    const promptRes = await Promise.race([
                        this.device.prompt(DEVICE.WORD, { type: res.message.type }),
                        this.awaitCancel().then(resp => ({ success: false as const, ...resp })),
                    ]);
                    this.clearCancel();

                    if (!promptRes.success) {
                        const cancelRes = await this.cancelCall();

                        if ('resolve' in promptRes) promptRes.resolve();

                        return Promise.reject(
                            cancelRes.success ? promptRes.error : cancelRes.error,
                        );
                    }

                    [name, data] = ['WordAck', { word: promptRes.payload }];
                    break;
                }
                default: {
                    // reload features after successful PIN; TODO improve
                    if (pinUnlocked && !this.device.features.unlocked) {
                        await this.device.getFeatures();
                    }

                    return res;
                }
            }
        }
    }

    cancelCall(expectResponse = true) {
        if (this.disposed) {
            return Promise.resolve({
                success: false as const,
                error: TRANSPORT_ERROR.SESSION_NOT_FOUND,
            });
        }

        const { protocol, session } = this;
        const cancelArgs = { session, name: 'Cancel', data: {}, protocol };

        return expectResponse ? this.transport.call(cancelArgs) : this.transport.send(cancelArgs);
    }

    private cancelFn?: (err: string) => Promise<void>;

    private awaitCancel() {
        const dfd = createDeferred<{ error: string; resolve: () => void }>();
        this.cancelFn = error => {
            const { promise, resolve } = createDeferred();
            dfd.resolve({ resolve, error });

            return promise;
        };

        return dfd.promise;
    }

    private clearCancel() {
        this.cancelFn = undefined;
    }

    async cancel(reason: string) {
        await this.cancelFn?.(reason);
    }

    async dispose() {
        if (!this.disposed) {
            this.disposed = true;
            await this.callPromise;
        }
    }
}
