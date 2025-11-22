import { useDispatch, useSelector } from 'react-redux';

import { TrezorDevice } from '@suite-common/suite-types';

import { isSuiteSyncSupportedByDevice } from './device';
import { disposeAllLocalFirstStorageThunk } from './disposeAllLocalFirstStorageThunk';
import { initLocalFirstStorageThunk } from './initLocalFirstStorageThunk';
import { suiteSyncActions } from './suiteSyncActions';
import {
    selectIsFeatureLocalFirstStorageAvailable,
    selectIsLocalFirstStorageDebugEnabled,
    selectIsLocalFirstStorageEnabled,
} from './suiteSyncSelectors';

export type UseLocalStorageParams = {
    // This needs to be passed, as labeling can be attached to remembered wallets
    // and different devices can have different states (FW versions)
    device: TrezorDevice | undefined;
};

export const useLocalFirstStorage = ({ device }: UseLocalStorageParams) => {
    const dispatch = useDispatch();

    const isLocalFirstStorageEnabled = useSelector(selectIsLocalFirstStorageEnabled);
    const isLocalFirstStorageDebugEnabled = useSelector(selectIsLocalFirstStorageDebugEnabled);
    const isFeatureLocalFirstStorageAvailable = useSelector(
        selectIsFeatureLocalFirstStorageAvailable,
    );

    const toggleIsFeatureLocalFirstStorageAvailable = () => {
        dispatch(
            suiteSyncActions.updateIsFeatureLocalFirstStorageAvailable({
                isShownInSettings: !isFeatureLocalFirstStorageAvailable,
            }),
        );
    };

    const disableLocalFirstStorageIfNeeded = () => {
        if (isLocalFirstStorageEnabled) {
            dispatch(suiteSyncActions.updateLocalFirstStorageEnabled({ isEnabled: false }));
            dispatch(disposeAllLocalFirstStorageThunk());
        }
    };

    const enableLocalFirstStorageIfNeeded = () => {
        if (!isLocalFirstStorageEnabled) {
            dispatch(suiteSyncActions.updateLocalFirstStorageEnabled({ isEnabled: true }));
            dispatch(initLocalFirstStorageThunk());
        }
    };

    const isEvoluSupportedByDevice = isSuiteSyncSupportedByDevice(device);
    const hasDeviceLocalFirstStorageKeys = device?.localFirstStorageSecret?.evoluKeys !== undefined;

    return {
        isLocalFirstStorageEnabled,
        isLocalFirstStorageDebugEnabled,
        isFeatureLocalFirstStorageAvailable,
        toggleIsFeatureLocalFirstStorageAvailable,
        disableLocalFirstStorageIfNeeded,
        enableLocalFirstStorageIfNeeded,
        isEvoluSupportedByDevice,
        hasDeviceLocalFirstStorageKeys,
    };
};
