import { Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';

export const WipeDeviceScreen = () => (
    <Screen header={<ScreenHeader closeActionType="close" />}>
        <VStack>
            <Text variant="titleMedium">
                <Translation id="moduleDeviceSettings.wipeDevice.title" />
            </Text>
            <Text variant="body" color="textSubdued">
                <Translation id="moduleDeviceSettings.wipeDevice.subtitle" />
            </Text>
        </VStack>
    </Screen>
);
