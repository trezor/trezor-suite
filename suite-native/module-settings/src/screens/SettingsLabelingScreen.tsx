import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

import { ToggleLabelingCard } from '../components/ToggleLabelingCard';

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
        <ToggleLabelingCard />
    </Screen>
);
