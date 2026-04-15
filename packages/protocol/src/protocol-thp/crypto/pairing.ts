import { createHash, randomBytes } from 'crypto';

import { aesgcm } from './aesgcm';
import { curve25519, elligator2, getCurve25519KeyPair } from './curve25519';
import { bigEndianBytesToBigInt, getIvFromNonce, hashOfTwo, hkdf, sha256 } from './tools';
import { type ThpState } from '../ThpState';
import {
    type ThpCredentials,
    type ThpHandshakeCredentials,
    type ThpHandshakeInitResponse,
    ThpPairingMethod,
} from '../messages';

const getProtocolName = () =>
    Buffer.concat([Buffer.from('Noise_XX_25519_AESGCM_SHA256'), Buffer.alloc(4).fill(0)]);

export const getHandshakeHash = (deviceProperties: Buffer) =>
    // 1. Set h = SHA-256(protocol_name || device_properties).
    hashOfTwo(getProtocolName(), deviceProperties);

// 10. Search credentials for a pairs (trezor_static_pubkey, credential) such that trezor_masked_static_pubkey == X25519(SHA-256(trezor_static_pubkey || trezor_ephemeral_pubkey), trezor_static_pubkey).
export const findKnownPairingCredentials = (
    knownCredentials: ThpCredentials[],
    trezorMaskedStaticPubkey: Buffer,
    trezorEphemeralPubkey: Buffer,
) =>
    knownCredentials.filter(c => {
        try {
            const trezorStaticPubkey = Buffer.from(c.trezor_static_public_key, 'hex');
            // X25519(SHA-256(trezor_static_pubkey || trezor_ephemeral_pubkey), trezor_static_pubkey).
            const h = hashOfTwo(trezorStaticPubkey, trezorEphemeralPubkey);

            return trezorMaskedStaticPubkey.compare(curve25519(h, trezorStaticPubkey)) === 0;
        } catch {
            // silent
        }
    });

export const getTrezorState = (credentials: ThpHandshakeCredentials, payload: Buffer) => {
    // 2. Set trezor_state, success = AES-GCM-DECRYPT(key=key_response, IV=0^96, ad=empty_string, plaintext=trezor_state). Assert that success is True.
    const aes = aesgcm(credentials.trezorKey, Buffer.alloc(12));
    aes.auth(Buffer.alloc(0));
    const trezorState = aes.decrypt(payload.subarray(0, 1), payload.subarray(1, 17));

    return trezorState.readUint8() as 0 | 1;
};

type Curve25519KeyPair = ReturnType<typeof getCurve25519KeyPair>;

