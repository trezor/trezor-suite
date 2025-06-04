import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useSelector } from 'react-redux';

import { TextButton, TitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { bluetoothManager } from '@trezor/transport-native-bluetooth';

import { useBluetoothAlerts } from '../hooks/useBluetoothAlerts';
import { useBluetoothPermissions } from '../hooks/useBluetoothPermissions';
import {
    selectAllBluetoothDevices,
    selectBluetoothAdapterStatus,
    selectBluetoothPermissionStatus,
} from '../selectors';
import { BluetoothDeviceCard, BluetoothDeviceCardSkeleton } from './BluetoothDeviceCard';
import { NoTrezorNearbyCard } from './NoTrezorNearbyCard';

export const BluetoothDeviceManager = () => {
    const { requestBluetoothPermission } = useBluetoothPermissions();
    const { showOrHideBluetoothAlert } = useBluetoothAlerts();
    const openLink = useOpenLink();

    const bluetoothPermissionStatus = useSelector(selectBluetoothPermissionStatus);
    const bluetoothAdapterStatus = useSelector(selectBluetoothAdapterStatus);
    const allBluetoothDevices = useSelector(selectAllBluetoothDevices);

    const isAnyDeviceAvailable = allBluetoothDevices.length > 0;

    const [hasPermissionBeenRequested, setHasPermissionBeenRequested] = useState(false);
    const [isNoTrezorNearbyCardVisible, setIsNoTrezorNearbyCardVisible] = useState(false);

    const startDeviceScan = useCallback(() => {
        setIsNoTrezorNearbyCardVisible(false);
        bluetoothManager.startDeviceScan();
        setTimeout(() => setIsNoTrezorNearbyCardVisible(true), 7_000);
    }, [setIsNoTrezorNearbyCardVisible]);

    useEffect(() => {
        // Auto-request the permission only once when the screen is shown.
        if (bluetoothPermissionStatus === 'denied' && !hasPermissionBeenRequested) {
            requestBluetoothPermission();
            setHasPermissionBeenRequested(true);
        } else {
            showOrHideBluetoothAlert();
        }
    }, [
        bluetoothPermissionStatus,
        hasPermissionBeenRequested,
        requestBluetoothPermission,
        showOrHideBluetoothAlert,
    ]);

    useEffect(() => {
        // Ensure that the right alert is possibly shown again after returning to the app.
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                showOrHideBluetoothAlert();
            }
        });

        return () => {
            subscription.remove();
        };
    }, [showOrHideBluetoothAlert]);

    useEffect(() => {
        if (bluetoothAdapterStatus === 'enabled') {
            startDeviceScan();

            return () => {
                bluetoothManager.stopDeviceScan();
            };
        }
    }, [bluetoothAdapterStatus, startDeviceScan]);

    return (
        <VStack flex={1} justifyContent="space-between" spacing="sp32">
            <VStack marginTop="sp16" spacing="sp32">
                <TitleHeader
                    title={<Translation id="bluetooth.deviceManager.title" />}
                    subtitle={<Translation id="bluetooth.deviceManager.subtitle" />}
                    titleVariant="titleMedium"
                    titleSpacing="sp12"
                />
                {!isAnyDeviceAvailable && !isNoTrezorNearbyCardVisible && (
                    <BluetoothDeviceCardSkeleton />
                )}
                {!isAnyDeviceAvailable && isNoTrezorNearbyCardVisible && (
                    <NoTrezorNearbyCard onScanAgain={startDeviceScan} />
                )}
                {isAnyDeviceAvailable && (
                    <VStack spacing="sp16">
                        {allBluetoothDevices.map(device => (
                            <BluetoothDeviceCard key={device.id} device={device} />
                        ))}
                    </VStack>
                )}
                <TextButton
                    viewRight="arrowUpRight"
                    onPress={() => openLink('https://trezor.io/learn/a/bluetooth-troubleshooting')}
                >
                    <Translation id="bluetooth.deviceManager.troubleshootingTipsLink" />
                </TextButton>
            </VStack>
        </VStack>
    );
};
