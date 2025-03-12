import { useState } from 'react';

import {
    DeviceBluetoothConnectionStatusType,
    bluetoothActions,
    selectKnownDevices,
    selectNearbyDevices,
} from '@suite-common/bluetooth';
import { Button, IconButton, NewModal, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { BluetoothDevice } from '@trezor/transport-bluetooth';

import { BluetoothDeviceComponent } from './BluetoothDeviceComponent';
import { bluetoothDisconnectDeviceThunk } from '../../../actions/bluetooth/bluetoothDisconnectDeviceThunk';
import { useDispatch, useSelector } from '../../../hooks/suite';
import { Translation, TranslationKey } from '../Translation';

const labelMap: Record<DeviceBluetoothConnectionStatusType, TranslationKey | null> = {
    disconnected: 'TR_BLUETOOTH_CONNECT',
    connecting: 'TR_BLUETOOTH_CONNECTING',
    connected: 'TR_BLUETOOTH_DISCONNECT',
    'connection-error': 'TR_BLUETOOTH_TRY_AGAIN', // Out-of-range, offline, in the faraday cage, ...
    pairing: 'TR_BLUETOOTH_PAIRING',
    paired: 'TR_BLUETOOTH_PAIRED',
    'pairing-error': null, // This shall never be shown to the user
};

const LOADING_STATUSES: DeviceBluetoothConnectionStatusType[] = ['pairing', 'connecting'];
const DISABLED_STATUSES: DeviceBluetoothConnectionStatusType[] = ['pairing', 'connecting'];

type AreYouSureModalProps = {
    onYes: () => void;
    onNo: () => void;
};

const AreYouSureModal = ({ onYes, onNo }: AreYouSureModalProps) => (
    <NewModal
        bottomContent={
            <>
                <Button variant="primary" onClick={onYes}>
                    Yes
                </Button>
                <Button variant="tertiary" onClick={onNo}>
                    No
                </Button>
            </>
        }
    >
        Are you sure?
    </NewModal>
);

type BluetoothDeviceItemProps = {
    device: BluetoothDevice;
    onConnect: (deviceId: string) => Promise<void>;
    onError: (deviceId: string) => void;
};

export const BluetoothDeviceListItem = ({
    device,
    onConnect,
    onError,
}: BluetoothDeviceItemProps) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const dispatch = useDispatch();

    const nearbyDevices = useSelector(selectNearbyDevices);
    const isNearbyDevice = nearbyDevices.find(nearbyDevice => nearbyDevice.id === device.id);
    const knownDevices = useSelector(selectKnownDevices);
    const isKnownDevice = knownDevices.find(knownDevice => knownDevice.id === device.id);

    const [isLoading, setIsLoading] = useState(false);

    const isDisabled = DISABLED_STATUSES.includes(device.connectionStatus.type);
    const isGlobalLoading = LOADING_STATUSES.includes(device.connectionStatus.type);

    const onDisconnect = async () => {
        const result = await dispatch(bluetoothDisconnectDeviceThunk({ id: device.id })).unwrap();

        if (!result.success) {
            onError(device.id);
        }
    };

    const onClickMap: Record<
        DeviceBluetoothConnectionStatusType,
        (() => Promise<void>) | undefined
    > = {
        'connection-error': () => onConnect(device.id),
        'pairing-error': undefined,
        connected: onDisconnect,
        connecting: undefined,
        disconnected: () => onConnect(device.id),
        paired: undefined,
        pairing: undefined,
    };

    const handleOnclick = onClickMap[device.connectionStatus.type];

    const handleOnClick = async () => {
        setIsLoading(true);
        await handleOnclick?.();
        setIsLoading(false);
    };

    const handleDelete = () => {
        dispatch(bluetoothActions.removeKnownDeviceAction({ id: device.id }));
        setIsDeleting(false);
    };

    const buttonLabel = labelMap[device.connectionStatus.type];

    return (
        <>
            {isDeleting && (
                <AreYouSureModal onYes={handleDelete} onNo={() => setIsDeleting(false)} />
            )}
            <Row gap={spacings.md} alignItems="center">
                <BluetoothDeviceComponent device={device} flex="1" />
                {buttonLabel !== null ? (
                    <Row gap={spacings.xs}>
                        {isKnownDevice && !isNearbyDevice ? (
                            <IconButton
                                variant="tertiary"
                                icon="trash"
                                onClick={() => setIsDeleting(true)}
                                size="small"
                            />
                        ) : null}
                        <Button
                            variant="primary"
                            size="small"
                            margin={{ vertical: spacings.xxs }}
                            isDisabled={isDisabled || handleOnclick === undefined}
                            isLoading={isLoading || isGlobalLoading}
                            onClick={handleOnClick}
                        >
                            <Translation id={buttonLabel} />
                        </Button>
                    </Row>
                ) : null}
            </Row>
        </>
    );
};
