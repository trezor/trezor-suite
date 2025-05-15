import { useNavigation } from '@react-navigation/native';

import { CardStepper, CardStepperMap, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';

const contentMap = {
    1: {
        header: 'Erase all data',
        description: "This will erase all device data. This action can't be undone",
        icon: 'trash',
    },
    2: {
        header: 'Wallet backup',
        description:
            'Make sure you have your wallet backup. You won’t be able to recover access to your assets without it.',
        icon: 'newspaper',
    },
} as const satisfies CardStepperMap;

export const WipeDeviceScreen = () => {
    const navigation = useNavigation();

    const handleSecondaryButtonPress = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
    };

    const handleWipeDevice = () => {
        console.warn('wipe device');
    };

    return (
        <Screen header={<ScreenHeader closeActionType="close" />}>
            <VStack>
                <Text variant="titleMedium">
                    <Translation id="moduleDeviceSettings.wipeDevice.title" />
                </Text>
                <Text variant="body" color="textSubdued">
                    <Translation id="moduleDeviceSettings.wipeDevice.subTitle" />
                </Text>
                <CardStepper
                    onFinish={handleWipeDevice}
                    buttonsActionType="destructive"
                    onPressSecondaryButton={handleSecondaryButtonPress}
                    stepToContentMap={contentMap}
                />
            </VStack>
        </Screen>
    );
};
