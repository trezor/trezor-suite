import { Card, ElevationContext, Icon, Row, Spinner, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { BluetoothDevice } from './BluetoothDevice';
import { BluetoothDeviceState } from '../../../reducers/bluetooth/bluetoothReducer';
import { BluetoothTips } from './BluetoothTips';

const PairedComponent = () => (
    <Row gap={spacings.xs} alignItems="center">
        {/* Todo: here we shall solve how to continue with Trezor Host Protocol */}
        <Icon size="small" name="check"></Icon>
        <Text variant="primary">Paired</Text>
    </Row>
);

const PairingComponent = () => (
    <Row gap={spacings.xs} alignItems="center">
        <Spinner size={spacings.sm} />
        <Text variant="tertiary">Pairing</Text>
    </Row>
);

export type OkComponentProps = {
    device: BluetoothDeviceState;
};

const OkComponent = ({ device }: OkComponentProps) => (
    <Row gap={spacings.md} alignItems="center" justifyContent="stretch">
        <BluetoothDevice device={device.device} flex="1" />

        {device.status.type === 'connected' ? <PairedComponent /> : <PairingComponent />}
    </Row>
);

export type ErrorComponentProps = {
    device: BluetoothDeviceState;
    onReScanClick: () => void;
};

const ErrorComponent = ({ device, onReScanClick }: ErrorComponentProps) => {
    if (device.status.type !== 'error') {
        return null;
    }

    return <BluetoothTips onReScanClick={onReScanClick} header="Pairign failed" />;
};

export type BluetoothSelectedDeviceProps = {
    device: BluetoothDeviceState;
    onReScanClick: () => void;
};

export const BluetoothSelectedDevice = ({
    device,
    onReScanClick,
}: BluetoothSelectedDeviceProps) => (
    <ElevationContext baseElevation={0}>
        {device.status.type === 'error' ? (
            <ErrorComponent onReScanClick={onReScanClick} device={device} />
        ) : (
            <Card>
                <OkComponent device={device} />
            </Card>
        )}
    </ElevationContext>
);
