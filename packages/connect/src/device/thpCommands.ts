import { createHash, randomBytes } from 'crypto';

import { encodeMessage } from '@trezor/protobuf';
import { thp as protocolThp } from '@trezor/protocol';
import { createDeferred } from '@trezor/utils';

import { ERRORS } from '../constants';
import type { Device } from './Device';
import { DEVICE, UiResponseThpPairingTag } from '../events';
import { ThpSettings } from '../types';

type MessageType = protocolThp.ThpMessageType & {
    ButtonAck: {};
    Success: { message?: string };
    Failure_ActionCancelled: {};
};
type MessageKey = keyof MessageType;
type TypedPayload<T extends MessageKey> = {
    type: T;
    message: NonNullable<MessageType[T]>;
};
type TypedCallResponseMap = {
    [K in keyof MessageType]: TypedPayload<K>;
};
type DefaultPayloadMessage = protocolThp.MessageResponse;

export function thpCall<T extends MessageKey, R extends MessageKey[]>(
    device: Device,
    name: T,
    resType: R,
    msg?: MessageType[T],
): Promise<TypedCallResponseMap[R[number]]>;
export function thpCall<T extends MessageKey, R extends MessageKey>(
    device: Device,
    name: T,
    resType: R,
    msg?: MessageType[T],
): Promise<TypedPayload<R>>;
export async function thpCall(
    device: Device,
    name: MessageKey,
    resType: MessageKey | MessageKey[],
    data?: DefaultPayloadMessage['message'],
) {
    const session = device.getLocalSession();
    if (!session) {
        throw new Error('THPCall Failure transportSession missing');
    }
    const thpState = device.getThpState();
    if (!thpState) {
        throw new Error('THPCall Failure thpState missing');
    }

    console.warn('ThpCall', name, data);

    const result = await device.transport.call({
        session,
        name,
        data: data || {},
        protocol: device.protocol,
        thpState,
        // TODO: abort signal
    });
    if (!result.success) {
        // throw new ERRORS.TrezorError(result.error, result.message);
        throw new Error(result.error + ' ' + result.message);
    }

    console.warn('ThpCall result', result.payload);

    if (result.payload.type === 'ThpPairingPreparationsFinished') {
        if (thpState.pairingMethod === protocolThp.ThpPairingMethod.NFC) {
            thpState.setNfcSecret(randomBytes(16));
        }

        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        return thpWaitForThpPairingTag(device);
    }

    if (result.payload.type === 'ThpCodeEntryCpaceTrezor') {
        thpState.updateHandshakeCredentials({
            trezorCpacePublicKey: Buffer.from(
                result.payload.message.cpace_trezor_public_key,
                'hex',
            ),
        });

        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        return thpWaitForThpPairingTag(device);
    }

    if (result.payload.type === 'ButtonRequest') {
        if (result.payload.message.code === 'ButtonRequest_PassphraseEntry') {
            device.emit(DEVICE.PASSPHRASE_ON_DEVICE);
        } else {
            device.emit(DEVICE.BUTTON, { device, payload: result.payload.message });
        }

        // resType is protocolThp.ThpMessageType while typedCall accepts only protobuf.MessageType
        // return device.getCurrentSession().typedCall('ButtonAck', resType as any, {});
        return thpCall(device, 'ButtonAck', resType as any, {});
    }
    // @ts-expect-error
    if (result.payload.type === 'Failure' || result.payload.type === 'Failure_ActionCancelled') {
        throw ERRORS.serializeError(result.payload.message);
    }
    if (result.payload.type === 'ThpError') {
        throw ERRORS.serializeError(result.payload.message);
    }

    return result.payload;
}

