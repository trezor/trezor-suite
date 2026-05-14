// original file https://github.com/trezor/connect/blob/develop/src/js/device/DeviceCommands.js

import { DEVICE } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { initLog } from '@trezor/connect-common/src/utils/debug';
import { MessagesSchema as Messages } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';
import type { MessageResponse, Session, Transport } from '@trezor/transport';
import { TRANSPORT } from '@trezor/transport';
import { isErrorWithoutDeviceInteraction } from '@trezor/transport/src/errors-groups';
import { scheduleAction } from '@trezor/utils';

import type { IDevice } from '../types/idevice';
import type { TypedCallProvider } from '../types/typed-call-provider';

const blacklist: Record<string, string[] | true> = {
    PassphraseAck: ['passphrase'],
    CipheredKeyValue: ['value'],
    GetPublicKey: ['address_n'],
    PublicKey: ['node', 'xpub'],
    DecryptedMessage: ['message', 'address'],
    Features: true,
};

type AbortableOptions = {
    timeout?: number;
    signal?: AbortSignal;
};

const allowedCallsBeforeInitialize: Messages.MessageKey[] = [
    // Preventive Cancel
    'Cancel',
    // At the beginning of each call either Initialize or GetFeatures is called.
    'Initialize',
    'GetFeatures',
    // After one of the two above there might be optionally some of these
    'GetFirmwareHash',
    'ChangeLanguage',
    'DataChunkAck',
    // During firmware update, we can call these messages
    'RebootToBootloader',
    'FirmwareErase',
    'FirmwareUpload',
    // Wallet recovery may also be called before Initialize
    'RecoveryDevice',
    // Factory reset
    'WipeDevice',
    // There are other, which are allowed by firmware (ApplySettings,...) but we do not use them this way in connect.
];

const filterForLog = (type: string, msg: any) =>
    blacklist[type] === true
        ? '(redacted...)'
        : (blacklist[type] ?? []).reduce((prev, cur) => ({ ...prev, [cur]: '(redacted...)' }), msg);

const logger = initLog('DeviceCommands');

const isExpectedResponse = <Key extends Messages.MessageKey | Messages.MessageKey[]>(
    response: Pick<MessageResponse, 'type'>,
    expected: Key,
): response is Extract<MessageResponse, { type: Key extends Array<any> ? Key[number] : Key }> =>
    (Array.isArray(expected) ? expected : expected.split('|')).includes(response.type);

const success = <T>(payload: T) => ({ success: true as const, payload });
const error = (error: Error) => ({ success: false as const, error });
const nestedError = (cause: Error) => error(ERRORS.nestError(cause));
const fail = (msg: string) =>
    error(isErrorWithoutDeviceInteraction(msg) ? new ERRORS.TransportError(msg) : new Error(msg));

export type { TypedCallProvider } from '../types/typed-call-provider';

export class DeviceCurrentSession implements TypedCallProvider {
    private readonly device: IDevice;
    private readonly transport: Transport;
    private readonly session: Session;

    private disposed?: Error;
    private callPromise?: Promise<unknown>;
    private abortController?: AbortController;

    constructor(device: IDevice, transport: Transport, session: Session) {
        this.device = device;
        this.transport = transport;
        this.session = session;

        transport.deviceEvents.once(device.transportPath, e => {
            if (!this.disposed) {
                this.disposed = ERRORS.TypedError(
                    e.type === TRANSPORT.DEVICE_DISCONNECTED
                        ? 'Device_Disconnected'
                        : 'Device_UsedElsewhere',
                );
                this.abortController?.abort(this.disposed);
            }
        });
    }

    isDisposed() {
        return !!this.disposed;
    }

    async typedCall(
        type: Messages.MessageKey,
        expectedType: Messages.MessageKey | Messages.MessageKey[],
        msg: Messages.MessagePayload = {},
    ) {
        const deviceSessionId =
            this.device.getThpState()?.sessionId || this.device?.features?.session_id;
        if (!allowedCallsBeforeInitialize.includes(type) && !deviceSessionId) {
            console.error(
                'Runtime',
                `typedCall: Device not initialized when calling ${type}. call Initialize first`,
            );
        }
        // Assert message type
        // msg is allowed to be undefined for some calls, in that case the schema is an empty object
        Assert(Messages.MessageType.properties[type], msg);

        this.abortController = new AbortController();
        const { signal } = this.abortController;
        const abortPromise = new Promise<Error>(resolve =>
            signal.addEventListener('abort', () => resolve(signal.reason)),
        );
        const callPromise = this.callLoop(type, msg, abortPromise);
        this.callPromise = callPromise;
        const response = await callPromise;
        this.callPromise = undefined;
        this.abortController = undefined;

        if (!response.success) throw response.error;

        const { payload } = response;
        const receivedType = payload.type;

        if (isExpectedResponse(payload, expectedType)) {
            return payload;
        } else {
            // handle possible race condition - Bridge may have some unread message in buffer, read it
            // TODO could be possible to remove
            await scheduleAction(
                abort =>
                    this.transport.receive({
                        session: this.session,
                        protocol: this.device.protocol,
                        thpState: this.device.getThpState(),
                        signal: abort,
                    }),
                { timeout: 500 },
            ).catch(() => {});

            throw ERRORS.TypedError(
                'Runtime',
                `assertType: Response of unexpected type: ${receivedType}. Should be ${expectedType}`,
            );
        }
    }