// State HH1
// TODO: link-to-public-docs
// https://www.notion.so/satoshilabs/THP-Specification-2-0-18fdc5260606806ab573d0a7cba1897a#193dc526060681b4b871e6b761107fba
export const handleHandshakeInit = ({
    handshakeInitResponse,
    thpState,
    knownCredentials,
    hostEphemeralKeys,
    tryToUnlock,
    protobufEncoder,
}: {
    handshakeInitResponse: ThpHandshakeInitResponse;
    thpState: ThpState;
    knownCredentials: ThpCredentials[];
    hostEphemeralKeys: Curve25519KeyPair;
    tryToUnlock: 0 | 1;
    protobufEncoder: (name: string, data: Record<string, unknown>) => { message: Buffer };
}) => {
    if (!thpState.handshakeCredentials) {
        throw new Error('ThpStateMissing');
    }

    const { trezorEphemeralPubkey, trezorEncryptedStaticPubkey, tag } = handshakeInitResponse;
    const { sendNonce, recvNonce } = thpState;
    const { handshakeHash } = thpState.handshakeCredentials;
    const iv0 = getIvFromNonce(sendNonce); // should be 0
    const iv1 = getIvFromNonce(recvNonce); // should be 1

    let h: Buffer, point: Buffer, aes: ReturnType<typeof aesgcm>;

    // 1. Set h = SHA-256(protocol_name || device_properties).
    // h = hash_of_two(PROTOCOL_NAME, deviceProperties); // moved to getHandshakeHash
    h = handshakeHash;
    // 2. Set h = SHA-256(h || host_ephemeral_pubkey).
    h = hashOfTwo(h, hostEphemeralKeys.publicKey);
    // 3. Set h = SHA-256(h || try_to_unlock).
    h = hashOfTwo(h, Buffer.from([tryToUnlock]));
    // 4. Set h = SHA-256(h || trezor_ephemeral_pubkey).
    h = hashOfTwo(h, trezorEphemeralPubkey);
    // 5. Set ck, k = HKDF(protocol_name, X25519(host_ephemeral_privkey, trezor_ephemeral_pubkey)).
    point = curve25519(hostEphemeralKeys.privateKey, trezorEphemeralPubkey);
    const hkdf1 = hkdf(getProtocolName(), point);
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    let ck: Buffer = hkdf1[0];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    let k: Buffer = hkdf1[1];

    // 6. Set trezor_masked_static_pubkey, success = AES-GCM-DECRYPT(key=k, IV=0^96 (bits, 12 bytes), ad=h, plaintext=encrypted_trezor_static_pubkey). Assert that success is True.
    aes = aesgcm(k, iv0);
    aes.auth(h);
    const trezorStaticPubkey = trezorEncryptedStaticPubkey.subarray(0, 32);
    const trezorStaticPubkeyTag = trezorEncryptedStaticPubkey.subarray(32, 32 + 16);
    const trezorMaskedStaticPubkey = aes.decrypt(trezorStaticPubkey, trezorStaticPubkeyTag);
    // 7. Set h = SHA-256(h || encrypted_trezor_static_pubkey)
    h = hashOfTwo(h, trezorEncryptedStaticPubkey);
    // 8. Set ck, k = HKDF(ck, X25519(host_ephemeral_privkey, trezor_masked_static_pubkey))
    point = curve25519(hostEphemeralKeys.privateKey, trezorMaskedStaticPubkey);
    const hkdf2 = hkdf(ck, point);
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    ck = hkdf2[0];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    k = hkdf2[1];

    // 9. Set tag_of_empty_string, success = AES-GCM-DECRYPT(key=k, IV=0^96 (bits, 12 bytes), ad=h, plaintext=empty_string). Assert that success is True.
    aes = aesgcm(k, iv0);
    aes.auth(h);
    aes.decrypt(Buffer.alloc(0), tag);
    // 10. Set h = SHA-256(h || tag)
    h = hashOfTwo(h, tag);

    // 11. Search credentials for a pairs
    const allCredentials = findKnownPairingCredentials(
        knownCredentials,
        trezorMaskedStaticPubkey,
        trezorEphemeralPubkey,
    );
    // and use first from the list (could be undefined)
    const credentials = allCredentials.length ? allCredentials[0] : undefined;

    // 11.1 If found set (temp_host_static_privkey, temp_host_static_pubkey) = (host_static_privkey, host_static_pubkey).
    // 11.2 If not found set (temp_host_static_privkey, temp_host_static_pubkey) = (X25519(0, B), 0).
    // NOTE: This logic is deprecated and zero keypair should never be used, source:
    // https://satoshilabs.slack.com/archives/C078GRAK58U/p1740132971826629?thread_ts=1739181741.870599&cid=C078GRAK58Us

    const staticKey = credentials?.host_static_key
        ? Buffer.from(credentials.host_static_key, 'hex')
        : randomBytes(32);
    const hostStaticKeys = getCurve25519KeyPair(staticKey);
    // 12. Set encrypted_host_static_pubkey = AES-GCM-ENCRYPT(key=k, IV=0^95 || 1, ad=h, plaintext=temp_host_static_pubkey).
    aes = aesgcm(k, iv1);
    aes.auth(h);
    const hostEncryptedStaticPubkey = Buffer.concat([
        aes.encrypt(hostStaticKeys.publicKey),
        aes.finish(),
    ]);
    // 13. Set h = SHA-256(h || encrypted_host_static_pubkey).
    h = hashOfTwo(h, hostEncryptedStaticPubkey);
    // 14. Set ck, k = HKDF(ck, X25519(temp_host_static_privkey, trezor_ephemeral_pubkey)).
    point = curve25519(hostStaticKeys.privateKey, trezorEphemeralPubkey);
    const hkdf3 = hkdf(ck, point);
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    ck = hkdf3[0];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    k = hkdf3[1];
    // 15. Set payload_binary = PROTOBUF-ENCODE(type=HandshakeCompletionReqNoisePayload, host_pairing_credential).
    const { message } = protobufEncoder('ThpHandshakeCompletionReqNoisePayload', {
        host_pairing_credential: credentials?.credential,
    });
    // 16. Set *encrypted_payload* = AES-GCM-ENCRYPT(*key*=*k*, *IV*=*0^96*, *ad*=*h*, *plaintext*=*payload_binary*).
    aes = aesgcm(k, iv0);
    aes.auth(h);
    const encryptedPayload = Buffer.concat([aes.encrypt(message), aes.finish()]);
    h = hashOfTwo(h, encryptedPayload);

    // HH2 and HH3
    // 1. Set key_request, key_response = HKDF(ck, empty_string).
    const hkdf4 = hkdf(ck, Buffer.alloc(0));
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const hostKey: Buffer = hkdf4[0];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const trezorKey: Buffer = hkdf4[1];

    return {
        trezorMaskedStaticPubkey,
        trezorEncryptedStaticPubkey,
        hostEncryptedStaticPubkey,
        hostKey,
        trezorKey,
        handshakeHash: h,
        credentials,
        allCredentials,
        encryptedPayload,
        staticKey,
        hostStaticKeys,
    };
};

