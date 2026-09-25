import { Box } from '@suite-native/atoms';

import { DeviceManagerContent } from './DeviceManagerContent';
import { DeviceSwitch } from './DeviceSwitch';
import { useDeviceManager } from '../hooks/useDeviceManager';

export const DeviceManager = () => {
    const { isDeviceManagerVisible } = useDeviceManager();

    return (
        <Box flexDirection="row" flex={1}>
            <DeviceSwitch />
            {isDeviceManagerVisible && <DeviceManagerContent />}
        </Box>
    );
};
