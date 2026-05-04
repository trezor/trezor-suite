import { OwnerSecret, ownerSecretToMnemonic } from '@evolu/common';

import { asSuiteSyncOwnerSecretHex } from '@suite-common/suite-sync-storage';

import { deriveSparkMnemonicFromSuiteSyncSecret } from '../sparkMnemonic';

const SUITE_SYNC_OWNER_SECRET_HEX = asSuiteSyncOwnerSecretHex(
    '4a8b2c1d5e6f708192a3b4c5d6e7f80911223344556677889900aabbccddeeff',
);

describe('sparkMnemonic', () => {
    it('derives mnemonic deterministically from suite sync owner secret', () => {
        const firstMnemonic = deriveSparkMnemonicFromSuiteSyncSecret(SUITE_SYNC_OWNER_SECRET_HEX);
        const secondMnemonic = deriveSparkMnemonicFromSuiteSyncSecret(SUITE_SYNC_OWNER_SECRET_HEX);

        expect(firstMnemonic).toEqual(secondMnemonic);
        expect(firstMnemonic.success).toBe(true);
    });

    it('derives sibling mnemonic instead of reusing base owner mnemonic directly', () => {
        const baseOwnerSecret = OwnerSecret.from(
            Uint8Array.from(Buffer.from(SUITE_SYNC_OWNER_SECRET_HEX, 'hex')).slice(0, 32),
        );
        const sparkMnemonic = deriveSparkMnemonicFromSuiteSyncSecret(SUITE_SYNC_OWNER_SECRET_HEX);

        expect(sparkMnemonic.success).toBe(true);

        if (!sparkMnemonic.success || !baseOwnerSecret.ok) {
            throw new Error('Expected valid mnemonic derivation');
        }

        expect(sparkMnemonic.payload).not.toEqual(ownerSecretToMnemonic(baseOwnerSecret.value));
    });

    it('returns an error for invalid owner secret hex', () => {
        expect(deriveSparkMnemonicFromSuiteSyncSecret('invalid-owner-secret' as never)).toEqual({
            error: { type: 'InvalidSuiteSyncOwnerSecretHex' },
            success: false,
        });
    });
});
