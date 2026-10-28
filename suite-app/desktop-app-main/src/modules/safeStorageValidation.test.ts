import {
    asSuiteSyncOwnerId,
    asSuiteSyncOwnerSecretHex,
    serializeSuiteSyncOwner,
} from '@suite-common/suite-sync-storage';

import { isSafeStorageDecryptedValue } from './safeStorageValidation';

const referralKey = 'referral-v1:5f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a';
const delegatedIdentityKey = '0c9d40cd155e7ddb93e7b3c7b2acd8d75e7a3ebd543a3504c8f8164fb692772b';
const suiteSyncOwner = serializeSuiteSyncOwner({
    ownerId: asSuiteSyncOwnerId('yg0UgROParTpm60ltI3hDw'),
    ownerSecret: asSuiteSyncOwnerSecretHex(
        'e17818d7c458f171885280eeef2d70078c6842b51e18ec6f2f8c9f44d3d171fd0f49a3aeff32a560d7f823321fcd24f8d8773ffa59855c6447b11af88a2fd7b5',
    ),
});

describe(isSafeStorageDecryptedValue.name, () => {
    it.each([
        delegatedIdentityKey,
        delegatedIdentityKey.toUpperCase(),
        suiteSyncOwner,
        referralKey,
    ])('accepts a supported value', value => {
        expect(isSafeStorageDecryptedValue(value)).toBe(true);
    });

    it('rejects a value unsupported by all validators', () => {
        expect(isSafeStorageDecryptedValue('arbitrary plaintext')).toBe(false);
    });
});
