import { Text, VStack } from '@suite-native/atoms';
import { Screen, ScreenHeader } from '@suite-native/navigation';

export const WipeDeviceScreen = () => (
    <Screen header={<ScreenHeader closeActionType="close" />}>
        <VStack>
            <Text variant="titleMedium">Wipe device</Text>
            <Text variant="body" color="textSubdued">
                This will reset all of your device’s data. Proceed with caution.
            </Text>
        </VStack>
    </Screen>
);
