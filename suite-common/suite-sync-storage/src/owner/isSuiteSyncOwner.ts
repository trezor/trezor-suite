import { typedObjectKeys } from '@trezor/utils';

import { type SuiteSyncOwnerSerialized } from './suiteSyncOwner';

const SUITE_SYNC_OWNER_ID_PATTERN = /^[A-Za-z0-9_-]{22}$/;
const SUITE_SYNC_OWNER_SECRET_PATTERN = /^[0-9a-f]{128}$/i;

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

export const isSuiteSyncOwner = (value: string): value is SuiteSyncOwnerSerialized => {
    let parsedValue: unknown;

    try {
        parsedValue = JSON.parse(value);
    } catch {
        return false;
    }

    if (!isRecord(parsedValue)) {
        return false;
    }

    const keys = typedObjectKeys(parsedValue);
    if (keys.length !== 2 || !keys.includes('ownerId') || !keys.includes('ownerSecret')) {
        return false;
    }

    return (
        typeof parsedValue.ownerId === 'string' &&
        SUITE_SYNC_OWNER_ID_PATTERN.test(parsedValue.ownerId) &&
        typeof parsedValue.ownerSecret === 'string' &&
        SUITE_SYNC_OWNER_SECRET_PATTERN.test(parsedValue.ownerSecret)
    );
};
