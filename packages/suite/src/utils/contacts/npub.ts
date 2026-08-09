/**
 * A contact identity is the 32-byte x-only secp256k1 public key derived from the
 * device at m/44'/1237'/0'/0/0 (NIP-06). On the wire and in our state it is a
 * 64-char lowercase hex string; `npub1...` is only a display/exchange encoding
 * (NIP-19 bech32).
 */
import { bech32 } from '@scure/base';

export const NPUB_PREFIX = 'npub';
const NPUB_BYTES = 32;
const HEX64 = /^[0-9a-f]{64}$/;

export const isValidNpubHex = (hex: string) => HEX64.test(hex);

export const hexToBytes = (hex: string) => {
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);

    return out;
};

export const bytesToHex = (bytes: Uint8Array) =>
    Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

/** 64-char hex x-only pubkey -> npub1... */
export const npubEncode = (pubkeyHex: string) => {
    if (!isValidNpubHex(pubkeyHex)) {
        throw new Error('Invalid identity: expected 32 bytes of hex');
    }

    return bech32.encode(NPUB_PREFIX, bech32.toWords(hexToBytes(pubkeyHex)), false);
};

/** npub1... -> 64-char hex x-only pubkey */
export const npubDecode = (npub: string) => {
    const { prefix, words } = bech32.decode(npub as `${string}1${string}`, false);
    if (prefix !== NPUB_PREFIX) {
        throw new Error(`Invalid identity: expected an ${NPUB_PREFIX} prefix`);
    }
    const bytes = bech32.fromWords(words);
    if (bytes.length !== NPUB_BYTES) {
        throw new Error('Invalid identity: expected 32 bytes');
    }

    return bytesToHex(bytes);
};

/**
 * Accepts either encoding and normalises to hex. Used at every UI boundary so the
 * rest of the app only ever deals in hex.
 */
export const parseIdentity = (input: string) => {
    const value = input.trim();
    if (value.startsWith(`${NPUB_PREFIX}1`)) return npubDecode(value);
    const lower = value.toLowerCase();
    if (isValidNpubHex(lower)) return lower;

    throw new Error('Invalid identity: expected npub1... or 64 hex characters');
};

/** npub1qwer…asdf — for lists where the full value does not fit */
export const shortenNpub = (npub: string, chars = 8) =>
    npub.length <= chars * 2 + 1 ? npub : `${npub.slice(0, chars)}…${npub.slice(-chars)}`;
