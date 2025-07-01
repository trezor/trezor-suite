import { VStack } from '@suite-native/atoms';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { Screen } from '@suite-native/navigation';

import { AppTitleAndVersion } from '../components/AppTitleAndVersion';
import { ConnectionSettings } from '../components/ConnectionSettings';
import { FeaturesSettings } from '../components/FeaturesSettings';
import { GeneralSettings } from '../components/GeneralSettings';

export const SettingsScreen = () => (
    <Screen header={<DeviceManagerScreenHeader />}>
        <VStack marginTop="sp16" spacing="sp40">
            <GeneralSettings />
            <FeaturesSettings />
            <ConnectionSettings />
            <AppTitleAndVersion />
        </VStack>
    </Screen>
);
