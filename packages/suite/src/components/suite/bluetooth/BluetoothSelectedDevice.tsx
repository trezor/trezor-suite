import { ReactNode, useState } from 'react';

import { DeviceBluetoothConnectionStatusType } from '@suite-common/bluetooth';
import { Card, Column, Row, Spinner, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { BluetoothDeviceComponent } from './BluetoothDeviceComponent';
import { BluetoothDialogCard } from './BluetoothDialogCard';
import { BluetoothTips } from './BluetoothTips';
import { DesktopBluetoothDevice } from '../../../actions/bluetooth/DesktopBluetoothDevice';
import { Translation } from '../Translation';
import { PairingState } from './PairingState';

const Cancelling = () => (
    <Row gap={spacings.xxs} alignItems="center">
        <Spinner size={spacings.md} />
        <Text variant="tertiary">
            <Translation id="TR_BLUETOOTH_CANCELLING" />
        </Text>
    </Row>
);

export type OkComponentProps = {
    device: DesktopBluetoothDevice;
    isCancelling: boolean;
};

const OkComponent = ({ device, isCancelling }: OkComponentProps) => {
    const map: Record<DeviceBluetoothConnectionStatusType, ReactNode> = {
        disconnected: <PairingState isLoading text="TR_BLUETOOTH_DISCONNECTED_BUT_WAITING" />,
        pairing: <PairingState isLoading text="TR_BLUETOOTH_PAIRING" />,
        paired: <PairingState text="TR_BLUETOOTH_PAIRED" />,
        'pairing-error': 'Pairing failed', // Shall not be shown in the UI
        connecting: <PairingState isLoading text="TR_BLUETOOTH_CONNECTING" />,
        connected: <PairingState text="TR_BLUETOOTH_CONNECTED" />,
        'connection-error': 'Connection failed', // Shall not be shown in the UI
    };

    return (
        <Row gap={spacings.md} alignItems="center" justifyContent="stretch">
            <BluetoothDeviceComponent device={device} flex="1" />

            <Column alignItems="center" gap={spacings.md}>
                {isCancelling ? <Cancelling /> : map[device.connectionStatus.type]}
            </Column>
        </Row>
    );
};

export type ErrorComponentProps = {
    device: DesktopBluetoothDevice;
    onReScanClick: () => void;
};

const ErrorComponent = ({ device, onReScanClick }: ErrorComponentProps) => (
    <BluetoothTips
        onReScanClick={onReScanClick}
        header={<Translation id="TR_BLUETOOTH_PAIRING_FAILED" />}
        device={device}
    />
);

export type BluetoothSelectedDeviceProps = {
    device: DesktopBluetoothDevice;
    onReScanClick: () => void;
    onCancel: (deviceId: string) => Promise<void>;
};

export const BluetoothSelectedDevice = ({
    device,
    onReScanClick,
    onCancel,
}: BluetoothSelectedDeviceProps) => {
    const [isCancelling, setIsCanceling] = useState(false);

    const handleCancel = async () => {
        setIsCanceling(true);
        await onCancel(device.id);
        setIsCanceling(false);
    };

    return (
        <BluetoothDialogCard
            cardHeader="Pairing"
            headerOnClose={handleCancel}
            floatingHeader={<Translation id="TR_CONNECT_VIA_BLUETOOTH" />}
        >
            {device.connectionStatus.type === 'connection-error' ||
            device.connectionStatus.type === 'pairing-error' ? (
                <ErrorComponent onReScanClick={onReScanClick} device={device} />
            ) : (
                <Card>
                    <OkComponent device={device} isCancelling={isCancelling} />
                </Card>
            )}
        </BluetoothDialogCard>
    );
};
