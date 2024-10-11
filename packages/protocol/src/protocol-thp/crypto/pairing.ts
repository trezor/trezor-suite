import { randomBytes, createHash } from 'crypto';

import { aesgcm } from './aesgcm';
import { curve25519, getCurve25519KeyPair, elligator2 } from './curve25519';
import { getIvFromNonce, hashOfTwo, hkdf, sha256, bigEndianBytesToBigInt } from './tools';
import { ThpProtocolState } from '../ThpProtocolState';
import {
    ThpHandshakeCredentials,
    ThpCredentialResponse,
    ThpHandshakeInitResponse,
} from '../messages';

const getProtocolName = () =>
    Buffer.concat([Buffer.from('Noise_XX_25519_AESGCM_SHA256'), Buffer.alloc(4).fill(0)]);

export const handleCreateChannelResponse = (deviceProperties: Buffer) => {
    // 1. Set h = SHA-256(protocol_name || device_properties).
    return hashOfTwo(getProtocolName(), deviceProperties);
};

// called after handshakeCompletionRequest
export const handleHandshakeCompletionResponse = (
    credentials: ThpHandshakeCredentials,
    payload: Buffer,
) => {
    const handshakeHash = hashOfTwo(credentials.handshakeHash, payload);
    const [hostKey, trezorKey] = hkdf(credentials.trezorKey, Buffer.alloc(0));

    // 2. Set trezor_state, success = AES-GCM-DECRYPT(key=key_response, IV=0^96, ad=empty_string, plaintext=trezor_state). Assert that success is True.
    // const aes = aesgcm(hostKey, Buffer.alloc(12));
    // aes.auth(handshakeHash);
    // const trezorState =

    return {
        ...credentials,
        handshakeHash,
        trezorKey,
        hostKey,
    };
};

// 10. Search credentials for a pairs (trezor_static_pubkey, credential) such that trezor_masked_static_pubkey == X25519(SHA-256(trezor_static_pubkey || trezor_ephemeral_pubkey), trezor_static_pubkey).
export const findKnownPairingCredentials = (
    trezorStaticPubkey: Buffer,
    trezorEphemeralPubkey: Buffer,
) => {
    // X25519(SHA-256(trezor_static_pubkey || trezor_ephemeral_pubkey), trezor_static_pubkey).
    const h = hashOfTwo(trezorStaticPubkey, trezorEphemeralPubkey);

    return curve25519(h, trezorStaticPubkey);
};

export const getTrezorState = (credentials: ThpHandshakeCredentials, payload: Buffer) => {
    // 2. Set trezor_state, success = AES-GCM-DECRYPT(key=key_response, IV=0^96, ad=empty_string, plaintext=trezor_state). Assert that success is True.
    const aes = aesgcm(credentials.trezorKey, Buffer.alloc(12));
    aes.auth(Buffer.alloc(0));
    const trezorState = aes.decrypt(payload.subarray(0, 1), payload.subarray(1, 17));

    return trezorState.readUint8();
};

type Curve25519KeyPair = ReturnType<typeof getCurve25519KeyPair>;

