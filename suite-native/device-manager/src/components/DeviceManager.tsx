import { Box } from '@suite-native/atoms';
import { useIsUsbDeviceConnectFeatureEnabled } from '@suite-native/feature-flags';

import { DeviceSwitch } from './DeviceSwitch';
import { DeviceManagerContent } from './DeviceManagerContent';
import { PortfolioTrackerDeviceManagerContent } from './PortfolioTrackerDeviceManagerContent';

export const DeviceManager = () => {
    const { isUsbDeviceConnectFeatureEnabled } = useIsUsbDeviceConnectFeatureEnabled();

    return (
        <Box flexDirection="row" flex={1}>
            <DeviceSwitch />
            {isUsbDeviceConnectFeatureEnabled ? (
                <DeviceManagerContent />
            ) : (
                <PortfolioTrackerDeviceManagerContent />
            )}
        </Box>
    );
};
