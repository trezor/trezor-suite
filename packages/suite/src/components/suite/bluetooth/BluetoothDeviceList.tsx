import { BluetoothDeviceState } from '@suite-common/bluetooth';
import { Card, Column, Row, SkeletonRectangle } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { BluetoothDevice } from '@trezor/transport-bluetooth';

import { BluetoothDeviceItem } from './BluetoothDeviceItem';

type BluetoothDeviceListProps = {
    deviceList: BluetoothDeviceState<BluetoothDevice>[];
    onSelect: (id: string) => void;
    isScanning: boolean;
    isDisabled: boolean;
};

const SkeletonDevice = () => (
    <Row width="100%" gap={spacings.md} justifyContent="stretch" height="44px" alignItems="center">
        <SkeletonRectangle width="44px" height="36px" />
        <Column alignItems="start" gap={spacings.xxxs} flex="1">
            <SkeletonRectangle width="105px" height="18px" />
            <SkeletonRectangle width="55px" height="18px" />
        </Column>
        <SkeletonRectangle width="86px" height="36px" />
    </Row>
);

export const BluetoothDeviceList = ({
    onSelect,
    deviceList,
    isScanning,
}: BluetoothDeviceListProps) => (
    <Card>
        <Column gap={spacings.md} alignItems="stretch">
            {deviceList.map(d => (
                <BluetoothDeviceItem
                    key={d.device.id}
                    device={d.device}
                    onClick={() => onSelect(d.device.id)}
                />
            ))}
            {isScanning && <SkeletonDevice />}
        </Column>
    </Card>
);
