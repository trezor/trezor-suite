import { ed25519 } from '@noble/curves/ed25519.js';
import { hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';

import {
    getReferralKeyFromCipheredValue,
    getReferralPublicKey,
    isReferralKey,
    signWithReferralKey,
} from './referralKey';

const CIPHERED_VALUE = '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff';

describe('referralKey', () => {
    it('derives a deterministic serialized key from the ciphered value', () => {
        const referralKey = getReferralKeyFromCipheredValue(CIPHERED_VALUE);

        expect(referralKey).toBe(getReferralKeyFromCipheredValue(CIPHERED_VALUE));
        expect(isReferralKey(referralKey)).toBe(true);
        expect(referralKey).not.toContain(CIPHERED_VALUE);
    });

    it('derives different keys for different ciphered values', () => {
        expect(getReferralKeyFromCipheredValue(CIPHERED_VALUE)).not.toBe(
            getReferralKeyFromCipheredValue(CIPHERED_VALUE.replace('00', '01')),
        );
    });

    it.each([
        '',
        CIPHERED_VALUE,
        `referral-v1:${CIPHERED_VALUE.slice(2)}`,
        `referral-v1:${CIPHERED_VALUE.toUpperCase()}`,
        `referral-v2:${CIPHERED_VALUE}`,
        `{"ownerId":"x"}`,
    ])('rejects %p as a referral key', value => {
        expect(isReferralKey(value)).toBe(false);
    });

    it('signs messages verifiable by the public key', () => {
        const referralKey = getReferralKeyFromCipheredValue(CIPHERED_VALUE);
        const message = utf8ToBytes('message');
        const publicKey = getReferralPublicKey(referralKey);

        expect(publicKey).toMatch(/^[0-9a-f]{64}$/);
        expect(
            ed25519.verify(
                hexToBytes(signWithReferralKey(referralKey, message)),
                message,
                hexToBytes(publicKey),
            ),
        ).toBe(true);
    });
});
