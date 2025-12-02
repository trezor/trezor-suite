import { useDispatch, useSelector } from 'react-redux';

import { useServices } from '@suite-common/redux-utils';
import { TrezorDevice } from '@suite-common/suite-types';

import { suiteSyncActions } from './suiteSyncActions';
import {
    selectIsFeatureSuiteSyncAvailable,
    selectIsSuiteSyncDebugEnabled,
    selectIsSuiteSyncEnabled,
} from './suiteSyncSelectors';
import { isSuiteSyncSupportedByDevice } from './suiteSyncUtils';

export type UseLocalStorageParams = {
    // This needs to be passed, as labeling can be attached to remembered wallets
    // and different devices can have different states (FW versions)
    device: TrezorDevice | undefined;
};

export const useSuiteSync = ({ device }: UseLocalStorageParams) => {
    const dispatch = useDispatch();
    const { suiteSync } = useServices();
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
            suiteSync.turnOffSuiteSync();
        }
    };

    const enableSuiteSyncIfNeeded = () => {
        if (!isSuiteSyncEnabled) {
            dispatch(suiteSyncActions.updateSuiteSyncEnabled({ isEnabled: true }));
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