export const getCpaceHostKeys = (code: Buffer, handshakeHash: Buffer) => {
    // TODO: link-to-public-docs
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

export const getSharedSecret = (publicKey: Buffer, privateKey: Buffer) => {
    // 1. Set *shared_secret* = X25519(*cpace_host_private_key*, *cpace_trezor_public_key*).
    // 2. Set *tag* = SHA-256(*shared_secret*).

    const sharedSecret = curve25519(privateKey, publicKey);

    return sha256(Buffer.from(sharedSecret));
};

export const validateCodeEntryTag = (
    credentials: ThpHandshakeCredentials,
    value: string,
    secret: string,
) => {
    // 1. Assert that handshake commitment = SHA-256(secret)
    const sha = createHash('sha256').update(Buffer.from(secret, 'hex')).digest();
    const { handshakeHash, handshakeCommitment, codeEntryChallenge } = credentials;
    if (sha.compare(handshakeCommitment) !== 0) {
        throw new Error(
            `HP5: commitment mismatch ${handshakeCommitment.toString('hex')} != ${sha.toString('hex')}`,
        );
    }

    // 2. Assert that value = SHA-256(ThpPairingMethod.CodeEntry || h || secret || challenge) % 1000000
    const shaCtx = createHash('sha256');
    shaCtx.update(Buffer.from([ThpPairingMethod.CodeEntry]));
    shaCtx.update(handshakeHash);
    shaCtx.update(Buffer.from(secret, 'hex'));
    shaCtx.update(codeEntryChallenge);

    const calculatedValue = bigEndianBytesToBigInt(shaCtx.digest()) % 1000000n;
    if (calculatedValue !== BigInt(value)) {
        throw new Error(`HP5: code mismatch ${value} != ${calculatedValue.toString()}`);
    }
};

export const validateQrCodeTag = (
    { handshakeHash }: ThpHandshakeCredentials,
    value: string,
    secret: string, // ThpQrCodeSecret.secret
) => {
    // Assert that value = SHA-256(ThpPairingMethod.QrCode || h || secret)
    const shaCtx = createHash('sha256');
    shaCtx.update(Buffer.from([ThpPairingMethod.QrCode]));
    shaCtx.update(handshakeHash);
    shaCtx.update(Buffer.from(secret, 'hex'));

    const calculatedValue = shaCtx.digest().subarray(0, 16);
    const expectedValue = Buffer.from(value, 'hex').subarray(0, 16);
    if (calculatedValue.compare(expectedValue) !== 0) {
        throw new Error(
            `HP6: code mismatch ${calculatedValue.toString('hex')} != ${expectedValue.toString('hex')}`,
        );
    }
};

// validate ThpNfcTagTrezor
export const validateNfcTag = (
    { handshakeHash }: ThpHandshakeCredentials,
    value: string, // ThpNfcTagTrezor.tag
    secret: Buffer, // ThpState.nfcSecret
) => {
    // Assert that value = SHA-256(ThpPairingMethod.NFC || h || secret)
    const shaCtx = createHash('sha256');
    shaCtx.update(Buffer.from([ThpPairingMethod.NFC]));
    shaCtx.update(handshakeHash);
    shaCtx.update(secret);

    const calculatedValue = shaCtx.digest().subarray(0, 16);
    const expectedValue = Buffer.from(value, 'hex').subarray(0, 16);
    if (calculatedValue.compare(expectedValue) !== 0) {
        throw new Error(
            `HP7: code mismatch ${calculatedValue.toString('hex')} != ${expectedValue.toString('hex')}`,
        );
    }
};
