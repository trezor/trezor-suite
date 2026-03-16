import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { Button, Card, Pictogram, Text, TextDivider, VStack } from '@suite-native/atoms';
import { selectShouldFactoryResetBeVisible } from '@suite-native/device';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { Translation } from '@suite-native/intl';
import {
    type DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    Screen,
    type StackToStackCompositeNavigationProps,
    WipeDeviceStackRoutes,
    useInterceptNativeNavigation,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const buttonWrapperStyle = prepareNativeStyle(() => ({
    width: '100%',
}));

const contentWrapperStyle = prepareNativeStyle(() => ({
    width: '90%',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
}));

type NavigationProps = StackToStackCompositeNavigationProps<
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes.WipeDeviceStack,
    RootStackParamList
>;

export const BootloaderModeScreen = () => {
    const { applyStyle } = useNativeStyles();
    const navigation = useNavigation<NavigationProps>();
    const shouldFactoryResetBeVisible = useSelector(selectShouldFactoryResetBeVisible);
    const navigateToInitialScreen = useNavigateToInitialScreen();

    useInterceptNativeNavigation();

    const handleRedirectToFactoryReset = () => {
        navigation.navigate(RootStackRoutes.DeviceSettingsStack, {
            screen: DeviceSettingsStackRoutes.WipeDeviceStack,
            params: {
                screen: WipeDeviceStackRoutes.FactoryReset,
            },
        });
    };

    useEffect(() => {
        // If user changes device through device switcher, navigate to the screen where user was before entering bootloader mode.
        if (!shouldFactoryResetBeVisible) {
            navigateToInitialScreen();
        }
    }, [shouldFactoryResetBeVisible, navigateToInitialScreen]);

    return (
        <Screen header={<DeviceManagerScreenHeader />}>
            <VStack spacing="sp24">
                <Card>
                    <VStack spacing="sp32" style={applyStyle(contentWrapperStyle)}>
                        <Pictogram variant="critical" />
                        <Text variant="body-md-strong" textAlign="center">
                            <Translation id="moduleDeviceBootloaderMode.bootloaderScreen.factoryResetCard.title" />
                        </Text>
                        <Text color="textSubdued" textAlign="center">
                            <Translation id="moduleDeviceBootloaderMode.bootloaderScreen.factoryResetCard.description" />
                        </Text>
                        <VStack style={applyStyle(buttonWrapperStyle)}>
                            <Button
                                intent="critical"
                                priority="primary"
                                onPress={handleRedirectToFactoryReset}
                            >
                                <Translation id="moduleDeviceBootloaderMode.bootloaderScreen.factoryResetCard.buttonTitle" />
                            </Button>
                        </VStack>
                    </VStack>
                </Card>
                <TextDivider />
                <VStack style={applyStyle(contentWrapperStyle)}>
                    <Text variant="body-md-strong" textAlign="center">
                        <Translation id="moduleDeviceBootloaderMode.bootloaderScreen.reconnectCard.title" />
                    </Text>
                    <Text color="textSubdued" textAlign="center">
                        <Translation id="moduleDeviceBootloaderMode.bootloaderScreen.reconnectCard.description" />
                    </Text>
                </VStack>
            </VStack>
        </Screen>
    );
};
