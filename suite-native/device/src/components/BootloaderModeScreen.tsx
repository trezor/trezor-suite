import { Button, Card, Pictogram, Text, TextDivider, VStack } from '@suite-native/atoms';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { Translation } from '@suite-native/intl';
import { Screen } from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

// showAlert({
//     title: <Translation id="moduleDevice.bootloaderModal.title" />,
//     description: <Translation id="moduleDevice.bootloaderModal.description" />,
//     pictogramVariant: 'critical',
//     primaryButtonVariant: 'tertiaryElevation1',
//     primaryButtonTitle: <Translation id="generic.buttons.eject" />,
//     appendix: <BootloaderModalAppendix />,
//     onPressPrimaryButton: () => {
//         handleDisconnect();
//         analytics.report({
//             type: EventType.UnsupportedDevice,
//             payload: { deviceState: 'bootloaderMode' },
//         });
//     },
//     testID: '@device/errors/alert/bootloader',
// });

const buttonWrapperStyle = prepareNativeStyle(() => ({
    width: '100%',
}));

const contentWrapperStyle = prepareNativeStyle(() => ({
    width: '90%',
    alignSelf: 'center',
}));

export const BootloaderModeScreen = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <Screen header={<DeviceManagerScreenHeader />}>
            <VStack spacing="sp24">
                <Card>
                    <VStack
                        spacing="sp32"
                        alignItems="center"
                        justifyContent="center"
                        style={applyStyle(contentWrapperStyle)}
                    >
                        <Pictogram variant="critical" />
                        <Text variant="highlight" textAlign="center">
                            <Translation id="moduleDevice.bootloaderScreen.factoryResetCard.title" />
                        </Text>
                        <Text color="textSubdued" textAlign="center">
                            <Translation id="moduleDevice.bootloaderScreen.factoryResetCard.description" />
                        </Text>
                        <VStack style={applyStyle(buttonWrapperStyle)}>
                            <Button colorScheme="redBold">
                                <Translation id="moduleDevice.bootloaderScreen.factoryResetCard.buttonTitle" />
                            </Button>
                        </VStack>
                    </VStack>
                </Card>
                <TextDivider />
                <VStack
                    justifyContent="center"
                    alignItems="center"
                    style={applyStyle(contentWrapperStyle)}
                >
                    <Text variant="highlight" textAlign="center">
                        <Translation id="moduleDevice.bootloaderScreen.reconnectCard.title" />
                    </Text>
                    <Text color="textSubdued" textAlign="center">
                        <Translation id="moduleDevice.bootloaderScreen.reconnectCard.description" />
                    </Text>
                    <VStack style={applyStyle(buttonWrapperStyle)}>
                        <Button colorScheme="blueBold">
                            <Translation id="moduleDevice.bootloaderScreen.reconnectCard.buttonTitle" />
                        </Button>
                    </VStack>
                </VStack>
            </VStack>
        </Screen>
    );
};
