import { EvoluError, ReadonlyStore } from '@evolu/common';

import { asSuiteSyncOwnerId } from '@suite-common/suite-sync-storage';
import { SuiteSyncErrorHandler } from '@suite-common/suite-sync-types';

export const createEvoluErrorHandler =
    (evoluError: ReadonlyStore<EvoluError | null>, errorHandler: SuiteSyncErrorHandler) => () => {
        const error = evoluError.get();

        if (error == null) {
            return;
        }

        switch (error.type) {
            case 'ProtocolQuotaError':
                if (!error.ownerId) {
                    return;
                }

                errorHandler({
                    type: 'RelayQuotaExceeded',
                    ownerId: asSuiteSyncOwnerId(error.ownerId),
                });

                return;

            default:
                errorHandler({ type: 'RelayOther', message: JSON.stringify(error) });

                return;
        }
    };
