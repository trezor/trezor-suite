import { createHash, randomBytes } from 'crypto';
import { thp as protocolThp } from '@trezor/protocol';
import { createDeferred } from '@trezor/utils';
import type { Device } from './Device';
import { UiResponseThpPairingTag, DEVICE } from '../events';
import { ThpSettings } from '../types';
import { promptThpPairing, promptPassphrase } from './prompts';

type MessageType = protocolThp.ThpMessageType & { ButtonAck: {} };
type MessageKey = keyof MessageType;
type TypedPayload<T extends MessageKey> = {
    type: T;
    message: NonNullable<MessageType[T]>;
};
type TypedCallResponseMap = {
    [K in keyof MessageType]: TypedPayload<K>;
};
type DefaultPayloadMessage = TypedCallResponseMap[keyof MessageType];

// const assertRequest = () => {};

// const assertResponse = (res: DefaultPayloadMessage, resType: MessageKey | MessageKey[]) => {
//     const splitResTypes = Array.isArray(resType) ? resType : resType.split('|');
//     if (!splitResTypes.includes(res.type)) {
//         throw ERRORS.TypedError(
//             'Runtime',
//             `assertType: Response of unexpected type: ${res.type}. Should be ${resType}`,
//         );
//     }
// };

// const call = () => {};

// function filterCommonTypes(
//     device: Device,
//     result: DefaultPayloadMessage,
// ): Promise<DefaultPayloadMessage> {
//     if (result.type === 'ThpPairingPreparationsFinished') {
//         // eslint-disable-next-line @typescript-eslint/no-use-before-define
//         return thpWaitForThpPairingTag(device);
//     }

//     if (result.type === 'ButtonRequest') {
//         return thpCall(device, 'ButtonAck', resType as any, {});
//     }
//     if (result.type === 'Failure') {
//         throw new Error('thpCall Failure');
//     }
//     if (result.type === 'ThpError') {
//         throw new Error('ThpError ' + result.message.code + ' ' + result.message.message);
//     }

//     return Promise.resolve(result);
// }

export function thpCall<T extends MessageKey, R extends MessageKey[]>(
    device: Device,
    type: T,
    resType: R,
    msg?: MessageType[T],
): Promise<TypedCallResponseMap[R[number]]>;
export function thpCall<T extends MessageKey, R extends MessageKey>(
    device: Device,
    type: T,
    resType: R,
    msg?: MessageType[T],
): Promise<TypedPayload<R>>;
export async function thpCall(
    device: Device,
    name: MessageKey,
    resType: MessageKey | MessageKey[],
    data?: DefaultPayloadMessage['message'],
) {
    if (!device.transportSession) {
        throw new Error('THPCall Failure transportSession missing');
    }

    console.log('THPCall', name, device.protocolState);
    const result = await device.transport.call({
        session: device.transportSession,
        name,
        data: data || {},
        protocol: device.protocol,
        protocolState: device.protocolState,
        // TODO: abort signal
    });
    console.log('THPCall result', result);
    if (!result.success) {
        throw new Error(result.error + ' ');
    }

    // assertResponse(result.payload, resType);

    if (
        (name === 'ThpStartPairingRequest' || name === 'ThpCodeEntryChallenge') &&
        result.payload.type === 'ThpPairingPreparationsFinished'
    ) {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        return thpWaitForThpPairingTag(device);
    }

    if (result.payload.type === 'ButtonRequest') {
        if (result.payload.message.code === 'ButtonRequest_PassphraseEntry') {
            device.emit(DEVICE.PASSPHRASE_ON_DEVICE);
        } else {
            device.emit(DEVICE.BUTTON, device, result.payload.message);
        }

        return thpCall(device, 'ButtonAck', resType as any, {});
    }
    if (result.payload.type === 'Failure') {
        throw new Error('thpCall Failure');
    }
    if (result.payload.type === 'ThpError') {
        throw new Error('ThpError ' + result.payload.message.code);
    }

    return result.payload;
}

