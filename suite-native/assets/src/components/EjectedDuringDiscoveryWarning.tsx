import Animated from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { selectSelectedDevice } from '@suite-common/wallet-core';
import { Box, InlineAlertBox } from '@suite-native/atoms';
import { DeviceItemIcon } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import {
    SettingsSliceRootState,
    selectHasDeviceBeenEjectedDuringDiscovery,
} from '@suite-native/settings';

export const EjectedDuringDiscoveryWarning = () => {
    const device = useSelector(selectSelectedDevice);
    const hasBeenEjectedDuringDiscovery = useSelector((state: SettingsSliceRootState) =>
        selectHasDeviceBeenEjectedDuringDiscovery(state, device?.id),
    );

    if (!hasBeenEjectedDuringDiscovery || device?.connected) return null;

    return (
        <Animated.View>
            <Box padding="sp8">
                <InlineAlertBox
                    title={<Translation id="assets.dashboard.ejectedDuringDiscovery" />}
                    variant="warning"
                    iconName="trezorDevices"
                />
            </Box>
        </Animated.View>
    );
};
