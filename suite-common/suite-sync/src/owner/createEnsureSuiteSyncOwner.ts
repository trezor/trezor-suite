import { type EnsureSuiteSyncOwner } from '@suite-common/suite-sync-types';
import { ok } from '@trezor/type-utils';

import { type LoadSuiteSyncOwnerFromStateDep } from './createLoadSuiteSyncOwnerFromState';
import { type RetrieveSuiteSyncOwnerKeysDep } from './createRetrieveSuiteSyncOwner';
import { type SaveSuiteSyncOwnerDep } from './createSaveSuiteSyncOwner';

export type CreateEnsureSuiteSyncOwnerDeps = RetrieveSuiteSyncOwnerKeysDep &
    LoadSuiteSyncOwnerFromStateDep &
    SaveSuiteSyncOwnerDep;

/**
 * Responsibility:
 * - Ensure the Suite Sync owner exists in encrypted state storage.
 * - Retrieve and persist the owner only when it is not cached already.
 */
export const createEnsureSuiteSyncOwner =
    (deps: CreateEnsureSuiteSyncOwnerDeps): EnsureSuiteSyncOwner =>
    async ({ device, delegatedKey }) => {
        const currentSuiteSyncOwner = await deps.loadSuiteSyncOwnerFromState({
            deviceStaticId: device.state.staticSessionId,
        });

        if (currentSuiteSyncOwner !== null) {
            return ok(currentSuiteSyncOwner);
        }

        const result = await deps.retrieveSuiteSyncOwner({
            device,
            delegatedKey,
        });

        if (!result.success) {
            return result;
        }

        await deps.saveSuiteSyncOwner({
            deviceStaticId: device.state.staticSessionId,
            suiteSyncOwner: result.payload,
        });

        return ok(result.payload);
    };
