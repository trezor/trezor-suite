import { useDispatch, useSelector } from 'react-redux';

import {
    selectIsDeviceConnectFeatureFlagEnabled,
    toggleIsDeviceConnectEnabled,
} from './featureFlagsSlice';

export const useIsUsbDeviceConnectFeatureEnabled = () => {
    const dispatch = useDispatch();

    const isUsbDeviceConnectFeatureEnabled = useSelector(selectIsDeviceConnectFeatureFlagEnabled);

    const toggleIsDeviceConnectFeatureFlagEnabled = () => {
        dispatch(toggleIsDeviceConnectEnabled());
    };

    return {
        isUsbDeviceConnectFeatureEnabled,
        toggleIsDeviceConnectFeatureFlagEnabled,
    };
};
