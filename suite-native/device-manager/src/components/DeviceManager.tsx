import { Box } from '@suite-native/atoms';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';

import { DeviceSwitch } from './DeviceSwitch';
import { DeviceManagerContent } from './DeviceManagerContent';
import { PortfolioTrackerDeviceManagerContent } from './PortfolioTrackerDeviceManagerContent';

export const DeviceManager = () => {
    const [isUsbDeviceConnectFeatureEnabled] = useFeatureFlag(FeatureFlag.IsDeviceConnectEnabled);

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
