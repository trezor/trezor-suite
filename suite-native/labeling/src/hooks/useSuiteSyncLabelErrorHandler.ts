import { useSelector } from 'react-redux';

import { selectIsDeviceConnected } from '@suite-common/device';
import { SuiteSyncUpdateError } from '@suite-common/suite-sync-storage';
import { EnsureWalletSuiteSyncOnErrors } from '@suite-common/suite-sync-types';
import { useToast } from '@suite-native/toasts';
import { exhaustive } from '@trezor/type-utils';

export const useSuiteSyncErrorHandler = () => {
    const { showToast } = useToast();
    const isDeviceConnected = useSelector(selectIsDeviceConnected);

    const handleSuiteSyncError = (error: EnsureWalletSuiteSyncOnErrors | SuiteSyncUpdateError) => {
        const { type } = error;
        switch (type) {
            case 'SuiteSyncUnavailableOnDeviceError':
            case 'SuiteSyncFirmwareUpgradeNeededDeviceErrorType':
            case 'DeviceCancelled':
            case 'SuiteSyncUpdateError':
                showToast({ variant: 'error', icon: 'warning', message: type });

                return;
            case 'DeviceError':
                // Don't show an error when the device is disconnected — Suite Sync is still
                // enabled and will fetch keys the next time the device connects.
                if (isDeviceConnected) {
                    showToast({ variant: 'error', icon: 'warning', message: type });
                }

                return;
            case 'WriteModeRequiredForAllocation':
                // Do nothing, this is expected control flow error when we want allocate on-demand.
                return;
            default:
                return exhaustive(type);
        }
    };

    return { handleSuiteSyncError };
};
