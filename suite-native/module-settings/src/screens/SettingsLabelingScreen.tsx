import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

import { ToggleLabelingCard } from '../components/ToggleLabelingCard';

export const SettingsLabelingScreen = () => (
    <Screen
        header={
            <DynamicScreenHeader
                title={<Translation id="moduleSettings.items.features.labeling.title" />}
                subtitle={<Translation id="moduleSettings.items.features.labeling.subtitle" />}
            />
        }
    >
        <ToggleLabelingCard />
    </Screen>
);
