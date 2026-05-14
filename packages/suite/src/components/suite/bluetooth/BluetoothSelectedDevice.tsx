import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { type DeviceBluetoothConnectionStatusType } from '@suite-common/bluetooth';
import { Banner, Card, Modal, Row } from '@trezor/components';

import { type DesktopBluetoothDevice } from 'src/actions/bluetooth/DesktopBluetoothDevice';

import { BluetoothDeviceComponent } from './BluetoothDeviceComponent';
import { BluetoothTips } from './BluetoothTips';
import { PairingState } from './PairingState';

export type OkComponentProps = {
    device: DesktopBluetoothDevice;
};

const OkComponent = ({ device }: OkComponentProps) => {
    const map: Record<DeviceBluetoothConnectionStatusType, ReactNode> = {
        disconnected: <PairingState isLoading text="TR_BLUETOOTH_DISCONNECTED_BUT_WAITING" />,
        pairing: <PairingState isLoading text="TR_BLUETOOTH_PAIRING" />,
        paired: <PairingState text="TR_BLUETOOTH_PAIRED" />,
        'pairing-canceled': 'Pairing canceled', // Shall not be shown in the UI
        'pairing-error': 'Pairing failed', // Shall not be shown in the UI
        connecting: <PairingState isLoading text="TR_BLUETOOTH_CONNECTING" />,
        connected: <PairingState text="TR_BLUETOOTH_CONNECTED" />,
        'connection-error': 'Connection failed', // Shall not be shown in the UI
    };

    return (
        <Row gap={16} justifyContent="space-between">
            <BluetoothDeviceComponent device={device} />
            {map[device.connectionStatus.type]}
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
    onCancel: () => void;
    onReScanClick: () => void;
};

export const BluetoothSelectedDevice = ({
    device,
    onCancel,
    onReScanClick,
}: BluetoothSelectedDeviceProps) => {
    const isError =
        device.connectionStatus.type === 'connection-error' ||
        device.connectionStatus.type === 'pairing-error';

    if (isError) {
        return <ErrorComponent onReScanClick={onReScanClick} device={device} />;
    }

    const showHint = ['disconnected', 'connecting', 'pairing'].includes(
        device.connectionStatus.type,
    );

    const devicePairing = device.connectionStatus.type === 'pairing';

    return (
        <Modal
            onCancel={onCancel}
            heading={
                devicePairing ? (
                    <Translation id="TR_CONFIRM_PAIRING_TREZOR" />
                ) : (
                    <Translation id="TR_CONNECT_YOUR_TREZOR" />
                )
            }
            description={
                devicePairing ? (
                    <Translation id="TR_CONFIRM_PAIRING_TREZOR_DESCRIPTION" />
                ) : (
                    <Translation id="TR_CONNECT_YOUR_TREZOR_DESCRIPTION" />
                )
            }
            width={600}
        >
            <Card>
                <OkComponent device={device} />
                {showHint && (
                    <Banner
                        intent="info"
                        icon="info"
                        margin={{ top: 16 }}
                        description={<Translation id="TR_CONFIRM_BLUETOOTH_PAIRING" />}
                    />
                )}
            </Card>
        </Modal>
    );
};