const processQrCodeTag = async (device: Device, value: string) => {
    const tagSha = createHash('sha256').update(Buffer.from(value, 'hex')).digest('hex');
    const qrCodeSecret = await thpCall(device, 'ThpQrCodeTag', 'ThpQrCodeSecret', {
        tag: tagSha,
    });

    protocolThp.validateHP6(
        device.protocolState.handshakeCredentials!,
        value,
        qrCodeSecret.message.secret,
    );

    return qrCodeSecret;
};

const processNfcTag = async (device: Device, value: string) => {
    const tagSha = createHash('sha256').update(Buffer.from(value, 'hex')).digest('hex');
    const nfcSecret = await thpCall(
        device,
        'ThpNfcUnidirectionalTag',
        'ThpNfcUnidirectionalSecret',
        {
            tag: tagSha,
        },
    );

    protocolThp.validateHP7(
        device.protocolState.handshakeCredentials!,
        value,
        nfcSecret.message.secret,
    );

    return nfcSecret;
};

const processCodeEntry = async (device: Device, value: string) => {
    // TODO: code value on 6 bytes written with offset 2?
    const codeValue = Buffer.alloc(6);
    codeValue.writeUint32BE(Number(value), 2);

    const hostKeys = protocolThp.getCpaceHostKeys(
        codeValue,
        device.protocolState!.handshakeCredentials!.handshakeHash,
    );
    const cpaceTrezor = await thpCall(device, 'ThpCodeEntryCpaceHost', 'ThpCodeEntryCpaceTrezor', {
        cpace_host_public_key: hostKeys.publicKey.toString('hex'),
    });

    const tag = protocolThp
        .getShareSecret(
            Buffer.from(cpaceTrezor.message.cpace_trezor_public_key, 'hex'),
            hostKeys.privateKey,
        )
        .toString('hex');

    const codeEntrySecret = await thpCall(device, 'ThpCodeEntryTag', 'ThpCodeEntrySecret', { tag });

    protocolThp.validateHP5(
        device.protocolState.handshakeCredentials!,
        value,
        codeEntrySecret.message.secret,
    );

    return codeEntrySecret;
};

const processThpPairingResponse = (device: Device, payload: UiResponseThpPairingTag['payload']) => {
    console.log('processThpPairingResponse', payload);

    if (payload.source === 'qr-code') {
        return processQrCodeTag(device, payload.value);
    }

    if (payload.source === 'nfc') {
        return processNfcTag(device, payload.value);
    }

    if (payload.source === 'code-entry') {
        return processCodeEntry(device, payload.value);
    }

    throw new Error(`Unknown THP pairing source + ${payload.source}`);
};

const thpWaitForThpPairingTag = async (device: Device) => {
    const dfd = createDeferred<UiResponseThpPairingTag['payload'] | { error: string }>();

    // start listening for the Cancel message from Trezor
    const readAbort = new AbortController();
    const readCancel = device.transport.receive({
        session: device.transportSession!,
        protocol: device.protocol,
        protocolState: device.protocolState, // TODO: set expected responses?
        signal: readAbort.signal,
    });

    readCancel
        .then(r => {
            console.log('readCancelPromise result', r);

            if (r.success) {
                dfd.resolve({ error: r.payload.message.message as string });
            }
        })
        .catch(e => {
            console.log('readCancelPromise error', e);
            // silent
        });

    console.log('thpWaitForThpPairingTag', device.protocolState.handshakeCredentials);

    // start listening for the UI response
    promptThpPairing(device)
        .then(response => {
            dfd.resolve(response);
        })
        .catch(e => {
            console.log('catch promptThpPairing error', e);
            dfd.resolve({ error: e.message });
        });

    const pairingResponse = await dfd.promise;
    readAbort.abort();
    console.log('Waiting for read cancel to finish-start');
    await readCancel;
    console.log('Waiting for read cancel to finish-end');

    if ('error' in pairingResponse) {
        throw new Error(pairingResponse.error);
    }

    return processThpPairingResponse(device, pairingResponse);
};

