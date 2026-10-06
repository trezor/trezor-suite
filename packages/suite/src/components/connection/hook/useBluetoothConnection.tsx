import { useMemo, useState } from 'react';

import { injectDesktopAnalytics } from '@suite/analytics';
import {
    type DesktopBluetoothDevice,
    bluetoothConnectDeviceThunk,
    bluetoothDisconnectDeviceThunk,
} from '@suite/bluetooth';
import { setConnectionModal } from '@suite/device';
import { events } from '@suite-common/analytics';
import { selectKnownDevices } from '@suite-common/bluetooth';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { type BluetoothDeviceId } from '@trezor/connect';

import { useSelector } from 'src/hooks/suite';

type UseBluetoothConnectionProps = {
    devices: DesktopBluetoothDevice[];
    onReScanClick: () => void;
};

export type UseBluetoothConnectionReturn = {
    selectedDevice: DesktopBluetoothDevice | undefined;
    notConnectedKnownDevices: DesktopBluetoothDevice[];
    notConnectedNearbyDevices: DesktopBluetoothDevice[];
    manuallyPairedConnectedDevices: DesktopBluetoothDevice[];
    onConnect: (deviceId: BluetoothDeviceId) => Promise<void>;
    handlePairingCancel: (deviceId: BluetoothDeviceId) => Promise<void>;
};

export const useBluetoothConnection = ({
    devices,
    onReScanClick,
}: UseBluetoothConnectionProps): UseBluetoothConnectionReturn => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

    const knownDevices = useSelector(selectKnownDevices<DesktopBluetoothDevice>);

    const selectedDevice = useMemo(
        () =>
            selectedDeviceId !== null
                ? devices.find(device => device.id === selectedDeviceId)
                : undefined,
        [selectedDeviceId, devices],
    );

    const notConnectedKnownDevices = useMemo(
        () => knownDevices.filter(device => device.connectionStatus.type === 'disconnected'),
        [knownDevices],
    );
    const notConnectedNearbyDevices = useMemo(
        () => devices.filter(device => device.connectionStatus.type === 'disconnected'),
        [devices],
    );

    // Devices manually paired via OS Bluetooth settings, instead of via Suite
    const manuallyPairedConnectedDevices = useMemo(
        () =>
            devices.filter(
                device =>
                    device.connectionStatus.type === 'connected' &&
                    knownDevices.every(d => d.id !== device.id),
            ),
        [devices, knownDevices],
    );

    const onConnect = async (deviceId: BluetoothDeviceId): Promise<void> => {
        setSelectedDeviceId(deviceId);

        try {
            const result = await dispatch(bluetoothConnectDeviceThunk({ deviceId })).unwrap();

            if (result.success) {
                analytics.report({
                    type: events.deviceConnectionDevicePairedEvent.name,
                });
                dispatch(setConnectionModal(false));
            } else {
                // Error handling is managed in bluetoothConnectDeviceThunk
                setSelectedDeviceId(null);
            }
        } catch (error) {
            // Handle unexpected errors
            console.error('Unexpected error during Bluetooth connection:', error);
            setSelectedDeviceId(null);
        }
    };

    const handlePairingCancel = async (deviceId: BluetoothDeviceId): Promise<void> => {
        await dispatch(bluetoothDisconnectDeviceThunk({ id: deviceId }));
        setSelectedDeviceId(null);
        onReScanClick();
    };

    return {
        selectedDevice,
        notConnectedKnownDevices,
        notConnectedNearbyDevices,
        manuallyPairedConnectedDevices,
        onConnect,
        handlePairingCancel,
    };
};
