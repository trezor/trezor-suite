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

type EjectedDuringDiscoveryWarningProps = {
    hasPadding?: boolean;
};

export const EjectedDuringDiscoveryWarning = ({
    hasPadding = false,
}: EjectedDuringDiscoveryWarningProps) => {
    const device = useSelector(selectSelectedDevice);
    const hasBeenEjectedDuringDiscovery = useSelector((state: SettingsSliceRootState) =>
        selectHasDeviceBeenEjectedDuringDiscovery(state, device?.id),
    );

    if (!hasBeenEjectedDuringDiscovery || device?.connected) return null;

    return (
        <Animated.View>
            <Box padding={hasPadding ? 'sp8' : undefined}>
                <InlineAlertBox
                    title={<Translation id="assets.dashboard.ejectedDuringDiscovery" />}
                    variant="warning"
                    customIcon={<DeviceItemIcon deviceId={device?.id} iconSize="mediumLarge" />}
                />
            </Box>
        </Animated.View>
    );
};
