import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { Box, Button, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    DeviceSettingsStackParamList,
    DeviceStackRoutes,
    Screen,
    ScreenSubHeader,
    StackNavigationProps,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import {
    DeviceRootState,
    selectIsDiscoveryActiveByDeviceState,
    DiscoveryRootState,
    selectDeviceState,
} from '@suite-common/wallet-core';

import { FirmwareUpdateVersionCard } from './FirmwareVersionCard';

const firmwareUpdateButtonStyle = prepareNativeStyle(utils => ({
    marginHorizontal: utils.spacings.sp16,
}));

type NavigationProp = StackNavigationProps<
    DeviceSettingsStackParamList,
    DeviceStackRoutes.FirmwareUpdate
>;

export const FirmwareUpdateScreen = () => {
    const { applyStyle } = useNativeStyles();

    const deviceState = useSelector(selectDeviceState);
    const isDiscoveryRunning = useSelector((state: DiscoveryRootState & DeviceRootState) =>
        selectIsDiscoveryActiveByDeviceState(state, deviceState),
    );

    const navigation = useNavigation<NavigationProp>();
    const handleUpdateFirmware = () => {
        navigation.navigate(DeviceStackRoutes.FirmwareUpdateInProgress);
    };

    return (
        <Screen
            subheader={<ScreenSubHeader closeActionType="close" />}
            footer={
                <Button
                    onPress={handleUpdateFirmware}
                    style={applyStyle(firmwareUpdateButtonStyle)}
                    isDisabled={isDiscoveryRunning}
                    isLoading={isDiscoveryRunning}
                >
                    <Translation id="moduleDeviceSettings.firmware.firmwareUpdateScreen.updateButton" />
                </Button>
            }
        >
            <Box paddingTop="sp16">
                <Text variant="titleMedium">
                    <Translation id="moduleDeviceSettings.firmware.firmwareUpdateScreen.title" />
                </Text>
            </Box>
            <Box paddingTop="sp8">
                <Text variant="body" color="textSubdued">
                    <Translation id="moduleDeviceSettings.firmware.firmwareUpdateScreen.subtitle" />
                </Text>
            </Box>
            <FirmwareUpdateVersionCard marginTop="sp32" />
        </Screen>
    );
};
