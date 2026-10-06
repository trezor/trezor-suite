import { isDelegatedIdentityKey } from '@suite-common/delegated-identity-key';
import { isSuiteSyncOwner } from '@suite-common/suite-sync-storage';

type AllowedValueValidator = (value: string) => boolean;

const allowedValueValidators: AllowedValueValidator[] = [isDelegatedIdentityKey, isSuiteSyncOwner];

export const isSafeStorageDecryptedValue = (value: string): boolean =>
    allowedValueValidators.some(validator => validator(value));
