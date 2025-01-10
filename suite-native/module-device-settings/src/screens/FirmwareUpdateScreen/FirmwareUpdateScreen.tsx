import { useSelector } from 'react-redux';
import { useCallback } from 'react';

import { useNavigation } from '@react-navigation/native';

import { Box, Button, Text } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
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
import { useAlert } from '@suite-native/alerts';

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
    const { showAlert } = useAlert();
    const { translate } = useTranslate();
    const navigation = useNavigation<NavigationProp>();

    const deviceState = useSelector(selectDeviceState);
    const isDiscoveryRunning = useSelector((state: DiscoveryRootState & DeviceRootState) =>
        selectIsDiscoveryActiveByDeviceState(state, deviceState),
    );

    const handleShowSeedBottomSheet = useCallback(() => {
        showAlert({
            title: translate('moduleDeviceSettings.firmware.seedBottomSheet.title'),
            description: translate('moduleDeviceSettings.firmware.seedBottomSheet.description'),
            primaryButtonTitle: translate(
                'moduleDeviceSettings.firmware.seedBottomSheet.continueButton',
            ),
            onPressPrimaryButton: () => {
                navigation.navigate(DeviceStackRoutes.FirmwareUpdateInProgress);
            },
            secondaryButtonTitle: translate(
                'moduleDeviceSettings.firmware.seedBottomSheet.closeButton',
            ),
        });
    }, [navigation, showAlert, translate]);

    return (
        <Screen
            screenHeader={<ScreenSubHeader closeActionType="close" />}
            footer={
                <Button
                    onPress={handleShowSeedBottomSheet}
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
