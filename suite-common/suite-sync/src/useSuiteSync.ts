import { useDispatch, useSelector } from 'react-redux';

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

/**
 * @deprecated use selectors/services
 */
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

    const isEvoluSupportedByDevice = isSuiteSyncSupportedByDevice(device);
    const hasDeviceSuiteSyncOwner = device?.suiteSyncOwner !== undefined;

    return {
        isSuiteSyncEnabled,
        isSuiteSyncDebugEnabled,
        isFeatureSuiteSyncAvailable,
        toggleIsFeatureSuiteSyncAvailable,
        isEvoluSupportedByDevice,
        hasDeviceSuiteSyncOwner,
    };
};
