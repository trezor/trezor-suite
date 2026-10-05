// original file https://github.com/trezor/connect/blob/develop/src/js/device/DeviceCommands.js

import { DEVICE } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { MessagesSchema as Messages } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';
import {
    type MessageResponse,
    type Session,
    TRANSPORT,
    type Transport,
    isErrorWithoutDeviceInteraction,
} from '@trezor/transport-common';
import { type Logger, scheduleAction } from '@trezor/utils';

import type { IDevice } from '../types/idevice';
import type { TypedCallProvider } from '../types/typed-call-provider';

const blacklist: Record<string, string[] | true> = {
    PassphraseAck: ['passphrase'],
    CipheredKeyValue: ['value'],
    GetPublicKey: ['address_n'],
    PublicKey: ['node', 'xpub'],
    DecryptedMessage: ['message', 'address'],
    Features: true,
    // WARD entries are user secrets: the leaf `value`/`content` and the restore-capable
    // `mac`/`auth_*` are as sensitive as a passphrase, and `app_id`/`identifier`/`entry_key` are the
    // labels that key them -- keep all of it out of the device-call log, as PassphraseAck.passphrase
    // and CipheredKeyValue.value above already are. Whole-message where the secret dominates (as
    // `Features`); keyed identity only where non-secret routing fields (counter/remaining/missing)
    // are worth keeping.
    WardSetEntry: true,
    WardQueueSetEntry: true,
    WardQueueGetAck: true,
    WardEntryAck: true,
    WardLeafAck: true,
    WardFlushQueueAck: true,
    WardGetEntry: ['app_id', 'identifier'],
    WardQueueGetEntry: ['app_id', 'identifier'],
    WardQueueDeleteEntry: ['app_id', 'identifier'],
    WardFlushQueue: ['app_id', 'identifier'],
    // `staged` carries a batched flush's next leaf (its own entry_key and commit). filterForLog
    // replaces top-level fields only, so the nested object is redacted as a whole.
    WardEntryRequest: ['entry_key', 'staged'],
    WardMutationApplied: ['entry_key'],
    WardFlushQueueApplied: ['entry_key'],
    // wardRelay's openStore asks the device for the Evolu node: the proof authorizes that request,
    // and the node is the secret that the Evolu store owner is derived from.
    EvoluGetNode: ['proof_of_delegated_identity'],
    EvoluNode: true,
    // The delegated identity key mints that proof. Asking for it presents the THP pairing
    // credential, and every WARD relay call fetches the key when none is cached yet.
    EvoluGetDelegatedIdentityKey: ['thp_credential'],
    EvoluDelegatedIdentityKey: true,
    // The Nostr pubkey is a stable per-wallet identity, like `ward_id` below, and the signed content
    // is free-form text: Suite signs the address it gives to a contact. That address still reaches
    // this log through the getAddress Suite calls before signing to check the derivation, because
    // `Address.address` is logged for every getAddress and is not redacted here.
    NostrPubkey: ['pubkey'],
    NostrEventSignature: ['pubkey'],
    NostrSignEvent: ['content'],
    // wardRelay's openStore syncs first. `ward_id` is a stable per-wallet identifier; the head
    // fields (counter/nonce) are kept for debugging.
    WardSyncAck: ['ward_id'],
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

/** What `relayCall` hands back to the relay instead of handling: the WARD conversation's pulls. */
const RELAY_PASS_THROUGH = ['WardEntryRequest', 'WardChainRequest'];

export class DeviceCurrentSession implements TypedCallProvider {
    private readonly device: IDevice;
    private readonly transport: Transport;
    private readonly session: Session;
    private readonly logger: Logger;

    private disposed?: Error;
    private callPromise?: Promise<unknown>;
    private abortController?: AbortController;

    constructor(device: IDevice, transport: Transport, session: Session, logger: Logger) {
        this.device = device;
        this.transport = transport;
        this.session = session;
        this.logger = logger;

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
        type: Messages.WireInMessage,
        expectedType: Messages.WireOutMessage | Messages.WireOutMessage[],
        msg: Messages.MessagePayload<Messages.WireInMessage> = {},
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

        const payload = await this.runCallLoop(type, msg, []);
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

    private async runCallLoop(
        type: Messages.MessageKey,
        msg: Record<string, unknown>,
        passThrough: readonly string[],
    ) {
        this.abortController = new AbortController();
        const { signal } = this.abortController;
        const abortPromise = new Promise<Error>(resolve =>
            signal.addEventListener('abort', () => resolve(signal.reason)),
        );
        const callPromise = this.callLoop(type, msg as never, abortPromise, passThrough);
        this.callPromise = callPromise;
        const response = await callPromise;
        this.callPromise = undefined;
        this.abortController = undefined;

        if (!response.success) throw response.error;

        return response.payload;
    }

    /**
     * A call made on behalf of a RELAY -- `wardRelay`, which carries a conversation between the
     * device and the local WARD service. Two differences from `typedCall`, and only these:
     *
     * - ANY RESPONSE TYPE is returned, since the relay forwards whatever the device said and the
     *   service, not this layer, knows what it expected;
     * - WARD PULLS ARE RETURNED, not answered. `WardEntryRequest` / `WardChainRequest` are the
     *   conversation itself, owned by the service holding the replica. Answering them here, from the
     *   registered `wardProvider`, would be answering the service's question behind its back -- and
     *   a provider backed by that same service would wait on the conversation it is inside of.
     *
     * Everything the user is involved in -- button requests, PIN, passphrase -- is handled exactly
     * as for any other call. A `Failure` throws, as from `typedCall`.
     */
    relayCall(type: string, msg: Record<string, unknown> = {}) {
        const schema = Messages.MessageType.properties[type as Messages.MessageKey];
        if (!schema) {
            return Promise.reject(
                ERRORS.TypedError('Method_InvalidParameter', `unknown message ${type}`),
            );
        }
        Assert(schema, msg);

        return this.runCallLoop(type as Messages.MessageKey, msg, RELAY_PASS_THROUGH);
    }

    private async callLoop<T extends Messages.MessageKey>(
        type: T,
        msg: Messages.MessagePayload<T>,
        abortPromise: Promise<Error>,
        passThrough: readonly string[] = [],
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

            if (passThrough.includes(res.type)) return success(res);

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
                case 'WardEntryRequest': {
                    // WARD's PULL model: the device interrupts the call to ask the host for the
                    // leaf at a keyed path, and resumes once it has the ack. Answered by the
                    // `wardProvider` Core registered at init -- no UI, unlike its neighbours here.
                    const promptRes = await Promise.race([
                        this.device.prompt(DEVICE.WARD_ENTRY, { request: res.message }),
                        abortPromise.then(nestedError),
                    ]);

                    if (!promptRes.success) {
                        const cancelRes = await this.call('Cancel', {});

                        return cancelRes.success ? promptRes : cancelRes;
                    }

                    [name, data] = ['WardEntryAck', promptRes.payload];
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

        this.logger.debug('Sending', name, filterForLog(name, data));

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
            this.logger.debug('Received', type, filterForLog(type, message));
        } else {
            // result.error.message is not propagated to higher levels, only logged here. webusb/node-bridge may return message with additional information
            this.logger.warn('Received transport error', result.error.code, result.error.message);
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
