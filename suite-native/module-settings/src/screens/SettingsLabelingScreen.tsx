import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

import { ToggleLabelingCard } from '../components/ToggleLabelingCard';

export const SettingsLabelingScreen = () => (
    <Screen
        header={
            <DynamicScreenHeader
                title={<Translation id="moduleSettings.items.features.labeling.title" />}
                subtitle="Name your wallets, personalize accounts, and label transactions. "
            />
        }
    >
        <ToggleLabelingCard />
    </Screen>
);
