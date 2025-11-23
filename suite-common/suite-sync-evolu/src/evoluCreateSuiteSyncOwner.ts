import { CreateSuiteSyncOwner } from '@suite-common/suite-sync-storage';
import { asSuiteSyncOwnerId, asSuiteSyncOwnerSecretHex } from '@suite-common/suite-types';
import { err, ok } from '@trezor/type-utils';

import { createEvoluAppOwnerFromTrezorData } from './createEvoluAppOwnerFromTrezorData';

export const evoluCreateSuiteSyncOwner: CreateSuiteSyncOwner = ({ data }) => {
    const appOwnerResult = createEvoluAppOwnerFromTrezorData({ data });

    if (!appOwnerResult.ok) {
        console.error('Evolu: appOwnerResult error', appOwnerResult);

        // We log the (unexpected) error, so we won't propagate it.
        // This shall never happen under standard circumstances and if this happens
        // something is terribly wrong (like Evolu BC Breaking Change)
        return err({
            type: 'CreateSuiteSyncOwnerError',
            message: 'Catastrophic failure, possible Evolu Breaking Change',
        });
    }

    return ok({
        ownerId: asSuiteSyncOwnerId(appOwnerResult.value.id),
        ownerSecret: asSuiteSyncOwnerSecretHex(data),
    });
};
