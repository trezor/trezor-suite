import { Box, Text } from '@suite-native/atoms';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { Screen } from '@suite-native/navigation';

export const EarnScreen = () => (
    <Screen header={<DeviceManagerScreenHeader />}>
        <Box>
            <Text>Here</Text>
        </Box>
    </Screen>
);
