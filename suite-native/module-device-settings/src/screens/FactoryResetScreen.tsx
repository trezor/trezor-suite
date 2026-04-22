import { useNavigation } from '@react-navigation/native';

import { CardStepper, Text, VStack } from '@suite-native/atoms';
import { useWipeDevice } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';

import { wipeDeviceStepToContentMap } from '../constants';

export const FactoryResetScreen = () => {
    const navigation = useNavigation();
    const { navigateToWipeDeviceStack } = useWipeDevice();

    const handleSecondaryButtonPress = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
    };

    return (
        <Screen header={<ScreenHeader closeActionType="close" />}>
            <VStack>
                <Text variant="headline-md">
                    <Translation id="moduleDeviceSettings.wipeDevice.factoryResetScreen.title" />
                </Text>
                <Text variant="body-md" color="contentSecondary">
                    <Translation id="moduleDeviceSettings.wipeDevice.factoryResetScreen.description" />
                </Text>
                <CardStepper
                    onFinish={navigateToWipeDeviceStack}
                    secondaryButtonText={<Translation id="generic.buttons.goBack" />}
                    primaryButtonText={<Translation id="generic.buttons.understand" />}
                    buttonsActionType="destructive"
                    onPressSecondaryButton={handleSecondaryButtonPress}
                    stepToContentMap={wipeDeviceStepToContentMap}
                />
            </VStack>
        </Screen>
    );
};