    private async callLoop<T extends Messages.MessageKey>(
        type: T,
        msg: Messages.MessagePayload<T>,
        abortPromise: Promise<Error>,
    ) {
        let [name, data] = [type, msg];
        let pinUnlocked = false;

        while (true) {
            // note: tested on 24.7.2024 and whatever is written below this line is still valid
            // We do not support T1B1 <1.9.0 but we still need Features even from not supported devices to determine your version
            // and tell you that update is required.
            // Edge-case: T1B1 + bootloader < 1.4.0 doesn't know the "GetFeatures" message yet and it will send no response to its
            // transport response is pending endlessly, calling any other message will end up with "device call in progress"
            // set the timeout for this call so whenever it happens "unacquired device" will be created instead
            // next time device should be called together with "Initialize" (calling "acquireDevice" from the UI)
            const timeout = this.device.possibleT1 && name === 'GetFeatures' ? 3_000 : undefined;

            const callPromise = this.call(name, data, { timeout });

            const [abortedDuringCall, response] = await Promise.race([
                callPromise.then(res => [false, res] as const),
                abortPromise.then(res => [true, nestedError(res)] as const),
            ]);

            if (name === 'ButtonAck' && abortedDuringCall && !this.disposed) {
                // transport is currently in "call-read" state, update sync bit
                this.device.getThpState()?.sync('send', 'Cancel');
                await this.send('Cancel', {});
            }

            await callPromise;

            if (this.disposed) return nestedError(this.disposed);

            if (!response.success) return response;

            const res = response.payload;

            switch (res.type) {
                case 'Failure': {
                    const { code, message } = res.message;

                    // handling corner-case T1B1 + bootloader < 1.4.0 (above)
                    // if GetFeatures fails try Initialize instead
                    if (name === 'GetFeatures' && code === 'Failure_UnexpectedMessage') {
                        [name, data] = ['Initialize', {}];
                        break;
                    }

                    const err =
                        message ||
                        // T1B1 does not send any message in firmware update
                        // https://github.com/trezor/trezor-firmware/issues/1334
                        (code === 'Failure_FirmwareError' && 'Firmware installation failed') ||
                        // Failure_ActionCancelled message could be also missing
                        // https://github.com/trezor/connect/issues/865
                        (code === 'Failure_ActionCancelled' && 'Action cancelled by user') ||
                        'Failure_UnknownMessage';

                    // pass code and message from firmware error
                    return error(new ERRORS.TrezorError(code || 'Failure_UnknownCode', err));
                }
                case 'ButtonRequest': {
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
                        abortPromise.then(nestedError),
                    ]);

                    if (!promptRes.success) {
                        const cancelRes = await this.call('Cancel', {});

                        return cancelRes.success ? promptRes : cancelRes;
                    }

                    pinUnlocked = true;
                    [name, data] = ['PinMatrixAck', { pin: promptRes.payload }];
                    break;
                }
                case 'PassphraseRequest': {
                    const promptRes = await Promise.race([
                        this.device.prompt(DEVICE.PASSPHRASE, {}),
                        abortPromise.then(nestedError),
                    ]);

                    if (!promptRes.success) {
                        const cancelRes = await this.call('Cancel', {});

                        return cancelRes.success ? promptRes : cancelRes;
                    }

                    const payload = promptRes.payload.passphraseOnDevice
                        ? { on_device: true }
                        : { passphrase: promptRes.payload.value.normalize('NFKD') };

                    [name, data] = ['PassphraseAck', payload];
                    break;
                }
                case 'WordRequest': {
                    const promptRes = await Promise.race([
                        this.device.prompt(DEVICE.WORD, { type: res.message.type }),
                        abortPromise.then(nestedError),
                    ]);

                    if (!promptRes.success) {
                        const cancelRes = await this.call('Cancel', {});

                        return cancelRes.success ? promptRes : cancelRes;
                    }

                    [name, data] = ['WordAck', { word: promptRes.payload }];
                    break;
                }
                default: {
                    // reload features after successful PIN; TODO improve
                    if (!this.disposed && pinUnlocked && !this.device.features.unlocked) {
                        await this.device.getFeatures().catch(() => {});
                    }

                    return success(res);
                }
            }
        }
    }

    async call(name: string, data: Record<string, unknown>, options: AbortableOptions = {}) {
        if (this.disposed) return Promise.resolve(nestedError(this.disposed));

        logger.debug('Sending', name, filterForLog(name, data));

        const result = await this.transport.call({
            name,
            data,
            session: this.session,
            protocol: this.device.protocol,
            thpState: this.device.getThpState(),
            ...options,
        });

        if (result.success) {
            const { type, message } = result.payload;
            logger.debug('Received', type, filterForLog(type, message));
        } else {
            // result.error.message is not propagated to higher levels, only logged here. webusb/node-bridge may return message with additional information
            logger.warn('Received transport error', result.error.code, result.error.message);
        }

        return result.success
            ? success(result.payload)
            : fail(result.error.message || result.error.code);
    }

    async send(name: string, data: Record<string, unknown>, options: AbortableOptions = {}) {
        if (this.disposed) return Promise.resolve(nestedError(this.disposed));

        const result = await this.transport.send({
            name,
            data,
            session: this.session,
            protocol: this.device.protocol,
            thpState: this.device.getThpState(),
            ...options,
        });

        return result.success
            ? success(result.payload)
            : fail(result.error.message || result.error.code);
    }

    async receive(options: AbortableOptions = {}) {
        if (this.disposed) return Promise.resolve(nestedError(this.disposed));

        const result = await this.transport.receive({
            session: this.session,
            protocol: this.device.protocol,
            thpState: this.device.getThpState(),
            ...options,
        });

        return result.success
            ? success(result.payload)
            : fail(result.error.message || result.error.code);
    }

    cancelCall() {
        return this.call('Cancel', {});
    }

    async abort(reason: Error) {
        this.abortController?.abort(reason);
        await this.callPromise;
        this.disposed = reason;
    }
}
