import { useDispatch, useSelector } from 'react-redux';

import { TrezorDevice } from '@suite-common/suite-types';

import { isSuiteSyncSupportedByDevice } from './device';
import { disposeAllSuiteSyncStoragesThunk } from './disposeAllSuiteSyncStoragesThunk';
import { initSuiteSyncHackForHook } from './initSuiteSyncHackForHook';
import { suiteSyncActions } from './suiteSyncActions';
import {
    selectIsFeatureSuiteSyncAvailable,
    selectIsSuiteSyncDebugEnabled,
    selectIsSuiteSyncEnabled,
} from './suiteSyncSelectors';

export type UseLocalStorageParams = {
    // This needs to be passed, as labeling can be attached to remembered wallets
    // and different devices can have different states (FW versions)
    device: TrezorDevice | undefined;
};

export const useSuiteSync = ({ device }: UseLocalStorageParams) => {
    const dispatch = useDispatch();

    const isSuiteSyncEnabled = useSelector(selectIsSuiteSyncEnabled);
    const isSuiteSyncDebugEnabled = useSelector(selectIsSuiteSyncDebugEnabled);
    const isFeatureSuiteSyncAvailable = useSelector(selectIsFeatureSuiteSyncAvailable);

    const toggleIsFeatureSuiteSyncAvailable = () => {
        dispatch(
            suiteSyncActions.updateIsFeatureSuiteSyncAvailable({
                isShownInSettings: !isFeatureSuiteSyncAvailable,
            }),
        );
    };

    const disableSuiteSyncIfNeeded = () => {
        if (isSuiteSyncEnabled) {
            dispatch(suiteSyncActions.updateSuiteSyncEnabled({ isEnabled: false }));
            dispatch(disposeAllSuiteSyncStoragesThunk());
        }
    };

    const enableSuiteSyncIfNeeded = () => {
        if (!isSuiteSyncEnabled) {
            dispatch(suiteSyncActions.updateSuiteSyncEnabled({ isEnabled: true }));
            dispatch(initSuiteSyncHackForHook());
        }
    };

    const isEvoluSupportedByDevice = isSuiteSyncSupportedByDevice(device);
    const hasDeviceSuiteSyncOwner = device?.suiteSyncOwner !== undefined;

    return {
        isSuiteSyncEnabled,
        isSuiteSyncDebugEnabled,
        isFeatureSuiteSyncAvailable,
        toggleIsFeatureSuiteSyncAvailable,
        disableSuiteSyncIfNeeded,
        enableSuiteSyncIfNeeded,
        isEvoluSupportedByDevice,
        hasDeviceSuiteSyncOwner,
    };
};
