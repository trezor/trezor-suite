import { randomBytes } from 'crypto';

import { encodeMessage } from '@trezor/protobuf';
import { ThpPairingMethod, thp as protocolThp } from '@trezor/protocol';

import { thpCall } from './thpCall';
import { ERRORS } from '../../constants';
import { DataManager } from '../../data/DataManager';
import type { Device } from '../Device';

// intersection of device acceptable methods and host acceptable methods
const enumFromString = (dm: ThpPairingMethod | keyof typeof ThpPairingMethod) =>
    typeof dm === 'string' ? protocolThp.ThpPairingMethod[dm] : dm;

const getPairingMethods = (
    deviceMethods?: (ThpPairingMethod | keyof typeof ThpPairingMethod)[],
    settingsMethods?: (ThpPairingMethod | keyof typeof ThpPairingMethod)[],
) =>
    deviceMethods?.flatMap(dm => {
        const value = enumFromString(dm);
        const isRequested =
            settingsMethods && settingsMethods.find(sm => value === enumFromString(sm));

        return isRequested ? value : [];
    });

// State HH0
// TODO: link-to-public-docs
// https://www.notion.so/satoshilabs/THP-Specification-2-1-203dc5260606804192aecaa58fb961ca
export const createThpChannel = async (device: Device) => {
    const thpState = device.getThpState();
    if (!thpState) {
        throw ERRORS.TypedError('Device_ThpStateMissing');
    }

    // set default channel and create random nonce
    thpState.setChannel(protocolThp.constants.THP_DEFAULT_CHANNEL);
    const nonce = randomBytes(8);
    const createChannel = await thpCall(device, 'ThpCreateChannelRequest', { nonce });

    const { properties, ...resp } = createChannel.message;

    // TODO: link-to-public-docs nonce validation is not mentioned by the docs
    if (nonce.compare(resp.nonce) !== 0) {
        throw new Error(
            'Nonce not meet' + nonce.toString('hex') + ' ' + resp.nonce.toString('hex'),
        );
    }

    // find common pairing methods
    const settings = DataManager.getSettings('thp');
    const pairingMethods = getPairingMethods(properties.pairing_methods, settings?.pairingMethods);
    if (!pairingMethods?.length) {
        throw ERRORS.TypedError('Device_ThpPairingMethodsException');
    }

    // update properties, channel and handshake credentials
    thpState.setThpProperties(properties);
    thpState.setChannel(resp.channel);
    thpState.updateHandshakeCredentials({
        pairingMethods,
        handshakeHash: resp.handshakeHash,
    });

    // ready for transition to state HH1 -> thpHandshake
};

// State HH1 and HH2
// TODO: link-to-public-docs
// https://www.notion.so/satoshilabs/THP-Specification-2-1-203dc5260606804192aecaa58fb961ca
export const thpHandshake = async (device: Device) => {
    const thpState = device.getThpState();
    if (!thpState?.handshakeCredentials) {
        throw ERRORS.TypedError('Device_ThpStateMissing');
    }

    const settings = DataManager.getSettings('thp');
    // get staticKey from settings or create new random
    const staticKey = settings?.staticKey
        ? Buffer.from(settings.staticKey, 'hex')
        : randomBytes(32);
    const hostStaticKeys = protocolThp.getCurve25519KeyPair(staticKey);
    // sort credentials by autoconnect field
    const knownCredentials = (settings?.knownCredentials || []).sort(cre =>
        cre.autoconnect ? -1 : 1,
    );

    // 1. Generate a new ephemeral X25519 key pair (host_ephemeral_privkey, host_ephemeral_pubkey).
    const hostEphemeralKeys = protocolThp.getCurve25519KeyPair(randomBytes(32));

    // 2. Send the message HandshakeInitiationReq(host_ephemeral_pubkey) to the host.
    const handshakeInit = await thpCall(device, 'ThpHandshakeInitRequest', {
        key: hostEphemeralKeys.publicKey,
    });

    const { trezorEncryptedStaticPubkey } = handshakeInit.message;

    // cryptography steps from HH1 to HH2
    const handshakeCredentials = protocolThp.handleHandshakeInit({
        handshakeInitResponse: handshakeInit.message,
        thpState,
        hostStaticKeys,
        hostEphemeralKeys,
        knownCredentials,
        protobufEncoder: (name, data) => encodeMessage(device.transport.getMessages(), name, data),
    });

    // update thpState
    const { hostKey, trezorKey, hostEncryptedStaticPubkey } = handshakeCredentials;
    thpState.updateHandshakeCredentials({
        trezorEncryptedStaticPubkey,
        hostEncryptedStaticPubkey,
        handshakeHash: handshakeCredentials.handshakeHash,
        trezorKey,
        hostKey,
        staticKey,
        hostStaticPublicKey: hostStaticKeys.publicKey,
    });

    thpState.setPairingCredentials(handshakeCredentials.allCredentials);

    const handshakeCompletion = await thpCall(device, 'ThpHandshakeCompletionRequest', {
        hostPubkey: hostEncryptedStaticPubkey,
        encryptedPayload: handshakeCredentials.encryptedPayload,
    });

    thpState.setIsPaired(!!handshakeCompletion.message.state);
    thpState.setPhase('pairing');

    if (thpState.isPaired && thpState.isAutoconnectPaired) {
        // finish pairing. device is ready to communicate without further interaction
        await thpCall(device, 'ThpEndRequest', {});
        thpState.setPhase('paired');
    }
};
