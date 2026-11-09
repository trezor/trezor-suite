import { VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

import { SuiteSyncRelayUrlCard } from '../components/SuiteSyncRelayUrlCard';
import { ToggleSuiteSyncCard } from '../components/ToggleSuiteSyncCard';

export const SettingsSuiteSyncScreen = () => (
    <Screen
        header={
            <DynamicScreenHeader
                title={<Translation id="moduleSettings.items.features.suiteSync.title" />}
                subtitle={
                    <Translation id="moduleSettings.items.features.suiteSync.screenSubtitle" />
                }
            />
        }
    >
        <VStack spacing="sp16">
            <ToggleSuiteSyncCard />
            <SuiteSyncRelayUrlCard />
        </VStack>
    </Screen>
);
