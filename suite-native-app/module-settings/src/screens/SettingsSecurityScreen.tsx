import { useSelector } from 'react-redux';

import { selectIsMevProtectionSettingsVisible } from '@suite-common/mev';
import { VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

import { DustPhishingThresholdCard } from '../components/DustPhishingThresholdCard';
import { ToggleMevProtectionCard } from '../components/ToggleMevProtectionCard';

export const SettingsSecurityScreen = () => {
    const isMevProtectionSettingsVisible = useSelector(selectIsMevProtectionSettingsVisible);

    return (
        <Screen
            header={
                <DynamicScreenHeader title={<Translation id="moduleSettings.security.title" />} />
            }
        >
            <VStack spacing="sp16">
                {isMevProtectionSettingsVisible && <ToggleMevProtectionCard />}
                <DustPhishingThresholdCard />
            </VStack>
        </Screen>
    );
};
