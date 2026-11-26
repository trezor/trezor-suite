import { schnorr, secp256k1 } from '@noble/curves/secp256k1.js';
import { hex } from '@scure/base';

import { type Result, err, ok } from '@trezor/type-utils';

import { type NostrEvent, type NostrEventDraft } from './nostr/nostrEvent';

/**
 * The CipherKeyValue call a wallet's Trezor derives the wallet's contacts messaging key (its hot
 * key) with: without a screen, so Suite can read it whenever it needs to, and the same in every
 * Suite. Changing any field changes every wallet's hot key, so none of it may change.
 */
export const CONTACTS_HOT_KEY_CIPHER_KEY_VALUE = {
    path: "m/10017'/0'",
    key: 'Trezor contacts messaging key',
    value: '00'.repeat(32),
    encrypt: true,
    askOnEncrypt: false,
    askOnDecrypt: false,
} as const;

/** A replaceable kind (NIP-01, 10000-19999): a relay keeps only an identity's newest one. */
export const CONTACTS_HOT_KEY_ATTESTATION_KIND = 10777;

const PUBKEY_HEX = /^[0-9a-f]{64}$/;

/**
 * The key contacts encrypt messages to the wallet with. It lives only in Suite's memory; the
 * wallet's identity attests it once, so contacts can find it by the wallet's npub.
 */
export type ContactsHotKey = {
    secretKey: Uint8Array;
    /** x-only, hex. */
    pubkey: string;
};

/** Whether `pubkey` is the hex of a BIP-340 public key, i.e. of a point on the curve. */
export const isXOnlyPublicKey = (pubkey: string) =>
    PUBKEY_HEX.test(pubkey) && secp256k1.utils.isValidPublicKey(hex.decode(`02${pubkey}`), true);

/** The hot key in the value the Trezor ciphered, which is uniformly random 32 bytes. */
export const getContactsHotKey = (
    cipheredValue: string,
): Result<ContactsHotKey, 'InvalidHotKey'> => {
    const value = cipheredValue.toLowerCase();

    if (!PUBKEY_HEX.test(value)) {
        return err('InvalidHotKey');
    }

    const secretKey = hex.decode(value);

    if (!secp256k1.utils.isValidSecretKey(secretKey)) {
        return err('InvalidHotKey');
    }

    return ok({ secretKey, pubkey: hex.encode(schnorr.getPublicKey(secretKey)) });
};

type GetHotKeyAttestationDraftParams = {
    hotPubkey: string;
    createdAt: number;
};

/** What the wallet's identity signs, on its Trezor, to say the hot key speaks for it. */
export const getHotKeyAttestationDraft = ({
    hotPubkey,
    createdAt,
}: GetHotKeyAttestationDraftParams): NostrEventDraft => ({
    kind: CONTACTS_HOT_KEY_ATTESTATION_KIND,
    created_at: createdAt,
    tags: [],
    content: hotPubkey,
});

type GetAttestedHotKeyParams = {
    /** Authentic events, as a relay delivered them for the identity. */
    events: NostrEvent[];
    identityPubkey: string;
};

/** The hot key the identity attested last; a relay may answer with anything, so all is checked. */
export const getAttestedHotKey = ({ events, identityPubkey }: GetAttestedHotKeyParams) =>
    events
        .filter(
            event =>
                event.kind === CONTACTS_HOT_KEY_ATTESTATION_KIND &&
                event.pubkey === identityPubkey &&
                isXOnlyPublicKey(event.content),
        )
        .toSorted((a, b) => b.created_at - a.created_at)
        .at(0)?.content;
