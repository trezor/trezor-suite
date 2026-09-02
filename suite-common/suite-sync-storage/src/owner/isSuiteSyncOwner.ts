import { hasProp, typedObjectKeys } from '@trezor/utils';

import { type SuiteSyncOwnerSerialized } from './suiteSyncOwner';

const SUITE_SYNC_OWNER_ID_PATTERN = /^[A-Za-z0-9_-]{22}$/;
const SUITE_SYNC_OWNER_SECRET_PATTERN = /^[0-9a-f]{128}$/i;

export const isSuiteSyncOwner = (value: string): value is SuiteSyncOwnerSerialized => {
    let parsedValue: unknown;

    try {
        parsedValue = JSON.parse(value);
    } catch {
        return false;
    }

    if (!hasProp(parsedValue, 'ownerId') || !hasProp(parsedValue, 'ownerSecret')) {
        return false;
    }

    const keys = typedObjectKeys(parsedValue);
    if (keys.length !== 2) {
        return false;
    }

    return (
        typeof parsedValue.ownerId === 'string' &&
        SUITE_SYNC_OWNER_ID_PATTERN.test(parsedValue.ownerId) &&
        typeof parsedValue.ownerSecret === 'string' &&
        SUITE_SYNC_OWNER_SECRET_PATTERN.test(parsedValue.ownerSecret)
    );
};
