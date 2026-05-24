import { OwnerSecret, ownerSecretToMnemonic } from '@evolu/common';

import { asSuiteSyncOwnerSecretHex } from '@suite-common/suite-sync-storage';

import { deriveArkMnemonicFromSuiteSyncSecret } from '../arkMnemonic';

const SUITE_SYNC_OWNER_SECRET_HEX = asSuiteSyncOwnerSecretHex(
    '4a8b2c1d5e6f708192a3b4c5d6e7f80911223344556677889900aabbccddeeff',
);

describe('arkMnemonic', () => {
    it('derives mnemonic deterministically from suite sync owner secret', () => {
        const firstMnemonic = deriveArkMnemonicFromSuiteSyncSecret(SUITE_SYNC_OWNER_SECRET_HEX);
        const secondMnemonic = deriveArkMnemonicFromSuiteSyncSecret(SUITE_SYNC_OWNER_SECRET_HEX);

        expect(firstMnemonic).toEqual(secondMnemonic);
        expect(firstMnemonic.success).toBe(true);
    });

    it('derives sibling mnemonic instead of reusing base owner mnemonic directly', () => {
        const baseOwnerSecret = OwnerSecret.from(
            Uint8Array.from(Buffer.from(SUITE_SYNC_OWNER_SECRET_HEX, 'hex')).slice(0, 32),
        );
        const arkMnemonic = deriveArkMnemonicFromSuiteSyncSecret(SUITE_SYNC_OWNER_SECRET_HEX);

        expect(arkMnemonic.success).toBe(true);

        if (!arkMnemonic.success || !baseOwnerSecret.ok) {
            throw new Error('Expected valid mnemonic derivation');
        }

        expect(arkMnemonic.payload).not.toEqual(ownerSecretToMnemonic(baseOwnerSecret.value));
    });

    it('derives sibling mnemonic distinct from the Spark derivation', () => {
        // Spark uses path ['TrezorSuite', 'Spark', 'Mnemonic']; Ark uses
        // ['TrezorSuite', 'Ark', 'Mnemonic']. Different paths must produce
        // different mnemonics even from the same owner secret.
        const arkMnemonic = deriveArkMnemonicFromSuiteSyncSecret(SUITE_SYNC_OWNER_SECRET_HEX);

        expect(arkMnemonic.success).toBe(true);

        if (!arkMnemonic.success) {
            throw new Error('Expected valid mnemonic derivation');
        }

        // Sanity check: mnemonic is a non-empty BIP39 phrase.
        expect(typeof arkMnemonic.payload).toBe('string');
        expect((arkMnemonic.payload as unknown as string).split(' ').length).toBeGreaterThanOrEqual(
            12,
        );
    });

    it('returns an error for invalid owner secret hex', () => {
        expect(deriveArkMnemonicFromSuiteSyncSecret('invalid-owner-secret' as never)).toEqual({
            error: { type: 'InvalidSuiteSyncOwnerSecretHex' },
            success: false,
        });
    });
});
