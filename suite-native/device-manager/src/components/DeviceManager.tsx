import { Box } from '@suite-native/atoms';

import { DeviceSwitch } from './DeviceSwitch';
import { DeviceManagerContent } from './DeviceManagerContent';

export const DeviceManager = () => (
    <Box flexDirection="row" flex={1}>
        <DeviceSwitch />
        <DeviceManagerContent />
    </Box>
);
