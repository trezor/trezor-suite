import { ReactNode } from 'react';

import { DeviceBluetoothConnectionStatusType } from '@suite-common/bluetooth';
import {
    Button,
    Card,
    Column,
    ElevationContext,
    Icon,
    Row,
    Spinner,
    Text,
} from '@trezor/components';
import { spacings } from '@trezor/theme';
import { BluetoothDevice } from '@trezor/transport-bluetooth';

import { BluetoothDeviceComponent } from './BluetoothDeviceComponent';
import { BluetoothTips } from './BluetoothTips';

const PairedComponent = () => (
    <Row gap={spacings.md} alignItems="center">
        <Icon size="small" name="check"></Icon>
        <Text variant="primary">Paired</Text>
    </Row>
);

const PairingComponent = () => (
    <Row gap={spacings.xxs} alignItems="center">
        <Spinner size={spacings.md} />
        <Text variant="tertiary">Pairing</Text>
    </Row>
);

const ConnectingComponent = () => (
    <Row gap={spacings.xxs} alignItems="center">
        <Spinner size={spacings.md} />
        <Text variant="tertiary">Connecting</Text>
    </Row>
);

const ConnectedComponent = () => (
    <Row gap={spacings.md} alignItems="center">
        <Icon size="small" name="check"></Icon>
        <Text variant="primary">Connected</Text>
    </Row>
);

export type OkComponentProps = {
    device: BluetoothDevice;
    onCancel: () => void;
};

const OkComponent = ({ device, onCancel }: OkComponentProps) => {
    const CancelButton = () => (
        <Button onClick={onCancel} variant="tertiary" size="small">
            Cancel
        </Button>
    );

    const map: Record<DeviceBluetoothConnectionStatusType, ReactNode> = {
        disconnected: 'Disconnected', // Shall not be shown in the UI
        pairing: (
            <>
                <PairingComponent />
                <CancelButton />
            </>
        ),
        paired: <PairedComponent />,
        'pairing-error': 'Pairing failed', // Shall not be shown in the UI
        connecting: (
            <>
                <ConnectingComponent />
                <CancelButton />
            </>
        ),
        connected: <ConnectedComponent />,
        'connection-error': 'Connection failed', // Shall not be shown in the UI
    };

    return (
        <Row gap={spacings.md} alignItems="center" justifyContent="stretch">
            <BluetoothDeviceComponent device={device} flex="1" />

            <Column alignItems="center" gap={spacings.md}>
                {map[device.connectionStatus.type]}
            </Column>
        </Row>
    );
};

export type ErrorComponentProps = {
    device: BluetoothDevice;
    onReScanClick: () => void;
};

const ErrorComponent = ({ device, onReScanClick }: ErrorComponentProps) => (
    <BluetoothTips onReScanClick={onReScanClick} header="Pairign failed" device={device} />
);

export type BluetoothSelectedDeviceProps = {
    device: BluetoothDevice;
    onReScanClick: () => void;
    onCancel: () => void;
};

export const BluetoothSelectedDevice = ({
    device,
    onReScanClick,
    onCancel,
}: BluetoothSelectedDeviceProps) => (
    <ElevationContext baseElevation={0}>
        {device.connectionStatus.type === 'connection-error' ||
        device.connectionStatus.type === 'pairing-error' ? (
            <ErrorComponent onReScanClick={onReScanClick} device={device} />
        ) : (
            <Card>
                <OkComponent device={device} onCancel={onCancel} />
            </Card>
        )}
    </ElevationContext>
);
