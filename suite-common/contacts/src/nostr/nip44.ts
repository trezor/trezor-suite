import { chacha20 } from '@noble/ciphers/chacha.js';
import { equalBytes } from '@noble/ciphers/utils.js';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { expand, extract } from '@noble/hashes/hkdf.js';
import { hmac } from '@noble/hashes/hmac.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { concatBytes, randomBytes } from '@noble/hashes/utils.js';
import { base64, utf8 } from '@scure/base';

import { type Result, err, ok } from '@trezor/type-utils';

// NIP-44 version 2 (https://github.com/nostr-protocol/nips/blob/master/44.md), written against
// the libraries Suite already locks instead of pulling in nostr-tools and its own noble copies.
// Only the 2-byte length prefix is implemented: contacts messages are a few hundred bytes, and
// the published vectors refuse anything above 65535 bytes.
const VERSION = 2;
const SALT = utf8.decode('nip44-v2');
const NONCE_LENGTH = 32;
const MAC_LENGTH = 32;
const MIN_PLAINTEXT_LENGTH = 1;
const MAX_PLAINTEXT_LENGTH = 65535;
const MIN_PAYLOAD_LENGTH = 132;
const MAX_PAYLOAD_LENGTH = 87472;
const MIN_DATA_LENGTH = 99;
const MAX_DATA_LENGTH = 65603;

export type Nip44Error =
    | 'InvalidKey'
    | 'InvalidPlaintext'
    | 'UnknownVersion'
    | 'InvalidPayload'
    | 'InvalidMac'
    | 'InvalidPadding';

type GetNip44ConversationKeyParams = {
    secretKey: Uint8Array;
    /** The other party's 32-byte x-only (BIP-340) public key. */
    publicKey: Uint8Array;
};

/** The key two parties share, `conv(a, B) == conv(b, A)`; the x of a⋅B, unhashed, through HKDF. */
export const getNip44ConversationKey = ({
    secretKey,
    publicKey,
}: GetNip44ConversationKeyParams): Result<Uint8Array, 'InvalidKey'> => {
    if (publicKey.length !== 32) {
        return err('InvalidKey');
    }

    try {
        const sharedPoint = secp256k1.getSharedSecret(
            secretKey,
            concatBytes(Uint8Array.of(0x02), publicKey),
        );

        return ok(extract(sha256, sharedPoint.subarray(1, 33), SALT));
    } catch {
        // A secret key out of range or a public key that is no point on the curve.
        return err('InvalidKey');
    }
};

type GetNip44MessageKeysParams = {
    conversationKey: Uint8Array;
    nonce: Uint8Array;
};

export const getNip44MessageKeys = ({ conversationKey, nonce }: GetNip44MessageKeysParams) => {
    const keys = expand(sha256, conversationKey, nonce, 76);

    return {
        chachaKey: keys.subarray(0, 32),
        chachaNonce: keys.subarray(32, 44),
        hmacKey: keys.subarray(44, 76),
    };
};

export const calcNip44PaddedLength = (length: number) => {
    if (length <= 32) {
        return 32;
    }

    const nextPower = 2 ** (Math.floor(Math.log2(length - 1)) + 1);
    const chunk = nextPower <= 256 ? 32 : nextPower / 8;

    return chunk * (Math.floor((length - 1) / chunk) + 1);
};

const pad = (plaintext: Uint8Array) => {
    const padded = new Uint8Array(2 + calcNip44PaddedLength(plaintext.length));
    new DataView(padded.buffer).setUint16(0, plaintext.length, false);
    padded.set(plaintext, 2);

    return padded;
};

const unpad = (padded: Uint8Array): Result<Uint8Array, 'InvalidPadding'> => {
    const length = new DataView(padded.buffer, padded.byteOffset).getUint16(0, false);
    const plaintext = padded.subarray(2, 2 + length);

    // A zero length is the extended prefix of plaintexts above 65535 bytes, which is not used here.
    if (
        length === 0 ||
        plaintext.length !== length ||
        padded.length !== 2 + calcNip44PaddedLength(length)
    ) {
        return err('InvalidPadding');
    }

    return ok(plaintext);
};

const getMac = (hmacKey: Uint8Array, nonce: Uint8Array, ciphertext: Uint8Array) =>
    hmac(sha256, hmacKey, concatBytes(nonce, ciphertext));

type EncryptNip44Params = {
    plaintext: string;
    conversationKey: Uint8Array;
    /** Only tests pass one; every message needs a new random nonce. */
    nonce?: Uint8Array;
};

export const encryptNip44 = ({
    plaintext,
    conversationKey,
    nonce = randomBytes(NONCE_LENGTH),
}: EncryptNip44Params): Result<string, 'InvalidPlaintext'> => {
    const plaintextBytes = utf8.decode(plaintext);

    if (
        plaintextBytes.length < MIN_PLAINTEXT_LENGTH ||
        plaintextBytes.length > MAX_PLAINTEXT_LENGTH
    ) {
        return err('InvalidPlaintext');
    }

    const { chachaKey, chachaNonce, hmacKey } = getNip44MessageKeys({ conversationKey, nonce });
    const ciphertext = chacha20(chachaKey, chachaNonce, pad(plaintextBytes));
    const mac = getMac(hmacKey, nonce, ciphertext);

    return ok(base64.encode(concatBytes(Uint8Array.of(VERSION), nonce, ciphertext, mac)));
};

const decodePayload = (payload: string): Result<Uint8Array, Nip44Error> => {
    // `#` flags an encoding newer than base64, i.e. a later version.
    if (payload.length === 0 || payload.startsWith('#')) {
        return err('UnknownVersion');
    }

    // Checked before decoding, so a huge payload costs nothing.
    if (payload.length < MIN_PAYLOAD_LENGTH || payload.length > MAX_PAYLOAD_LENGTH) {
        return err('InvalidPayload');
    }

    let data: Uint8Array;

    try {
        data = base64.decode(payload);
    } catch {
        return err('InvalidPayload');
    }

    if (data.length < MIN_DATA_LENGTH || data.length > MAX_DATA_LENGTH) {
        return err('InvalidPayload');
    }

    if (data[0] !== VERSION) {
        return err('UnknownVersion');
    }

    return ok(data);
};

type DecryptNip44Params = {
    payload: string;
    conversationKey: Uint8Array;
};

/** The plaintext, if the payload is authentic for the conversation key. */
export const decryptNip44 = ({
    payload,
    conversationKey,
}: DecryptNip44Params): Result<string, Nip44Error> => {
    const data = decodePayload(payload);

    if (!data.success) {
        return data;
    }

    const nonce = data.payload.subarray(1, 1 + NONCE_LENGTH);
    const ciphertext = data.payload.subarray(1 + NONCE_LENGTH, data.payload.length - MAC_LENGTH);
    const mac = data.payload.subarray(data.payload.length - MAC_LENGTH);
    const { chachaKey, chachaNonce, hmacKey } = getNip44MessageKeys({ conversationKey, nonce });

    if (!equalBytes(getMac(hmacKey, nonce, ciphertext), mac)) {
        return err('InvalidMac');
    }

    const plaintext = unpad(chacha20(chachaKey, chachaNonce, ciphertext));

    return plaintext.success ? ok(utf8.encode(plaintext.payload)) : plaintext;
};