export const getThpSession = async (device: Device, deriveCardano: boolean) => {
    let passphrase;
    if (!device.features.passphrase_protection) {
        passphrase = { value: '' };
        // TODO: passphrase_always on device
    } else {
        passphrase = await promptPassphrase(device)
            .then(response => {
                // const { passphrase, passphraseOnDevice, cache } = response;
                console.log('getThpSession', response);

                return response;
            })
            .catch(e => {
                console.log('getThpSession error', e);
            });
    }

    // TODO: write tests same as in pairing
    if (passphrase) {
        const newSessionParams = passphrase.passphraseOnDevice
            ? { on_device: passphrase.passphraseOnDevice, derive_cardano: deriveCardano }
            : { passphrase: passphrase.value, derive_cardano: deriveCardano };

        const newSession = await thpCall(
            device,
            'ThpCreateNewSession',
            'ThpNewSession',
            newSessionParams,
        );

        return newSession.message.new_session_id;
    }

    return 0;
};

const thpPairing = async (
    device: Device,
    handshake: ThpHandshakeResponse,
    settings: ThpSettings,
) => {
    let isPaired = !!handshake.state;
    if (isPaired) {
        return;
    }

    const isUsingCodeEntry = handshake.pairingMethods.includes(
        protocolThp.ThpPairingMethod.CodeEntry,
    );
    const pairingReq = await thpCall(
        device,
        'ThpStartPairingRequest',
        ['ThpCodeEntryCommitment', 'ThpEndResponse'],
        {
            host_name: settings.hostName || 'TODO FALLBACK',
        },
    );

    // No_Method
    if (pairingReq.type === 'ThpEndResponse') {
        isPaired = true;

        return;
    }

    if (isUsingCodeEntry) {
        // store handshakeCommitment and validate later in `processCodeEntry`
        const codeEntryChallenge = randomBytes(32);
        const handshakeCommitment = Buffer.from(pairingReq.message.commitment, 'hex');
        device.protocolState.updateHandshakeCredentials({
            handshakeCommitment,
            codeEntryChallenge,
        });

        // TODO: expected type
        await thpCall(device, 'ThpCodeEntryChallenge', 'ThpQrCodeSecret', {
            challenge: codeEntryChallenge.toString('hex'),
        });
    }

    const pairedCredentials = await thpCall(
        device,
        'ThpCredentialRequest',
        'ThpCredentialResponse',
        {
            host_static_pubkey: handshake.hostStaticPublicKey.toString('hex'),
        },
    );

    console.log('my new credentials!', pairedCredentials.message);
    // TODO: emit device.change event

    await thpCall(device, 'ThpEndRequest', 'ThpEndResponse', {});
};

const getPairingMethods = (
    deviceMethods?: (protocolThp.ThpPairingMethod | keyof typeof protocolThp.ThpPairingMethod)[],
    settingsMethods?: (protocolThp.ThpPairingMethod | keyof typeof protocolThp.ThpPairingMethod)[],
) => {
    return deviceMethods?.flatMap(dm => {
        const value = typeof dm === 'string' ? protocolThp.ThpPairingMethod[dm] : dm;
        const isRequested =
            settingsMethods &&
            settingsMethods.find(sm => {
                const value2 = typeof sm === 'string' ? protocolThp.ThpPairingMethod[sm] : sm;

                return value === value2;
            });

        return isRequested ? value : [];
    });
};

