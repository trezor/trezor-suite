import { useMemo, useState } from 'react';

import { selectKnownDevices } from '@suite-common/bluetooth';
import { BluetoothDeviceId } from '@trezor/connect';

import { DesktopBluetoothDevice } from 'src/actions/bluetooth/DesktopBluetoothDevice';
import { bluetoothConnectDeviceThunk } from 'src/actions/bluetooth/bluetoothConnectDeviceThunk';
import { bluetoothDisconnectDeviceThunk } from 'src/actions/bluetooth/bluetoothDisconnectDeviceThunk';
import { setConnectionModal } from 'src/actions/device/deviceSlice';
import { useDispatch, useSelector } from 'src/hooks/suite';

export type UseBluetoothConnectionProps = {
    devices: DesktopBluetoothDevice[];
    onReScanClick: () => void;
    toggleBluetoothMode: () => void;
};

export type UseBluetoothConnectionReturn = {
    selectedDevice: DesktopBluetoothDevice | undefined;
    selectedDeviceId: string | null;
    notConnectedKnownDevices: DesktopBluetoothDevice[];
    notConnectedNearbyDevices: DesktopBluetoothDevice[];
    onConnect: (deviceId: BluetoothDeviceId) => Promise<void>;
    handlePairingCancel: (deviceId: BluetoothDeviceId) => Promise<void>;
    handleBluetoothConnectionCancel: () => void;
};

export const useBluetoothConnection = ({
    devices,
    onReScanClick,
    toggleBluetoothMode,
}: UseBluetoothConnectionProps): UseBluetoothConnectionReturn => {
    const dispatch = useDispatch();
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

    const knownDevices = useSelector(selectKnownDevices);

    const selectedDevice = useMemo(
        () =>
            selectedDeviceId !== null
                ? devices.find(device => device.id === selectedDeviceId)
                : undefined,
        [selectedDeviceId, devices],
    );

    const notConnectedKnownDevices = useMemo(
        () => knownDevices.filter(device => device.connected === false),
        [knownDevices],
    );

    const notConnectedNearbyDevices = useMemo(
        () => devices.filter(device => device.connected === false),
        [devices],
    );

    const onConnect = async (deviceId: BluetoothDeviceId): Promise<void> => {
        setSelectedDeviceId(deviceId);

        try {
            const result = await dispatch(bluetoothConnectDeviceThunk({ deviceId })).unwrap();

            if (result.success) {
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

    const handleBluetoothConnectionCancel = (): void => {
        setSelectedDeviceId(null);
        onReScanClick();
        toggleBluetoothMode();
    };

    return {
        selectedDevice,
        selectedDeviceId,
        notConnectedKnownDevices,
        notConnectedNearbyDevices,
        onConnect,
        handlePairingCancel,
        handleBluetoothConnectionCancel,
    };
};
