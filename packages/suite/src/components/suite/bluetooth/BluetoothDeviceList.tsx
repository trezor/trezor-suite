import { Card, Column, SkeletonRectangle, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { BluetoothDeviceItem } from './BluetoothDeviceItem';
import { BluetoothDeviceState } from '../../../reducers/bluetooth/bluetoothReducer';

type BluetoothDeviceListProps = {
    deviceList: BluetoothDeviceState[];
    onSelect: (uuid: string) => void;
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
                    key={d.device.uuid}
                    device={d.device}
                    onClick={() => onSelect(d.device.uuid)}
                />
            ))}
            {isScanning && <SkeletonDevice />}
        </Column>
    </Card>
);
