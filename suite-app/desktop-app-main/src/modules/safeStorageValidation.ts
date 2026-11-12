import { isDelegatedIdentityKey } from '@suite-common/delegated-identity-key';
import { isReferralKey } from '@suite-common/refer-a-friend';
import { isSuiteSyncOwner } from '@suite-common/suite-sync-storage';

type AllowedValueValidator = (value: string) => boolean;

const allowedValueValidators: AllowedValueValidator[] = [
    isDelegatedIdentityKey,
    isSuiteSyncOwner,
    isReferralKey,
];

export const isSafeStorageDecryptedValue = (value: string): boolean =>
    allowedValueValidators.some(validator => validator(value));
