import { useNavigation } from '@react-navigation/native';

import { CardStepper, CardStepperMap, Text, VStack } from '@suite-native/atoms';
import { ContinueOnTrezorScreenContent, useWipeDevice } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';

const cardStepperContentMap = {
    1: {
        header: (
            <Translation id="moduleDeviceSettings.wipeDevice.confirmationCards.eraseAllData.title" />
        ),
        description: (
            <Translation id="moduleDeviceSettings.wipeDevice.confirmationCards.eraseAllData.description" />
        ),
        icon: 'trash',
    },
    2: {
        header: (
            <Translation id="moduleDeviceSettings.wipeDevice.confirmationCards.walletBackup.title" />
        ),
        description: (
            <Translation id="moduleDeviceSettings.wipeDevice.confirmationCards.walletBackup.description" />
        ),
        icon: 'newspaper',
    },
} as const satisfies CardStepperMap;

export const WipeDeviceScreen = () => {
    const navigation = useNavigation();
    const { wipeDevice, isWipeInProgress } = useWipeDevice();

    const handleSecondaryButtonPress = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
    };

    if (isWipeInProgress) {
        return (
            <Screen header={<ScreenHeader leftIcon={null} />}>
                <ContinueOnTrezorScreenContent />
            </Screen>
        );
    }

    return (
        <Screen header={<ScreenHeader closeActionType="close" />}>
            <VStack>
                <Text variant="titleMedium">
                    <Translation id="moduleDeviceSettings.wipeDevice.title" />
                </Text>
                <Text variant="body" color="textSubdued">
                    <Translation id="moduleDeviceSettings.wipeDevice.subtitle" />
                </Text>
                <CardStepper
                    onFinish={wipeDevice}
                    primaryButtonText={<Translation id="generic.buttons.goBack" />}
                    secondaryButtonText={<Translation id="generic.buttons.understand" />}
                    buttonsActionType="destructive"
                    onPressSecondaryButton={handleSecondaryButtonPress}
                    stepToContentMap={cardStepperContentMap}
                />
            </VStack>
        </Screen>
    );
};
