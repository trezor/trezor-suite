import { randomBytes } from '@noble/hashes/utils.js';

import { ERRORS } from '@trezor/connect-common/src/constants';
import { protobufManager } from '@trezor/protobuf';
import type { ThpPairingMethod } from '@trezor/protocol';
import { thp as protocolThp } from '@trezor/protocol';

import { thpCall } from './thpCall';
import * as settingsStore from '../../data/settingsStore';
import type { IDevice } from '../../types/idevice';

// intersection of device acceptable methods and host acceptable methods
const getPairingMethods = (
    deviceMethods?: (ThpPairingMethod | keyof typeof ThpPairingMethod)[],
    settingsMethods?: (ThpPairingMethod | keyof typeof ThpPairingMethod)[],
) =>
    deviceMethods?.flatMap(dm => {
        const value = protocolThp.getThpPairingMethod(dm);
        const isRequested = settingsMethods?.find(
            sm => value === protocolThp.getThpPairingMethod(sm),
        );

        return isRequested ? value : [];
    });

// State HH0
// https://github.com/trezor/trezor-firmware/blob/41692dc2cdb937564abe7fecd4bfc3e508adc8d4/docs/common/thp/specification.md#state-hh0
export const createThpChannel = async (device: IDevice) => {
    const thpState = device.getThpState();
    if (!thpState) {
        throw ERRORS.TypedError('Device_ThpStateMissing');
    }

    // set default channel and create random nonce
    thpState.setChannel(protocolThp.constants.THP_DEFAULT_CHANNEL);
    const nonce = Buffer.from(randomBytes(8));
    const createChannel = await thpCall(device, 'ThpCreateChannelRequest', { nonce });

    const { properties, ...resp } = createChannel.message;

    // NOTE: nonce validation is not mentioned by the docs
    if (nonce.compare(resp.nonce) !== 0) {
        throw new Error(
            'Nonce not meet' + nonce.toString('hex') + ' ' + resp.nonce.toString('hex'),
        );
    }

    // find common pairing methods
    const settings = settingsStore.get('thp');
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
// https://github.com/trezor/trezor-firmware/blob/41692dc2cdb937564abe7fecd4bfc3e508adc8d4/docs/common/thp/specification.md#state-hh1
export const thpHandshake = async (device: IDevice, unlockPin = false) => {
    const thpState = device.getThpState();
    if (!thpState?.handshakeCredentials) {
        throw ERRORS.TypedError('Device_ThpStateMissing');
    }

    const settings = settingsStore.get('thp');
    // sort credentials by autoconnect field
    const knownCredentials = (settings?.knownCredentials || []).sort(cre =>
        cre.autoconnect ? -1 : 1,
    );
    const tryToUnlock = unlockPin ? 1 : 0;

    // 1. Generate a new ephemeral X25519 key pair (host_ephemeral_privkey, host_ephemeral_pubkey).
    const hostEphemeralKeys = protocolThp.getCurve25519KeyPair(Buffer.from(randomBytes(32)));

    // 2. Send the message HandshakeInitiationReq(host_ephemeral_pubkey) to the host.
    const handshakeInit = await thpCall(device, 'ThpHandshakeInitRequest', {
        key: hostEphemeralKeys.publicKey,
        tryToUnlock,
    });

    const { trezorEncryptedStaticPubkey } = handshakeInit.message;

    // cryptography steps from HH1 to HH2
    const handshakeCredentials = protocolThp.handleHandshakeInit({
        handshakeInitResponse: handshakeInit.message,
        thpState,
        hostEphemeralKeys,
        knownCredentials,
        tryToUnlock,
        protobufEncoder: (name, data) => protobufManager.encode(name, data),
    });

    // update thpState
    const { hostKey, trezorKey, hostEncryptedStaticPubkey } = handshakeCredentials;
    thpState.updateHandshakeCredentials({
        trezorEncryptedStaticPubkey,
        hostEncryptedStaticPubkey,
        handshakeHash: handshakeCredentials.handshakeHash,
        trezorKey,
        hostKey,
        staticKey: handshakeCredentials.staticKey,
        hostStaticPublicKey: handshakeCredentials.hostStaticKeys.publicKey,
    });

    thpState.setPairingCredentials(handshakeCredentials.allCredentials);

    const handshakeCompletion = await thpCall(device, 'ThpHandshakeCompletionRequest', {
        hostPubkey: hostEncryptedStaticPubkey,
        encryptedPayload: handshakeCredentials.encryptedPayload,
    });

    const completionState = handshakeCompletion.message.state;
    if (!completionState && handshakeCredentials.credentials) {
        // Known credentials was used but not accepted by device -> throw them away
        thpState.removePairingCredential(handshakeCredentials.credentials);

        const { credential } = handshakeCredentials.credentials;
        const index = settings?.knownCredentials?.findIndex(c => c.credential === credential) ?? -1;
        if (index >= 0) {
            settings?.knownCredentials?.splice(index, 1);
        }
    }

    // Spec HH3 step 3: if no credential was presented the device MUST report STATE_UNPAIRED.
    if (!handshakeCredentials.credentials && completionState !== 0) {
        throw ERRORS.TypedError(
            'Device_InvalidState',
            'Device returned paired state without valid credentials',
        );
    }

    thpState.setIsPaired(completionState !== 0);
    thpState.setPhase('pairing');

    if (handshakeCredentials.credentials?.autoconnect || completionState === 2) {
        // State HC1 -> HC2 pairing complete
        // finish pairing. device is ready to communicate without further interaction
        await thpCall(device, 'ThpEndRequest', {});
        thpState.setPhase('paired');
    }
};