export const abortThpWorkflow = (device: Device) => {
    const thpState = device.getThpState();
    if (!thpState) {
        return Promise.resolve(); // not a THP device
    }

    if (device.transport.name === 'BridgeTransport') {
        // TODO: this is needed only only if there is pending thpCall: message was sent, now reading from device
        thpState.updateSyncBit('send');
        thpState.updateNonce('send');
    }

    // TODO: check if workflow is actually running
    return device.transport.send({
        name: 'Cancel',
        data: {},
        session: device.getLocalSession()!,
        protocol: device.protocol,
        thpState,
        // signal: readAbort.signal,
    });
};

const processQrCodeTag = async (device: Device, value: string) => {
    const thpState = device.getThpState();
    if (!thpState?.handshakeCredentials) {
        throw new Error('missing handshakeCredentials');
    }

    const tagSha = createHash('sha256')
        .update(thpState.handshakeCredentials.handshakeHash)
        .update(Buffer.from(value, 'hex'))
        .digest('hex');
    const qrCodeSecret = await thpCall(device, 'ThpQrCodeTag', 'ThpQrCodeSecret', {
        tag: tagSha,
    });

    protocolThp.validateHP6(thpState.handshakeCredentials, value, qrCodeSecret.message.secret);

    return qrCodeSecret;
};

const processNfcTag = async (device: Device, value: string) => {
    const thpState = device.getThpState();
    if (!thpState?.handshakeCredentials) {
        throw new Error('missing handshakeCredentials');
    }
    if (!thpState?.nfcSecret) {
        throw new Error('missing nfcSecret');
    }

    const tagSha = createHash('sha256')
        .update(Buffer.from([protocolThp.ThpPairingMethod.NFC]))
        .update(thpState.handshakeCredentials.handshakeHash)
        .update(Buffer.from(value, 'hex'))
        .digest('hex');

    const nfcTagTrezor = await thpCall(device, 'ThpNfcTagHost', 'ThpNfcTagTrezor', {
        tag: tagSha,
    });

    protocolThp.validateHP7(
        thpState.handshakeCredentials,
        nfcTagTrezor.message.tag,
        thpState.nfcSecret,
    );

    return nfcTagTrezor;
};

const processCodeEntry = async (device: Device, value: string) => {
    // TODO: code value on 6 bytes written with offset 2?
    const codeValue = Buffer.alloc(6);
    codeValue.writeUint32BE(Number(value), 2);

    const thpState = device.getThpState();
    if (!thpState?.handshakeCredentials) {
        throw new Error('missing handshakeCredentials');
    }

    const hostKeys = protocolThp.getCpaceHostKeys(
        codeValue,
        thpState.handshakeCredentials.handshakeHash,
    );
    const tag = protocolThp
        .getShareSecret(thpState.handshakeCredentials.trezorCpacePublicKey, hostKeys.privateKey)
        .toString('hex');

    const codeEntrySecret = await thpCall(
        device,
        'ThpCodeEntryCpaceHostTag',
        'ThpCodeEntrySecret',
        { tag, cpace_host_public_key: hostKeys.publicKey.toString('hex') },
    );

    protocolThp.validateHP5(thpState.handshakeCredentials, value, codeEntrySecret.message.secret);

    return codeEntrySecret;
};

const processThpPairingResponse = (device: Device, payload: UiResponseThpPairingTag['payload']) => {
    if ('selectedMethod' in payload) {
        // change pairing method
        device.getThpState()?.setPairingMethod(payload.selectedMethod);

        return thpCall(device, 'ThpSelectMethod', 'ThpPairingRequestApproved', {
            selected_pairing_method: payload.selectedMethod,
        });
    }

    if (payload.source === 'qr-code') {
        return processQrCodeTag(device, payload.tag);
    }

    if (payload.source === 'nfc') {
        return processNfcTag(device, payload.tag);
    }

    if (payload.source === 'code-entry') {
        return processCodeEntry(device, payload.tag);
    }

    throw new Error(`Unknown THP pairing source ${payload.source}`);
};

