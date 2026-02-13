import { Evolu } from '@evolu/common';

import { asSuiteSyncOwnerId } from '@suite-common/suite-sync-storage';
import { SuiteSyncErrorHandler } from '@suite-common/suite-sync-types';

export const createEvoluErrorHandler =
    (_evolu: Evolu<any>, errorHandler: SuiteSyncErrorHandler) => (error?: unknown) => {
        if (error == null) {
            return;
        }

        const parsedError = error as { type?: string; ownerId?: string };

        switch (parsedError.type) {
            case 'ProtocolQuotaError':
                if (!parsedError.ownerId) {
                    return;
                }

                errorHandler({
                    type: 'RelayQuotaExceeded',
                    ownerId: asSuiteSyncOwnerId(parsedError.ownerId),
                });

                return;

            default:
                errorHandler({ type: 'RelayOther', message: JSON.stringify(error) });

                return;
        }
    };
