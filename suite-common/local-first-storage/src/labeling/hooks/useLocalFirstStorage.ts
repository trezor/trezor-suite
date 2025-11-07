import { useDispatch, useSelector } from 'react-redux';

import { EvoluDeps } from '@evolu/common';

import { TrezorDevice } from '@suite-common/suite-types';

import { disposeAllLocalFirstStorageThunk } from '../../storage/disposeAllLocalFirstStorageThunk';
import { initLocalFirstStorageThunkFactory } from '../../storage/initLocalFirstStorageThunk';
import { labelingActions } from '../labelingActions';
import {
    selectIsFeatureLocalFirstStorageAvailable,
    selectIsLocalFirstStorageDebugEnabled,
    selectIsLocalFirstStorageEnabled,
} from '../labelingSelectors';

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
            labelingActions.updateIsFeatureLocalFirstStorageAvailable({
                isShownInSettings: !isFeatureLocalFirstStorageAvailable,
            }),
        );
    };

    const disableLocalFirstStorageIfNeeded = () => {
        if (isLocalFirstStorageEnabled) {
            dispatch(labelingActions.updateLocalFirstStorageEnabled({ isEnabled: false }));
            dispatch(disposeAllLocalFirstStorageThunk());
        }
    };

    const enableLocalFirstStorageIfNeeded = (deps: EvoluDeps) => {
        if (!isLocalFirstStorageEnabled) {
            dispatch(labelingActions.updateLocalFirstStorageEnabled({ isEnabled: true }));
            dispatch(initLocalFirstStorageThunkFactory(deps)());
        }
    };

    const isEvoluSupportedByDevice = device?.unavailableCapabilities?.evolu === undefined;
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
