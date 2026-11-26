import { bech32, hex } from '@scure/base';

import { type Result, err, ok } from '@trezor/type-utils';

// A contact identity is the 32-byte x-only key the Trezor derives at m/44'/1237'/0'/0/0 (NIP-06).
// Its NIP-19 `npub1…` is the contact's id everywhere: in Suite Sync and as the WARD identifier,
// which the Trezor compares byte for byte with the npub it computes from a payment's attestation.
const NPUB_PREFIX = 'npub';
const PUBKEY_HEX = /^[0-9a-fA-F]{64}$/;
const PUBKEY_LENGTH = 32;

export type NpubError = 'InvalidNpub';

/** The canonical (lower-case) npub of a 64-hex x-only public key. */
export const encodeNpub = (pubkeyHex: string): Result<string, 'InvalidPubkey'> => {
    if (!PUBKEY_HEX.test(pubkeyHex)) {
        return err('InvalidPubkey');
    }

    return ok(bech32.encodeFromBytes(NPUB_PREFIX, hex.decode(pubkeyHex.toLowerCase())));
};

/**
 * The canonical npub of a typed or pasted identity. A leading NIP-21 `nostr:` scheme and the
 * all-upper-case form QR codes use are accepted; bech32 itself refuses mixed case.
 */
export const parseNpub = (input: string): Result<string, NpubError> => {
    const value = input.trim().replace(/^nostr:/i, '');
    const decoded = bech32.decodeUnsafe(value);

    if (!decoded || decoded.prefix !== NPUB_PREFIX) {
        return err('InvalidNpub');
    }

    const pubkey = bech32.fromWordsUnsafe(decoded.words);

    if (!pubkey || pubkey.length !== PUBKEY_LENGTH) {
        return err('InvalidNpub');
    }

    return ok(bech32.encodeFromBytes(NPUB_PREFIX, pubkey));
};

/** `npub1qwer…asdf` for places where the whole npub does not fit. */
export const shortenNpub = (npub: string) => `${npub.slice(0, 11)}…${npub.slice(-7)}`;
