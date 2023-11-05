import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { Box, Button, Text, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import {
    selectDevices,
    selectDevicesCount,
    selectIsSelectedDeviceImported,
} from '@suite-common/wallet-core';
import {
    ConnectDeviceStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { Translation, useTranslate } from '@suite-native/intl';

import { DeviceManagerModal } from './DeviceManagerModal';
import { DeviceItem } from './DeviceItem';
import { DeviceControlButtons } from './DeviceControlButtons';
import { useDeviceManager } from '../hooks/useDeviceManager';

const modalWrapperStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundTertiaryDefaultOnElevation1,
    borderBottomLeftRadius: utils.borders.radii.large,
    borderBottomRightRadius: utils.borders.radii.large,
}));

const contentWrapperStyle = prepareNativeStyle(utils => ({
    padding: utils.spacings.medium,
}));

type NavigationProp = StackToStackCompositeNavigationProps<
    RootStackParamList,
    RootStackRoutes.AppTabs,
    RootStackParamList
>;

export const DeviceManagerContent = () => {
    const navigation = useNavigation<NavigationProp>();

    const { translate } = useTranslate();

    const devices = useSelector(selectDevices);
    const isPortfolioTrackerDevice = useSelector(selectIsSelectedDeviceImported);
    const devicesCount = useSelector(selectDevicesCount);

    const { setIsDeviceManagerVisible } = useDeviceManager();

    const { applyStyle } = useNativeStyles();

    const handleConnectDevice = () => {
        setIsDeviceManagerVisible(false);
        navigation.navigate(RootStackRoutes.ConnectDevice, {
            screen: ConnectDeviceStackRoutes.ConnectAndUnlockDevice,
        });
    };

    const shouldDisplayConnectButton = devicesCount === 1 && isPortfolioTrackerDevice;

    return (
        <DeviceManagerModal>
            <Box style={applyStyle(modalWrapperStyle)}>
                <VStack spacing="medium" style={applyStyle(contentWrapperStyle)}>
                    {!isPortfolioTrackerDevice && <DeviceControlButtons />}
                    <VStack>
                        <Text variant="callout">
                            <Translation id="deviceManager.deviceList.sectionTitle" />
                        </Text>
                        {devices.map(device => (
                            <DeviceItem id={device.id} key={device.id} />
                        ))}
                    </VStack>
                    {shouldDisplayConnectButton && (
                        <VStack>
                            <Text variant="callout">
                                <Translation id="deviceManager.connectDevice.sectionTitle" />
                            </Text>
                            <Button colorScheme="tertiaryElevation0" onPress={handleConnectDevice}>
                                {translate('deviceManager.connectDevice.connectButton')}
                            </Button>
                        </VStack>
                    )}
                </VStack>
            </Box>
        </DeviceManagerModal>
    );
};
