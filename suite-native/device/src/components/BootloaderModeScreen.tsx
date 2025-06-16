import { useEffect } from 'react';

import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Button, Card, Pictogram, Text, TextDivider, VStack } from '@suite-native/atoms';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { Translation } from '@suite-native/intl';
import {
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    Screen,
    WipeDeviceStackParamList,
    WipeDeviceStackRoutes,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const buttonWrapperStyle = prepareNativeStyle(() => ({
    width: '100%',
}));

const contentWrapperStyle = prepareNativeStyle(() => ({
    width: '90%',
    alignSelf: 'center',
}));

type NavigationProps = CompositeNavigationProp<
    NativeStackNavigationProp<WipeDeviceStackParamList, WipeDeviceStackRoutes.WipeDevice>,
    CompositeNavigationProp<
        NativeStackNavigationProp<DeviceSettingsStackParamList>,
        NativeStackNavigationProp<RootStackParamList>
    >
>;

export const BootloaderModeScreen = () => {
    const { applyStyle } = useNativeStyles();
    const navigation = useNavigation<NavigationProps>();

    const handleRedirectToFactoryReset = () => {
        navigation.navigate(RootStackRoutes.DeviceSettingsStack, {
            screen: DeviceSettingsStackRoutes.WipeDeviceStack,
            params: {
                screen: WipeDeviceStackRoutes.FactoryReset,
            },
        });
    };

    useEffect(() => {
        // Navigating back from the bootloader screen would get the user back to homescreen in incorrect state, so we'll avoid it by this.
        const unsubscribe = navigation.addListener('beforeRemove', e => {
            if (e.data.action.type === 'GO_BACK') {
                e.preventDefault();
            }
        });

        return unsubscribe;
    }, [navigation]);

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
                            <Button colorScheme="redBold" onPress={handleRedirectToFactoryReset}>
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
                </VStack>
            </VStack>
        </Screen>
    );
};
