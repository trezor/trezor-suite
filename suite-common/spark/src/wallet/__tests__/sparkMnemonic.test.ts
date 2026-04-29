import { OwnerSecret, ownerSecretToMnemonic } from '@evolu/common';

import { asSuiteSyncOwnerSecretHex } from '@suite-common/suite-sync-storage';

import {
    deriveSparkEntropyFromSuiteSyncSecret,
    deriveSparkMnemonicFromSuiteSyncSecret,
} from '../sparkMnemonic';

const SUITE_SYNC_OWNER_SECRET_HEX = asSuiteSyncOwnerSecretHex(
    '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f' +
        '202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f',
);

describe('sparkMnemonic', () => {
    it('derives mnemonic deterministically from suite sync owner secret', () => {
        const firstMnemonic = deriveSparkMnemonicFromSuiteSyncSecret(SUITE_SYNC_OWNER_SECRET_HEX);
        const secondMnemonic = deriveSparkMnemonicFromSuiteSyncSecret(SUITE_SYNC_OWNER_SECRET_HEX);

        expect(firstMnemonic).toEqual(secondMnemonic);
        expect(firstMnemonic.success).toBe(true);
    });

    it('derives sibling mnemonic instead of reusing base owner mnemonic directly', () => {
        const baseOwnerSecret = OwnerSecret.orThrow(
            Uint8Array.from({ length: 32 }, (_, index) => index),
        );
        const sparkMnemonic = deriveSparkMnemonicFromSuiteSyncSecret(SUITE_SYNC_OWNER_SECRET_HEX);

        expect(sparkMnemonic.success).toBe(true);

        if (!sparkMnemonic.success) {
            return;
        }

        expect(sparkMnemonic.payload).not.toEqual(ownerSecretToMnemonic(baseOwnerSecret));
    });

    it('returns error for invalid suite sync owner secret hex', () => {
        const invalidOwnerSecretHex = asSuiteSyncOwnerSecretHex('zzzz');

        expect(deriveSparkMnemonicFromSuiteSyncSecret(invalidOwnerSecretHex)).toEqual({
            success: false,
            error: { type: 'InvalidSuiteSyncOwnerSecretHex' },
        });
    });

    it('derives 32 byte spark entropy', () => {
        const sparkEntropy = deriveSparkEntropyFromSuiteSyncSecret(SUITE_SYNC_OWNER_SECRET_HEX);

        expect(sparkEntropy.success).toBe(true);

        if (!sparkEntropy.success) {
            return;
        }

        expect(sparkEntropy.payload).toHaveLength(32);
    });
});
