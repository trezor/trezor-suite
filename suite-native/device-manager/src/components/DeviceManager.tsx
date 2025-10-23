import { Box } from '@suite-native/atoms';

import { DeviceManagerContent } from './DeviceManagerContent';
import { DeviceSwitch } from './DeviceSwitch';

export const DeviceManager = () => (
    <Box flexDirection="row" flex={1}>
        <DeviceSwitch />
        <DeviceManagerContent />
    </Box>
);
