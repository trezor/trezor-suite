import { useSelector } from 'react-redux';

import {
    DeviceRootState,
    DiscoveryRootState,
    selectIsDeviceConnected,
    selectIsDiscoveryActiveByDeviceState,
    selectSelectedDevice,
} from '@suite-common/wallet-core';

export const useSettingsProtection = () => {
    const device = useSelector(selectSelectedDevice);

    const isDiscoveryRunning = useSelector((state: DiscoveryRootState & DeviceRootState) =>
        selectIsDiscoveryActiveByDeviceState(state, device?.state),
    );
    const isDeviceConnected = useSelector(selectIsDeviceConnected);

    return { isDiscoveryRunning, isDeviceConnected };
};
