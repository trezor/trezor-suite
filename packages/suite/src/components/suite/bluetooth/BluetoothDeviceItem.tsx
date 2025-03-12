import { useState } from 'react';

import { DeviceBluetoothConnectionStatusType } from '@suite-common/bluetooth';
import { Button, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { BluetoothDevice } from '@trezor/transport-bluetooth';

import { BluetoothDeviceComponent } from './BluetoothDeviceComponent';
import { bluetoothConnectDeviceThunk } from '../../../actions/bluetooth/bluetoothConnectDeviceThunk';
import { bluetoothDisconnectDeviceThunk } from '../../../actions/bluetooth/bluetoothDisconnectDeviceThunk';
import { closeModalApp } from '../../../actions/suite/routerActions';
import { useDispatch } from '../../../hooks/suite';

const labelMap: Record<DeviceBluetoothConnectionStatusType, string> = {
    disconnected: 'Connect',
    connecting: 'Connecting',
    connected: 'Disconnect',
    'connection-error': 'Try again', // Out-of-range, offline, in the faraday cage, ...
    pairing: 'Pairing',
    paired: 'Paired',
    'pairing-error': '', // shall never be show to user
};

const LOADING_STATUSES: DeviceBluetoothConnectionStatusType[] = ['pairing', 'connecting'];
const DISABLED_STATUSES: DeviceBluetoothConnectionStatusType[] = ['pairing', 'connecting'];

type BluetoothDeviceItemProps = {
    device: BluetoothDevice;
    onSelect: (id: string) => void;
    onError: () => void;
    uiMode: 'spatial' | 'card';
};

export const BluetoothDeviceItem = ({
    device,
    onSelect,
    onError,
    uiMode,
}: BluetoothDeviceItemProps) => {
    const dispatch = useDispatch();

    const [isLoading, setIsLoading] = useState(false);

    const isDisabled = DISABLED_STATUSES.includes(device.connectionStatus.type);
    const isGlobalLoading = LOADING_STATUSES.includes(device.connectionStatus.type);

    const onConnect = async () => {
        onSelect(device.id);
        const result = await dispatch(bluetoothConnectDeviceThunk({ id: device.id })).unwrap();

        if (uiMode === 'card' && result.success) {
            dispatch(closeModalApp());
        }

        if (!result.success) {
            onError();
        }
    };

    const onDisconnect = async () => {
        const result = await dispatch(bluetoothDisconnectDeviceThunk({ id: device.id })).unwrap();

        if (!result.success) {
            onError();
        }
    };

    const onClickMap: Record<
        DeviceBluetoothConnectionStatusType,
        (() => Promise<void>) | undefined
    > = {
        'connection-error': onConnect,
        'pairing-error': undefined,
        connected: onDisconnect,
        connecting: undefined,
        disconnected: onConnect,
        paired: undefined,
        pairing: undefined,
    };

    const handleOnclick = onClickMap[device.connectionStatus.type];

    const handleOnClick = async () => {
        setIsLoading(true);
        await handleOnclick?.();
        setIsLoading(false);
    };

    return (
        <Row gap={spacings.md} alignItems="stretch">
            <BluetoothDeviceComponent device={device} flex="1" />
            <Button
                variant="primary"
                size="small"
                margin={{ vertical: spacings.xxs }}
                isDisabled={isDisabled || handleOnclick === undefined}
                isLoading={isLoading || isGlobalLoading}
                onClick={handleOnClick}
            >
                {labelMap[device.connectionStatus.type]}
            </Button>
        </Row>
    );
};
