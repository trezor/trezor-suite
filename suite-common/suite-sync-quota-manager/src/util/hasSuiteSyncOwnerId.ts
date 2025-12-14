import { createHash } from 'crypto';

import { SuiteSyncOwnerId } from '@suite-common/suite-types';

import { SuiteSyncOwnerIdHashed, asSuiteSyncOwnerIdHashed } from '../types';
/**
 * Deterministically hash `ownerId` to a fixed-length hex (sha256).
 * Returns a branded `SuiteSyncOwnerIdHashed`.
 */
export const hashSuiteSyncOwnerId = (ownerId: SuiteSyncOwnerId): SuiteSyncOwnerIdHashed => {
    const hex = createHash('sha256').update(ownerId).digest('hex');

    return asSuiteSyncOwnerIdHashed(hex);
};
