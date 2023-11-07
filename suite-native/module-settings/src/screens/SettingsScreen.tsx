import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { VStack } from '@suite-native/atoms';
import { Screen, ScreenSubHeader } from '@suite-native/navigation';

import { ApplicationSettings } from '../components/ApplicationSettings';
import { SupportSettings } from '../components/SupportSettings';

export const SettingsScreen = () => (
    <Screen screenHeader={<DeviceManagerScreenHeader />} subheader={<ScreenSubHeader />}>
        <VStack marginTop="extraLarge" spacing="extraLarge">
            <ApplicationSettings />
            <SupportSettings />
        </VStack>
    </Screen>
);
