import { messages } from '@suite/intl';
import { SuiteSyncUpdateError } from '@suite-common/suite-sync-storage';
import { EnsureWalletSuiteSyncOnErrors } from '@suite-common/suite-sync-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { StaticSessionId } from '@trezor/connect';
import { exhaustive } from '@trezor/type-utils';

import { suiteSyncErrorTranslationKeyMap } from './suiteSyncErrorTranslationKeyMap';
import { updateShowEnableSuiteSyncModal } from '../../../actions/suiteSync/suiteSyncSlice';
import { Dispatch } from '../../../types/suite';

type SuiteSyncErrorHandler = {
    error: EnsureWalletSuiteSyncOnErrors | SuiteSyncUpdateError;
    dispatch: Dispatch;
    deviceStaticSessionId: StaticSessionId;
};

export const suiteSyncErrorHandler = ({
    error,
    dispatch,
    deviceStaticSessionId,
}: SuiteSyncErrorHandler) => {
    const { type } = error;

    switch (type) {
        case 'SuiteSyncFirmwareUpgradeNeededDeviceErrorType':
        case 'SuiteSyncUnavailableOnDeviceError':
            dispatch(updateShowEnableSuiteSyncModal({ deviceStaticSessionId }));

            return;

        case 'DeviceCancelled':
        case 'DeviceError':
        case 'SuiteSyncUpdateError':
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: messages[suiteSyncErrorTranslationKeyMap[type]].defaultMessage,
                }),
            );

            return;

        case 'WriteModeRequiredForAllocation':
            // Do nothing, this is expected control flow error when we want allocate on-demand.
            return;

        default:
            return exhaustive(type);
    }
};
