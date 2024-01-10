import { VStack } from '@suite-native/atoms';
import { Screen, ScreenSubHeader } from '@suite-native/navigation';

import { ApplicationSettings } from '../components/ApplicationSettings';
import { SupportSettings } from '../components/SupportSettings';

export const SettingsScreen = () => (
    <Screen screenHeader={<ScreenSubHeader content="Settings" />}>
        <VStack marginTop="extraLarge" spacing="extraLarge">
            <ApplicationSettings />
            <SupportSettings />
        </VStack>
    </Screen>
);
