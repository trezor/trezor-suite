import { Card, Column, Row, SkeletonRectangle } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { BluetoothDeviceListItem } from './BluetoothDeviceListItem';
import { DesktopBluetoothDevice } from '../../../actions/bluetooth/DesktopBluetoothDevice';

const SkeletonDevice = () => (
    <Row width="100%" gap={spacings.md} justifyContent="stretch" height="44px" alignItems="center">
        <SkeletonRectangle width="44px" height="36px" animate />
        <Column alignItems="start" gap={spacings.xxxs} flex="1">
            <SkeletonRectangle width="105px" height="18px" animate />
            <SkeletonRectangle width="55px" height="18px" animate />
        </Column>
        <SkeletonRectangle width="86px" height="36px" animate />
    </Row>
);

type BluetoothDeviceListProps = {
    deviceList: DesktopBluetoothDevice[];
    onConnect: (deviceId: string) => Promise<void>;
    isScanning: boolean;
    isDisabled: boolean;
};

export const BluetoothDeviceList = ({
    onConnect,
    deviceList,
    isScanning,
}: BluetoothDeviceListProps) => (
    <Card>
        <Column gap={spacings.md} alignItems="stretch">
            {deviceList.map(device => (
                <BluetoothDeviceListItem key={device.id} device={device} onConnect={onConnect} />
            ))}
            {isScanning && <SkeletonDevice />}
        </Column>
    </Card>
);
