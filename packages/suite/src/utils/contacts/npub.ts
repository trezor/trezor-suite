// A contact identity is the 32-byte x-only secp256k1 public key the device derives at
// m/44'/1237'/0'/0/0 (NIP-06). State and the wire carry it as 64-char lowercase hex; `npub1…`
// (NIP-19 bech32) is only a display and exchange encoding.
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';
import { bech32 } from '@scure/base';

const NPUB_PREFIX = 'npub';
const NPUB_BYTES = 32;
const HEX64 = /^[0-9a-f]{64}$/;

export const isValidNpubHex = (hex: string) => HEX64.test(hex);

/** 64-char hex x-only public key -> `npub1…`. */
export const npubEncode = (pubkeyHex: string) => {
    if (!isValidNpubHex(pubkeyHex)) {
        throw new Error('Invalid identity: expected 32 bytes of hex');
    }

    return bech32.encode(NPUB_PREFIX, bech32.toWords(hexToBytes(pubkeyHex)), false);
};

/** `npub1…` -> 64-char hex x-only public key. */
export const npubDecode = (npub: string) => {
    let decoded;
    try {
        decoded = bech32.decode(npub as `${string}1${string}`, false);
    } catch {
        // Surface our own error for a bad checksum or malformed input, not @scure/base internals.
        throw new Error('Invalid identity: malformed npub');
    }

    if (decoded.prefix !== NPUB_PREFIX) {
        throw new Error(`Invalid identity: expected an ${NPUB_PREFIX} prefix`);
    }

    const bytes = bech32.fromWords(decoded.words);
    if (bytes.length !== NPUB_BYTES) {
        throw new Error('Invalid identity: expected 32 bytes');
    }

    return bytesToHex(bytes);
};

/**
 * Accepts either encoding and normalises it to hex, so the rest of the app deals only in hex.
 *
 * A leading NIP-21 `nostr:` scheme is tolerated, because other Nostr apps put `nostr:npub1…` on
 * QR codes and share links. The `npub1` prefix is matched case-insensitively: QR generators often
 * emit the all-uppercase bech32 form, which @scure/base decodes. The value itself is passed on
 * untouched, so @scure/base still rejects mixed case; lower-casing first would turn an invalid
 * mixed-case string into a valid one.
 */
export const parseIdentity = (input: string) => {
    const value = input.trim().replace(/^nostr:/i, '');
    const lowerCaseValue = value.toLowerCase();

    if (lowerCaseValue.startsWith(`${NPUB_PREFIX}1`)) return npubDecode(value);
    if (isValidNpubHex(lowerCaseValue)) return lowerCaseValue;

    throw new Error('Invalid identity: expected npub1... or 64 hex characters');
};

/**
 * Canonical `npub1…` form of a scanned or pasted identity for display in an input field. Anything
 * that is not an identity comes back trimmed and unchanged, so the caller's own validation reports
 * it; a QR or paste handler must never throw.
 */
export const normalizeScannedIdentity = (input: string): string => {
    try {
        return npubEncode(parseIdentity(input));
    } catch {
        return input.trim();
    }
};

/** `npub1qwer…asdf` for lists where the full value does not fit. */
export const shortenNpub = (npub: string, chars = 8) =>
    npub.length <= chars * 2 + 1 ? npub : `${npub.slice(0, chars)}…${npub.slice(-chars)}`;
