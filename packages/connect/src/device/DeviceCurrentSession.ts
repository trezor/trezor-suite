// original file https://github.com/trezor/connect/blob/develop/src/js/device/DeviceCommands.js

import { MessagesSchema as Messages } from '@trezor/protobuf';
import { TransportProtocol } from '@trezor/protocol';
import { Assert } from '@trezor/schema-utils';
import { Session, TRANSPORT_ERROR, Transport } from '@trezor/transport';
import { resolveAfter, scheduleAction, versionUtils } from '@trezor/utils';

import { ERRORS } from '../constants';
import { Device } from './Device';
import { DataManager } from '../data/DataManager';
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

const isExpectedResponse = <Key extends Messages.MessageKey | Messages.MessageKey[]>(
    response: Pick<Messages.MessageResponse, 'type'>,
    expected: Key,
): response is Extract<
    Messages.MessageResponse,
    { type: Key extends Array<any> ? Key[number] : Key }
> => (Array.isArray(expected) ? expected : expected.split('|')).includes(response.type);

const success = <T>(payload: T) => ({ success: true as const, payload });
const error = (error: Error) => ({ success: false as const, error });
const fail = (msg: string) => error(new Error(msg, { cause: 'transport-error' }));

const getFeaturesTimeoutPromise = () =>
    resolveAfter(
        // Due to performance issues in suite-native during app start, original timeout is not sufficient.
        DataManager.getSettings('env') === 'react-native' ? 20_000 : 3_000,
        undefined,
        fail(TRANSPORT_ERROR.ABORTED_BY_TIMEOUT),
    );

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

    private disposed?: Error;
    private callPromise?: Promise<unknown>;
    private abortController?: AbortController;

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
    }

    isDisposed() {
        return !!this.disposed;
    }

    async typedCall(
        type: Messages.MessageKey,
        expectedType: Messages.MessageKey | Messages.MessageKey[],
        msg: Messages.MessagePayload = {},
    ) {
        // Assert message type
        // msg is allowed to be undefined for some calls, in that case the schema is an empty object
        Assert(Messages.MessageType.properties[type], msg);

        this.abortController = new AbortController();
        const { signal } = this.abortController;
        const abortPromise = new Promise<ReturnType<typeof fail>>(resolve =>
            signal.addEventListener('abort', () => resolve(error(signal.reason))),
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
                        protocol: this.protocol,
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

    /**
     * Bridge version =< 2.0.28 throws "other call in progress" error.
     * as workaround takeover transportSession (acquire) before sending Cancel, this will resolve previous pending call.
     */
    private needCancelWorkaround() {
        return (
            this.transport.name === 'BridgeTransport' &&
            !versionUtils.isNewer(this.transport.version, '2.0.28')
        );
    }

    private async callLoop<T extends Messages.MessageKey>(
        type: T,
        msg: Messages.MessagePayload<T>,
        abortPromise: Promise<ReturnType<typeof fail>>,
    ) {
        let [name, data] = [type, msg];
        let pinUnlocked = false;

        while (true) {
            const callPromise = this.call(name, data);

            // note: tested on 24.7.2024 and whatever is written below this line is still valid
            // We do not support T1B1 <1.9.0 but we still need Features even from not supported devices to determine your version
            // and tell you that update is required.
            // Edge-case: T1B1 + bootloader < 1.4.0 doesn't know the "GetFeatures" message yet and it will send no response to its
            // transport response is pending endlessly, calling any other message will end up with "device call in progress"
            // set the timeout for this call so whenever it happens "unacquired device" will be created instead
            // next time device should be called together with "Initialize" (calling "acquireDevice" from the UI)
            const timeoutPromise = name === 'GetFeatures' ? getFeaturesTimeoutPromise() : undefined;

            const [abortedDuringCall, response] = await Promise.race([
                callPromise.then(res => [false, res] as const),
                abortPromise.then(res => [true, res] as const),
                ...(timeoutPromise ? [timeoutPromise.then(res => [false, res] as const)] : []),
            ]);

            if (name === 'ButtonAck' && abortedDuringCall && !this.disposed) {
                if (this.needCancelWorkaround()) {
                    try {
                        // UI_EVENT is send right before ButtonAck, make sure that ButtonAck is sent
                        await resolveAfter(1);
                        await this.device.acquire();
                        await this.device.getCurrentSession().cancelCall();
                        await this.device.release();
                    } catch {
                        // ignore whatever happens
                    }
                } else {
                    const { session, protocol } = this;
                    await this.transport.send({ name: 'Cancel', data: {}, session, protocol });
                }
            }

            await callPromise;

            if (this.disposed) return error(this.disposed);

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
                    return error(
                        new ERRORS.TrezorError((code as any) || 'Failure_UnknownCode', err),
                    );
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
                        abortPromise,
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
                        abortPromise,
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
                        abortPromise,
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
                        await this.device.getFeatures();
                    }

                    return success(res);
                }
            }
        }
    }

    private async call<T extends Messages.MessageKey>(name: T, data: Messages.MessagePayload<T>) {
        if (this.disposed) return Promise.resolve(error(this.disposed));

        logger.debug('Sending', name, filterForLog(name, data));

        const { session, protocol } = this;

        const result = await this.transport.call({ name, data, session, protocol });

        if (result.success) {
            const { type, message } = result.payload;
            logger.debug('Received', type, filterForLog(type, message));
        } else {
            // res.message is not propagated to higher levels, only logged here. webusb/node-bridge may return message with additional information
            logger.warn('Received transport error', result.error, result.message);
        }

        return result.success ? success(result.payload) : fail(result.error);
    }

    cancelCall() {
        return this.call('Cancel', {});
    }

    async abort(reason: Error, dispose = false) {
        this.abortController?.abort(reason);
        await this.callPromise;
        if (dispose) this.disposed = reason;
    }

    async dispose() {
        if (!this.disposed) {
            this.disposed = ERRORS.TypedError(
                'Runtime',
                'typedCall: DeviceCommands already disposed',
            );
            await this.abort(this.disposed);
        }
    }
}
