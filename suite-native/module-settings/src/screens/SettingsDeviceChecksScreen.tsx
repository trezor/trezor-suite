import { useSelector } from 'react-redux';

import { selectIsMevProtectionSettingsVisible } from '@suite-common/mev';
import { Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

import { TurnOffDeviceAuthenticityCheckCard } from '../components/TurnOffDeviceAuthenticityCheckCard';
import { TurnOffFirmwareAuthenticityCheckCard } from '../components/TurnOffFirmwareAuthenticityCheckCard';
import { TurnOffMevProtectionCard } from '../components/TurnOffMevProtectionCard';

export const SettingsDeviceChecksScreen = () => {
    const isMevProtectionSettingsVisible = useSelector(selectIsMevProtectionSettingsVisible);

    return (
        <Screen
            header={
                <DynamicScreenHeader title={<Translation id="moduleSettings.advanced.title" />} />
            }
        >
            <VStack spacing="sp16">
                <VStack alignItems="center" spacing="sp12">
                    <Icon name="warning" color="textAlertYellow" size="extraLarge" />
                    <Text variant="hint" color="textAlertYellow" textAlign="center">
                        <Translation id="moduleSettings.advanced.goodAdvice" />
                    </Text>
                </VStack>
                <TurnOffFirmwareAuthenticityCheckCard />
                <TurnOffDeviceAuthenticityCheckCard />
                {isMevProtectionSettingsVisible && <TurnOffMevProtectionCard />}
            </VStack>
        </Screen>
    );
};