const thpWaitForThpPairingTag = async (device: Device) => {
    const dfd = createDeferred<UiResponseThpPairingTag['payload'] | { error: string }>();

    // start listening for the Cancel message from Trezor
    const readAbort = new AbortController();
    const readCancel = device.transport.receive({
        session: device.getLocalSession()!,
        protocol: device.protocol,
        thpState: device.getThpState(), // TODO: set expected responses?
        signal: readAbort.signal,
    });

    readCancel
        .then(r => {
            if (r.success) {
                // TODO: message type Failure?
                // @ts-expect-error
                dfd.resolve({ error: r.payload.message.message });
            }
        })
        .catch(() => {
            // silent
        });

    // start listening for the UI response
    device.prompt('thp_pairing', { device }).then(response => {
        if (response.success) {
            // TODO: this type is wrong
            dfd.resolve(response.payload);
        } else {
            abortThpWorkflow(device).then(() => {
                dfd.resolve({ error: response.error.message });
            });
        }
    });

    const pairingResponse = await dfd.promise;
    readAbort.abort();
    await readCancel;

    if ('error' in pairingResponse) {
        throw new Error(pairingResponse.error);
    }

    // node-bridge + usb: abort received on client side of http request resolves faster than server. result with "device call in progress"
    await new Promise(resolve => setTimeout(resolve, 500));

    return processThpPairingResponse(device, pairingResponse).catch(e => {
        // catch pairing tag mismatch
        if (e.code === 'Failure_FirmwareError') {
            // 'Unexpected Code Entry Tag'
            throw ERRORS.TypedError('Device_ThpPairingTagInvalid', e.message);
        }

        throw ERRORS.TypedError(e.code, e.message);
    });
};

export const createThpSession = async (device: Device, deriveCardano: boolean) => {
    let passphrase: protocolThp.ThpCreateNewSession;
    if (!device.features.passphrase_protection) {
        passphrase = { passphrase: '' };
        // TODO: passphrase_always on device
    } else {
        // same as DeviceCurrentSession PassphraseRequest
        passphrase = await device.prompt('passphrase', {}).then(promptRes => {
            if (!promptRes.success) {
                return { passphrase: '' };
            }

            return promptRes.payload.passphraseOnDevice
                ? { on_device: true }
                : { passphrase: promptRes.payload.value };
        });
    }

    // TODO: write tests same as in pairing
    await thpCall(device, 'ThpCreateNewSession', 'Success', {
        ...passphrase,
        derive_cardano: deriveCardano,
    });

    // TODO: throw error?
    return 0;
};

export const endThpSession = () => {
    // TODO: call it on forget device(wallet) in suite
};

// remove this fn.
export const getThpCredentials = async (device: Device, autoconnect = false) => {
    const thpState = device.getThpState();
    if (!thpState?.handshakeCredentials) {
        throw ERRORS.TypedError('Device_ThpStateMissing');
    }

    const credentials = await thpCall(device, 'ThpCredentialRequest', 'ThpCredentialResponse', {
        autoconnect,
        host_static_pubkey: thpState.handshakeCredentials.hostStaticPublicKey.toString('hex'),
    });

    return { ...credentials.message, autoconnect };
};

const thpPairingEnd = (device: Device) => {
    device.getThpState()?.setPhase('hh3');

    return thpCall(device, 'ThpEndRequest', 'ThpEndResponse', {});
};

