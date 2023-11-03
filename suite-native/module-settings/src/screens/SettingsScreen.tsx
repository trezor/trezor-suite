import { VStack } from '@suite-native/atoms';
import { Screen, ScreenSubHeader, ScreenHeader } from '@suite-native/navigation';
import { DeviceManager } from '@suite-native/device-switcher';

import { ApplicationSettings } from '../components/ApplicationSettings';
import { SupportSettings } from '../components/SupportSettings';

export const SettingsScreen = () => (
    <Screen
        screenHeader={
            <ScreenHeader>
                <DeviceManager />
            </ScreenHeader>
        }
        subheader={<ScreenSubHeader />}
    >
        <VStack marginTop="extraLarge" spacing="extraLarge">
            <ApplicationSettings />
            <SupportSettings />
        </VStack>
    </Screen>
);