export const handleHandshakeInitResponse = (
    resp: ThpHandshakeInitResponse,
    protocolState: ThpProtocolState,
    {
        knownCredentials,
        hostStaticKeys,
        hostEphemeralKeys,
    }: {
        knownCredentials: ThpCredentialResponse[];
        hostEphemeralKeys: Curve25519KeyPair;
        hostStaticKeys: Curve25519KeyPair;
    },
) => {
    if (!protocolState.handshakeCredentials) {
        throw new Error('TODO: handshakeCredentials always present?');
    }

    const { trezorEphemeralPubkey, trezorEncryptedStaticPubkey, tag } = resp;
    const { sendNonce, recvNonce } = protocolState;
    const { handshakeHash } = protocolState.handshakeCredentials;
    const iv0 = getIvFromNonce(sendNonce); // should be 0
    const iv1 = getIvFromNonce(recvNonce); // should be 1

    let h: Buffer, point: Buffer, aes: ReturnType<typeof aesgcm>;

    // 1. Set h = SHA-256(protocol_name || device_properties).
    // h = hash_of_two(PROTOCOL_NAME, deviceProperties); // moved to handleCreateChannelResponse
    h = handshakeHash;
    // 2. Set h = SHA-256(h || host_ephemeral_pubkey).
    h = hashOfTwo(h, hostEphemeralKeys.publicKey);
    // 3. Set h = SHA-256(h || trezor_ephemeral_pubkey).
    h = hashOfTwo(h, trezorEphemeralPubkey);
    // 4. Set ck, k = HKDF(protocol_name, X25519(host_ephemeral_privkey, trezor_ephemeral_pubkey)).
    point = curve25519(hostEphemeralKeys.privateKey, trezorEphemeralPubkey);
    let [ck, k] = hkdf(getProtocolName(), point);

    // 5. Set trezor_masked_static_pubkey, success = AES-GCM-DECRYPT(key=k, IV=0^96 (bits, 12 bytes), ad=h, plaintext=encrypted_trezor_static_pubkey). Assert that success is True.
    aes = aesgcm(k, iv0);
    aes.auth(h);
    const trezorStaticPubkey = trezorEncryptedStaticPubkey.subarray(0, 32);
    const trezorStaticPubkeyTag = trezorEncryptedStaticPubkey.subarray(32, 32 + 16);
    const trezorMaskedStaticPubkey = aes.decrypt(trezorStaticPubkey, trezorStaticPubkeyTag);
    // 6. Set h = SHA-256(h || encrypted_trezor_static_pubkey)
    h = hashOfTwo(h, trezorEncryptedStaticPubkey);
    // 7. Set ck, k = HKDF(ck, X25519(host_ephemeral_privkey, trezor_masked_static_pubkey))
    point = curve25519(hostEphemeralKeys.privateKey, trezorMaskedStaticPubkey);
    [ck, k] = hkdf(ck, point);

    // 8. Set tag_of_empty_string, success = AES-GCM-DECRYPT(key=k, IV=0^96 (bits, 12 bytes), ad=h, plaintext=empty_string). Assert that success is True.
    aes = aesgcm(k, iv0);
    aes.auth(h);
    aes.decrypt(Buffer.alloc(0), tag);
    // 9. Set h = SHA-256(h || tag)
    h = hashOfTwo(h, tag);

    // 10. Search credentials for a pairs (trezor_static_pubkey, credential) such that trezor_masked_static_pubkey == X25519(SHA-256(trezor_static_pubkey || trezor_ephemeral_pubkey), trezor_static_pubkey).
    const credentials = knownCredentials.find(c => {
        return findKnownPairingCredentials(
            Buffer.from(c.trezor_static_pubkey!, 'hex'),
            trezorEphemeralPubkey,
        );
    });

    // 10.1 If found set (temp_host_static_privkey, temp_host_static_pubkey) = (host_static_privkey, host_static_pubkey).
    // 10.2 If not found set (temp_host_static_privkey, temp_host_static_pubkey) = (X25519(0, B), 0).
    const hostTempKeys = credentials
        ? hostStaticKeys
        : getCurve25519KeyPair(Buffer.alloc(32).fill(0));

    // 11. Set encrypted_host_static_pubkey = AES-GCM-ENCRYPT(key=k, IV=0^95 || 1, ad=h, plaintext=temp_host_static_pubkey).
    aes = aesgcm(k, iv1);
    aes.auth(h);
    const hostEncryptedStaticPubkey = Buffer.concat([
        aes.encrypt(hostTempKeys.publicKey),
        aes.finish(),
    ]);
    // 12. Set h = SHA-256(h || encrypted_host_static_pubkey).
    h = hashOfTwo(h, hostEncryptedStaticPubkey);
    // 13. Set ck, k = HKDF(ck, X25519(temp_host_static_privkey, trezor_ephemeral_pubkey)).
    point = curve25519(hostTempKeys.privateKey, trezorEphemeralPubkey);
    [ck, k] = hkdf(ck, point);

    return {
        trezorMaskedStaticPubkey,
        trezorEncryptedStaticPubkey,
        hostEncryptedStaticPubkey,
        hostKey: k,
        trezorKey: ck,
        handshakeHash: h,
        credentials,
    };
};