const thpPairing = async (device: Device, settings: ThpSettings) => {
    const thpState = device.getThpState();
    if (!thpState || !thpState.handshakeCredentials) {
        throw ERRORS.TypedError('Device_ThpStateMissing');
    }

    if (thpState.isPaired) {
        if (!thpState.isAutoconnectPaired) {
            // device is paired, but credentials are not persistent
            // workaround, probably will be changed in the future
            // get credentials without autoconnect just to enforce ButtonRequest/thp_connection_request flow
            await getThpCredentials(device, false);
            // after the ButtonRequest the UI should know if autoconnect credentials are requested by user or not
            // this action is meant to be quick, it should timeout if host/suite does not respond (doesn't have listener)
            const uiPromise = await Promise.race([
                device.prompt(DEVICE.THP_AUTOCONNECT, { device }),
                new Promise(resolve => setTimeout(() => resolve({ success: false }), 1000)),
            ]);

            // @ts-expect-error
            if (uiPromise.success && uiPromise.payload.autoconnect) {
                const credentials = await getThpCredentials(device, true);
                device.emit(DEVICE.THP_CREDENTIALS_CHANGED, { credentials });
            }
        }

        await thpPairingEnd(device);

        return;
    }

    // TODO: request host to select the method?
    // TODO: or pick first from available settings?
    // set pairing method
    const selected_pairing_method = thpState.handshakeCredentials.pairingMethods[0];
    thpState.setPairingMethod(selected_pairing_method);

    await thpCall(device, 'ThpPairingRequest', 'ThpPairingRequestApproved', {
        host_name: settings.hostName || 'TODO FALLBACK',
    });

    const selectMethod = await thpCall(
        device,
        'ThpSelectMethod',
        ['ThpCodeEntryCommitment', 'ThpEndResponse'],
        { selected_pairing_method },
    );

    // SkipPairing
    if (selectMethod.type === 'ThpEndResponse') {
        return;
    }

    if (thpState.pairingMethod === protocolThp.ThpPairingMethod.CodeEntry) {
        // store handshakeCommitment and validate later in `processCodeEntry`
        const codeEntryChallenge = randomBytes(32);
        const handshakeCommitment = Buffer.from(selectMethod.message.commitment, 'hex');
        thpState.updateHandshakeCredentials({
            handshakeCommitment,
            codeEntryChallenge,
            hostStaticPublicKey: thpState.handshakeCredentials.hostStaticPublicKey,
        });

        await thpCall(device, 'ThpCodeEntryChallenge', 'ThpCodeEntryCpaceTrezor', {
            challenge: codeEntryChallenge.toString('hex'),
        });
    }

    const credentials = await getThpCredentials(device, false);
    device.emit(DEVICE.THP_CREDENTIALS_CHANGED, { credentials });

    thpState.setPairingCredentials(credentials);
    thpState.setIsPaired(true);

    await thpPairingEnd(device);
};

// intersection of device acceptable methods and host acceptable methods
const getPairingMethods = (
    deviceMethods?: (protocolThp.ThpPairingMethod | keyof typeof protocolThp.ThpPairingMethod)[],
    settingsMethods?: (protocolThp.ThpPairingMethod | keyof typeof protocolThp.ThpPairingMethod)[],
) =>
    deviceMethods?.flatMap(dm => {
        const value = typeof dm === 'string' ? protocolThp.ThpPairingMethod[dm] : dm;
        const isRequested =
            settingsMethods &&
            settingsMethods.find(m => {
                const v = typeof m === 'string' ? protocolThp.ThpPairingMethod[m] : m;

                return value === v;
            });

        return isRequested ? value : [];
    });

// State HH0
// Try to establish Trezor Host Protocol channel
// - on older FW without THP
// - using older trezord, bridge older than 3.1.0 adds MESSAGE_MAGIC_HEADER_BYTE to each chunk
export const createThpChannel = async (device: Device, settings?: ThpSettings) => {
    const thpState = device.getThpState();
    if (!thpState) {
        throw ERRORS.TypedError('Device_ThpStateMissing');
    }

    // TODO: find prettier solution to set channel 0, some constant?
    thpState.setChannel(Buffer.from('ffff', 'hex'));
    const nonce = randomBytes(8);
    const createChannel = await thpCall(
        device,
        'ThpCreateChannelRequest',
        'ThpCreateChannelResponse',
        { nonce },
    );

    const { properties, ...p } = createChannel.message;

    // TODO: this is not mentioned by the docs
    if (nonce.compare(p.nonce) !== 0) {
        throw new Error('Nonce not meet' + nonce.toString('hex') + ' ' + p.nonce.toString('hex'));
    }

    const pairingMethods = getPairingMethods(properties.pairing_methods, settings?.pairingMethods);
    if (!pairingMethods?.length) {
        // TODO: is it error? or device unreadable?
        throw new Error('No common pairing methods');
    }

    thpState.setThpProperties(properties);

    thpState.setPhase('hh1');
    thpState.setChannel(p.channel);
    thpState.updateHandshakeCredentials({
        pairingMethods,
        handshakeHash: p.handshakeHash,
    });
};

