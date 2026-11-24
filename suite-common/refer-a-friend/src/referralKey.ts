// Not lazy loaded: ed25519 is sizeable on its own, but its shared @noble dependencies are already in the boot bundle,
// so splitting would only save cca 3.2 kB gzipped, with most of the saving eaten by the chunking overhead.
import { ed25519 } from '@noble/curves/ed25519.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, concatBytes, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';

import { type Branded } from '@trezor/type-utils';

/**
 * Serialized Ed25519 private key (seed) of the referral account, `referral-v1:<64 hex chars>`.
 * The prefix IS NOT used in key derivation or signing. It labels the value among other secrets
 * stored through the platform encryption (see `isReferralKey` in `desktop-app-main`).
 * Bump its version whenever the meaning of the stored value changes, either its format or the
 * scheme that derived it, so previously stored keys fail validation and get re-derived.
 */
export type ReferralKey = string & Branded<'ReferralKey'>;

const REFERRAL_KEY_PREFIX = 'referral-v1:';
const REFERRAL_KEY_PATTERN = /^referral-v1:[0-9a-f]{64}$/;

// Domain separation, so the raw cipherKeyValue output is never used directly as a key. Bumping
// its version derives a different key for every user (a new referral account), so do it only for
// a breaking change of the cryptographic scheme, together with REFERRAL_KEY_PREFIX.
const REFERRAL_KEY_DOMAIN = 'trezor-referral-v1';

export const isReferralKey = (value: string): value is ReferralKey =>
    REFERRAL_KEY_PATTERN.test(value);

const getReferralKeySeed = (referralKey: ReferralKey) =>
    hexToBytes(referralKey.slice(REFERRAL_KEY_PREFIX.length));

export const getReferralKeyFromCipheredValue = (cipheredValueHex: string): ReferralKey => {
    const seed = sha256(
        concatBytes(utf8ToBytes(REFERRAL_KEY_DOMAIN), hexToBytes(cipheredValueHex)),
    );

    return `${REFERRAL_KEY_PREFIX}${bytesToHex(seed)}` as ReferralKey;
};

export const getReferralPublicKey = (referralKey: ReferralKey) =>
    bytesToHex(ed25519.getPublicKey(getReferralKeySeed(referralKey)));

export const signWithReferralKey = (referralKey: ReferralKey, message: Uint8Array) =>
    bytesToHex(ed25519.sign(message, getReferralKeySeed(referralKey)));
