import { increaseOwnerQuotaThunk } from '@suite-common/suite-sync-quota-manager';
import {
    type CreateSuiteSyncErrorHandlerDep,
    type Errors,
    type SuiteSyncErrorHandler,
} from '@suite-common/suite-sync-types';

export const createSuiteSyncErrorHandler =
    (deps: CreateSuiteSyncErrorHandlerDep): SuiteSyncErrorHandler =>
    (error: Errors) => {
        switch (error.type) {
            case 'RelayQuotaExceeded':
                deps.dispatch(
                    increaseOwnerQuotaThunk({
                        ownerId: error.ownerId,
                    }),
                );

                return;

            default:
                console.error('SuiteSync relay error', error.message);

                return;
        }
    };
