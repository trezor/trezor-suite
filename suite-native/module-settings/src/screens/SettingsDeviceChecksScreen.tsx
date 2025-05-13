import { Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation, useTranslate } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';

import { TurnOffFirmwareAuthenticityCheckCard } from '../components/TurnOffFirmwareAuthenticityCheckCard';

export const SettingsDeviceChecksScreen = () => {
    const { translate } = useTranslate();

    return (
        <Screen header={<ScreenHeader content={translate('moduleSettings.advanced.title')} />}>
            <VStack spacing="sp16">
                <TurnOffFirmwareAuthenticityCheckCard />
                <VStack alignItems="center" spacing="sp12">
                    <Icon name="warning" color="textAlertYellow" size="extraLarge" />
                    <Text variant="hint" color="textAlertYellow" textAlign="center">
                        <Translation id="moduleSettings.advanced.goodAdvice" />
                    </Text>
                </VStack>
            </VStack>
        </Screen>
    );
};