export const thpHandshake = async (device: Device, settings?: ThpSettings) => {
    const pairingMethods = device.getThpState()?.handshakeCredentials?.pairingMethods || [];

    const staticKeys = settings?.staticKey
        ? Buffer.from(settings.staticKey, 'hex')
        : randomBytes(32); // TODO: propagate random
    const hostStaticKeys = protocolThp.getCurve25519KeyPair(staticKeys);
    const hostEphemeralKeys = protocolThp.getCurve25519KeyPair(randomBytes(32));
    const hostEphemeralPubKey = hostEphemeralKeys.publicKey;
    // sort by autoconnect
    const knownCredentials = (settings?.knownCredentials || []).sort(cre =>
        cre.autoconnect ? -1 : 1,
    );

    const handshakeInit = await thpCall(
        device,
        'ThpHandshakeInitRequest',
        'ThpHandshakeInitResponse',
        { key: hostEphemeralPubKey },
    );

    const { trezorEncryptedStaticPubkey } = handshakeInit.message;
    const thpState = device.getThpState();
    if (!thpState) {
        throw ERRORS.TypedError('Device_ThpStateMissing');
    }

    const handshakeCredentials = protocolThp.HH1({
        handshakeInitResponse: handshakeInit.message,
        thpState,
        hostStaticKeys,
        hostEphemeralKeys,
        knownCredentials,
        protobufEncoder: (name, data) => encodeMessage(device.transport.getMessages(), name, data),
    });

    const { hostKey, trezorKey, hostEncryptedStaticPubkey } = handshakeCredentials;

    thpState.updateHandshakeCredentials({
        pairingMethods,
        trezorEncryptedStaticPubkey,
        hostEncryptedStaticPubkey,
        handshakeHash: handshakeCredentials.handshakeHash,
        trezorKey,
        hostKey,
        hostStaticPublicKey: hostStaticKeys.publicKey,
    });

    // @ts-expect-error
    thpState.setPairingCredentials(handshakeCredentials.credentials);

    const handshakeCompletion = await thpCall(
        device,
        'ThpHandshakeCompletionRequest',
        'ThpHandshakeCompletionResponse',
        {
            hostPubkey: hostEncryptedStaticPubkey,
            encryptedPayload: handshakeCredentials.encryptedPayload,
        },
    );

    thpState.setPhase('hh2');
    thpState.setIsPaired(!!handshakeCompletion.message.state);
};

export const getThpChannel = async (
    device: Device,
    settings?: ThpSettings,
    enforcePairing?: boolean,
) => {
    const thpState = device.getThpState();
    if (!thpState) {
        throw ERRORS.TypedError('Device_ThpStateMissing');
    }

    try {
        if (thpState.phase === 'hh0') {
            await createThpChannel(device, settings);
        }
        if (thpState.phase === 'hh1') {
            await thpHandshake(device, settings);
        }
        if (thpState.phase === 'hh2') {
            if (thpState.isAutoconnectPaired) {
                // finish pairing, device is ready
                await thpPairingEnd(device);
            } else if (enforcePairing) {
                // start pairing with UI interaction
                await thpPairing(device, settings!);
            }
        }
    } catch (error) {
        thpState.resetState();

        throw error;
    }
};
