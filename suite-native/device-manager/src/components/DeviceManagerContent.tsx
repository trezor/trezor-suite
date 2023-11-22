import { useSelector } from 'react-redux';
import { useMemo } from 'react';

import { A } from '@mobily/ts-belt';
import { useNavigation } from '@react-navigation/native';

import { Button, Text, VStack } from '@suite-native/atoms';
import {
    selectDevices,
    selectIsSelectedDeviceImported,
    selectDeviceId,
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

type NavigationProp = StackToStackCompositeNavigationProps<
    RootStackParamList,
    RootStackRoutes.AppTabs,
    RootStackParamList
>;

export const DeviceManagerContent = () => {
    const navigation = useNavigation<NavigationProp>();

    const { translate } = useTranslate();

    const devices = useSelector(selectDevices);
    const selectedDeviceId = useSelector(selectDeviceId);
    const isPortfolioTrackerDevice = useSelector(selectIsSelectedDeviceImported);

    const { setIsDeviceManagerVisible } = useDeviceManager();

    const handleConnectDevice = () => {
        setIsDeviceManagerVisible(false);
        navigation.navigate(RootStackRoutes.ConnectDevice, {
            screen: ConnectDeviceStackRoutes.ConnectAndUnlockDevice,
        });
    };

    const listedDevice = useMemo(
        () => devices.filter(device => device.id !== selectedDeviceId),
        [devices, selectedDeviceId],
    );

    return (
        <DeviceManagerModal>
            {!isPortfolioTrackerDevice && <DeviceControlButtons />}
            {A.isNotEmpty(listedDevice) && (
                <VStack>
                    <Text variant="callout">
                        <Translation id="deviceManager.deviceList.sectionTitle" />
                    </Text>
                    {listedDevice.map(device => (
                        <DeviceItem key={device.path} id={device.id} />
                    ))}
                </VStack>
            )}
            {isPortfolioTrackerDevice && (
                <VStack>
                    <Text variant="callout">
                        <Translation id="deviceManager.connectDevice.sectionTitle" />
                    </Text>
                    <Button colorScheme="tertiaryElevation1" onPress={handleConnectDevice}>
                        {translate('deviceManager.connectDevice.connectButton')}
                    </Button>
                </VStack>
            )}
        </DeviceManagerModal>
    );
};
