import { Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

import { TurnOffDeviceAuthenticityCheckCard } from '../components/TurnOffDeviceAuthenticityCheckCard';
import { TurnOffFirmwareAuthenticityCheckCard } from '../components/TurnOffFirmwareAuthenticityCheckCard';

export const SettingsDeviceChecksScreen = () => (
    <Screen
        header={
            <DynamicScreenHeader content={<Translation id="moduleSettings.advanced.title" />} />
        }
    >
        <VStack spacing="sp16">
            <TurnOffFirmwareAuthenticityCheckCard />
            <TurnOffDeviceAuthenticityCheckCard />
            <VStack alignItems="center" spacing="sp12">
                <Icon name="warning" color="textAlertYellow" size="extraLarge" />
                <Text variant="hint" color="textAlertYellow" textAlign="center">
                    <Translation id="moduleSettings.advanced.goodAdvice" />
                </Text>
            </VStack>
        </VStack>
    </Screen>
);
