import { PictogramTitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';

export const ReceiveBlockedDeviceCompromisedScreen = () => (
    <Screen header={<ScreenHeader closeActionType="back" />}>
        <VStack justifyContent="center" flex={1}>
            <PictogramTitleHeader
                variant="critical"
                title={<Translation id="moduleReceive.deviceCompromisedScreen.title" />}
                titleVariant="titleSmall"
            />
        </VStack>
    </Screen>
);
