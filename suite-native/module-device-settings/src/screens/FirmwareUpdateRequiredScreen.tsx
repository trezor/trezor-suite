import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useIsFocused, useNavigation } from '@react-navigation/native';

import { Button, Pictogram, Text, VStack } from '@suite-native/atoms';
import {
    IncompatibleFirmwareModalAppendix,
    selectShouldForceFirmwareUpdate,
} from '@suite-native/device';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import {
    FirmwareVersionCard,
    selectIsFirmwareInstallationRunning,
    selectIsFirmwareUpdateFeatureEnabled,
} from '@suite-native/firmware';
import { Translation } from '@suite-native/intl';
import {
    DeviceSettingsStackRoutes,
    HomeStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    Screen,
    type StackNavigationProps,
    useInterceptNativeNavigation,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const contentWrapperStyle = prepareNativeStyle(() => ({
    width: '90%',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
}));

type NavigationProps = StackNavigationProps<
    RootStackParamList,
    RootStackRoutes.FirmwareUpdateRequired
>;

export const FirmwareUpdateRequiredScreen = () => {
    const { applyStyle } = useNativeStyles();
    const navigation = useNavigation<NavigationProps>();
    const isFocused = useIsFocused();

    const shouldForceFirmwareUpdate = useSelector(selectShouldForceFirmwareUpdate);
    const isFirmwareInstallationRunning = useSelector(selectIsFirmwareInstallationRunning);
    const isFirmwareUpdateEnabled = useSelector(selectIsFirmwareUpdateFeatureEnabled);

    useInterceptNativeNavigation();

    useEffect(() => {
        // The screen is the only route in the stack, so go home once the device is updated
        // or the user switches to another device.
        if (isFocused && !shouldForceFirmwareUpdate && !isFirmwareInstallationRunning) {
            navigation.reset({
                index: 0,
                routes: [
                    { name: RootStackRoutes.AppTabs, params: { screen: HomeStackRoutes.Home } },
                ],
            });
        }
    }, [isFocused, shouldForceFirmwareUpdate, isFirmwareInstallationRunning, navigation]);

    const handleUpdateFirmware = () => {
        navigation.navigate(RootStackRoutes.DeviceSettingsStack, {
            screen: DeviceSettingsStackRoutes.DeviceFirmware,
            params: { closeActionType: 'back' },
        });
    };

    return (
        <Screen header={<DeviceManagerScreenHeader />}>
            <VStack spacing="sp24">
                <VStack spacing="sp16" style={applyStyle(contentWrapperStyle)}>
                    <Pictogram variant="critical" />
                    <Text variant="headline-sm" textAlign="center">
                        <Translation id="moduleDeviceSettings.firmware.updateRequiredScreen.title" />
                    </Text>
                    <Text color="contentSecondary" textAlign="center">
                        <Translation id="moduleDeviceSettings.firmware.updateRequiredScreen.description" />
                    </Text>
                </VStack>
                <FirmwareVersionCard isUpdateRequired>
                    {isFirmwareUpdateEnabled ? (
                        <Button
                            onPress={handleUpdateFirmware}
                            intent="critical"
                            priority="primary"
                            testID="@firmware-update-required/update-button"
                        >
                            <Translation id="moduleDeviceSettings.firmware.updateFirmwareButton" />
                        </Button>
                    ) : (
                        <IncompatibleFirmwareModalAppendix />
                    )}
                </FirmwareVersionCard>
            </VStack>
        </Screen>
    );
};