// Try to establish Trezor Host Protocol channel
// this operation is allowed to fail:
// - on older FW without THP
// - using older trezord, bridge older than 3.0.0 adds MESSAGE_MAGIC_HEADER_BYTE to each chunk
export const createThpChannel = async (device: Device, settings?: ThpSettings) => {
    device.protocolState.setChannel(Buffer.from('ffff', 'hex'));
    const nonce = randomBytes(8);
    const createChannel = await thpCall(
        device,
        'ThpCreateChannelRequest',
        'ThpCreateChannelResponse',
        {
            nonce,
        },
    );

    const { properties, ...p } = createChannel.message;

    // TODO: this is not mentioned by the docs
    if (nonce.compare(p.nonce) !== 0) {
        throw new Error('Nonce not meet' + nonce.toString('hex') + ' ' + p.nonce.toString('hex'));
    }

    const pairingMethods = getPairingMethods(properties.pairing_methods, settings?.pairingMethods);
    if (!pairingMethods?.length) {
        // is it error? or device unreadable?
        throw new Error('No common pairing methods');
    }

    device.properties = properties;
    device.protocolState.setChannel(p.channel);
    device.protocolState.updateHandshakeCredentials({
        pairingMethods,
        handshakeHash: p.handshakeHash,
    });
};

type ThpHandshakeResponse = protocolThp.ThpHandshakeCompletionResponse & {
    state: 0 | 1;
    tag: Buffer;
    pairingMethods: protocolThp.ThpPairingMethod[];
    hostStaticPublicKey: Buffer;
};

export const thpHandshake = async (
    device: Device,
    settings?: ThpSettings,
): Promise<ThpHandshakeResponse> => {
    // const pairingMethods = getPairingMethods(
    //     device.properties?.pairing_methods,
    //     settings.pairingMethods,
    // );

    const pairingMethods = device.protocolState?.handshakeCredentials?.pairingMethods || [];

    const staticKeys = settings ? Buffer.from(settings.staticKeys, 'hex') : randomBytes(32);
    const hostStaticKeys = protocolThp.getCurve25519KeyPair(staticKeys);
    const hostEphemeralKeys = protocolThp.getCurve25519KeyPair(randomBytes(32));
    const hostEphemeralPubKey = Buffer.from(hostEphemeralKeys.publicKey);
    const knownCredentials = settings?.knownCredentials || [];

    const handshakeInit = await thpCall(
        device,
        'ThpHandshakeInitRequest',
        'ThpHandshakeInitResponse',
        { key: hostEphemeralPubKey },
    );

    const { trezorEncryptedStaticPubkey } = handshakeInit.message;
    const { protocolState } = device;

    const handshakeCredentials = protocolThp.handleHandshakeInitResponse(
        handshakeInit.message,
        protocolState,
        {
            hostStaticKeys,
            hostEphemeralKeys,
            knownCredentials,
        },
    );

    const { hostKey, trezorKey, hostEncryptedStaticPubkey } = handshakeCredentials;

    protocolState.updateHandshakeCredentials({
        trezorEncryptedStaticPubkey,
        hostEncryptedStaticPubkey,
        handshakeHash: handshakeCredentials.handshakeHash,
        trezorKey,
        hostKey,
    });

    const noise = {
        pairing_methods: pairingMethods,
        host_pairing_credential: handshakeCredentials.credentials?.credential, // TODO: fallback
    };

    const handshakeCompletion = await thpCall(
        device,
        'ThpHandshakeCompletionRequest',
        'ThpHandshakeCompletionResponse',
        {
            hostPubkey: hostEncryptedStaticPubkey,
            noise,
        },
    );

    // TODO: this should be here but i don't heave an access to plain protobuf payload of ThpHandshakeCompletionRequest
    // protocolState.updateHandshakeCredentials(
    //     protocolThp.handleHandshakeCompletionResponse(
    //         protocolState.handshakeCredentials!,
    //         payload, // protobuf payload
    //     ),
    // );

    return {
        ...handshakeCompletion.message,
        hostStaticPublicKey: hostStaticKeys.publicKey,
        pairingMethods,
    };
};

export const initThpChannel = async (device: Device, settings?: ThpSettings) => {
    if (!device.protocolState.channel.length) {
        await createThpChannel(device, settings);
    }

    if (!device.features) {
        console.log('Start handshake...', device.protocolState);
        const handshake = await thpHandshake(device, settings);
        console.log('Handshake success', handshake);

        const pairing = await thpPairing(device, handshake, settings!);
        console.log('Pairing success', pairing);
    }
};