export const getCpaceHostKeys = (code: Buffer, handshakeHash: Buffer) => {
    // https://www.notion.so/satoshilabs/Pairing-phase-996b0e879fff4ebd9460ae27376fce76
    // If the user enters code, take the following actions:
    // 2. Compute *pregenerator* as the first 32 bytes of SHA-512(*prefix* || *code* - 6 bytes || *padding || h*), where *prefix* is the byte-string  0x08 || 0x43 || 0x50 || 0x61 || 0x63 || 0x65 || 0x32 || 0x35 || 0x35 || 0x06 and *padding* is the byte-string 0x50 || 0x00 ^ 80 || 0x20.
    // 3. Set *generator =* ELLIGATOR2(*pregenerator*).
    // 4. Generate a random 32-byte *cpace_host_private_key.*
    // 5. Set *cpace_host_public_key* = X25519(*cpace_host_private_key*, *generator*).
    // 6. Send the message CodeEntryCpaceHost(*cpace_host_public_key*) to the host.

    const shaCtx = createHash('sha512');
    shaCtx.update(Buffer.from([0x08, 0x43, 0x50, 0x61, 0x63, 0x65, 0x32, 0x35, 0x35, 0x06]));
    shaCtx.update(code);
    shaCtx.update(
        Buffer.concat([Buffer.from([0x6f]), Buffer.alloc(111).fill(0), Buffer.from([0x20])]),
    );
    shaCtx.update(handshakeHash);
    shaCtx.update(Buffer.from([0x00]));
    const sha = shaCtx.digest().subarray(0, 32);

    const generator = elligator2(sha);

    const privateKey = randomBytes(32);
    const publicKey = curve25519(privateKey, generator);

    return { privateKey, publicKey };
};

export const getShareSecret = (publicKey: Buffer, privateKey: Buffer) => {
    // 1. Set *shared_secret* = X25519(*cpace_host_private_key*, *cpace_trezor_public_key*).
    // 2. Set *tag* = SHA-256(*shared_secret*).

    const sharedSecret = curve25519(privateKey, publicKey);

    const sha = sha256(Buffer.from(sharedSecret));

    return sha;
};

export const validateHP5 = (
    credentials: ThpHandshakeCredentials,
    value: string,
    secret: string,
) => {
    // 1. Assert that handshake commitment = SHA-256(secret)
    const sha = createHash('sha256').update(Buffer.from(secret, 'hex')).digest();
    const { handshakeHash, handshakeCommitment, codeEntryChallenge } = credentials;
    if (sha.compare(handshakeCommitment) !== 0) {
        throw new Error(
            `validateHP5: commitment don't match ${handshakeCommitment.toString('hex')} != ${sha.toString('hex')}`,
        );
    }

    // 2. Assert that code = SHA-256(h || secret || challenge || PairingMethod_CodeEntry) % 1000000
    const shaCtx = createHash('sha256');
    shaCtx.update(handshakeHash);
    shaCtx.update(Buffer.from(secret, 'hex'));
    shaCtx.update(codeEntryChallenge);
    shaCtx.update(Buffer.from('PairingMethod_CodeEntry', 'utf-8'));
    const calculatedValue = bigEndianBytesToBigInt(shaCtx.digest()) % 1000000n;
    if (calculatedValue !== BigInt(value)) {
        throw new Error(`validateHP5: value don't match ${value} != ${calculatedValue.toString()}`);
    }
};

export const validateHP6 = (
    { handshakeHash }: ThpHandshakeCredentials,
    value: string,
    secret: string,
) => {
    // Assert that code = SHA-256(h || secret || PairingMethod_QrCode).
    const shaCtx = createHash('sha256');
    shaCtx.update(handshakeHash);
    shaCtx.update(Buffer.from(secret, 'hex'));
    shaCtx.update(Buffer.from('PairingMethod_QrCode', 'utf-8'));

    const calculatedValue = shaCtx.digest().subarray(0, 16).toString('hex');
    if (calculatedValue !== value) {
        throw new Error(`validateHP7: value don't match ${value} != ${calculatedValue}: secret`);
    }
};

export const validateHP7 = (
    { handshakeHash }: ThpHandshakeCredentials,
    value: string,
    secret: string,
) => {
    // Assert that code = SHA-256(h || secret || PairingMethod_NfcUnidirectional).
    const shaCtx = createHash('sha256');
    shaCtx.update(handshakeHash);
    shaCtx.update(Buffer.from(secret, 'hex'));
    shaCtx.update(Buffer.from('PairingMethod_NfcUnidirectional', 'utf-8'));

    const calculatedValue = shaCtx.digest().subarray(0, 16).toString('hex');
    if (calculatedValue !== value) {
        throw new Error(`validateHP7: value don't match ${value} != ${calculatedValue}: secret`);
    }
};
