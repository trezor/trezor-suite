import { VStack } from '@suite-native/atoms';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { Screen } from '@suite-native/navigation';

import { ConnectionSettings } from '../components/ConnectionSettings';
import { FeaturesSettings } from '../components/FeaturesSettings';
import { PreferencesSettings } from '../components/PreferencesSettings';
import { SupportSettings } from '../components/SupportSettings';

export const SettingsScreen = () => (
    <Screen header={<DeviceManagerScreenHeader />}>
        <VStack marginTop="sp16" spacing="sp32">
            <PreferencesSettings />
            <FeaturesSettings />
            <ConnectionSettings />
            <SupportSettings />
        </VStack>
    </Screen>
);
