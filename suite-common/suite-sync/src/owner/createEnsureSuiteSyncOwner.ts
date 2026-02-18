import { EnsureSuiteSyncOwner } from '@suite-common/suite-sync-types';
import { ok } from '@trezor/type-utils';

import { LoadSuiteSyncOwnerFromStateDep } from './createLoadSuiteSyncOwnerFromState';
import { RetrieveSuiteSyncOwnerKeysDep } from './createRetrieveSuiteSyncOwner';
import { SaveSuiteSyncOwnerDep } from './createSaveSuiteSyncOwner';

export type CreateEnsureSuiteSyncOwnerDeps = RetrieveSuiteSyncOwnerKeysDep &
    LoadSuiteSyncOwnerFromStateDep &
    SaveSuiteSyncOwnerDep;

/**
 * Todo: Unify with current `createRefreshSuiteSync`, those services have same responsibility
 *       to get the SuiteSyncOwner and the current split is arbitrary and not by domain
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

        // Todo: const delegatedKeyResult = await deps.ensureDelegatedIdentityKey({ device });

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
