import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

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
        <ToggleSuiteSyncCard />
    </Screen>
);
