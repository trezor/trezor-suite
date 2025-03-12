import { Card, Column, Row, SkeletonRectangle } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { BluetoothDevice } from '@trezor/transport-bluetooth';

import { BluetoothDeviceItem } from './BluetoothDeviceItem';

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

type BluetoothDeviceListProps = {
    deviceList: BluetoothDevice[];
    onSelect: (id: string) => void;
    onError: () => void;
    isScanning: boolean;
    isDisabled: boolean;
    uiMode: 'spatial' | 'card';
};

export const BluetoothDeviceList = ({
    onSelect,
    onError,
    deviceList,
    isScanning,
    uiMode,
}: BluetoothDeviceListProps) => (
    <Card>
        <Column gap={spacings.md} alignItems="stretch">
            {deviceList.map(device => (
                <BluetoothDeviceItem
                    key={device.id}
                    device={device}
                    onSelect={onSelect}
                    onError={onError}
                    uiMode={uiMode}
                />
            ))}
            {isScanning && <SkeletonDevice />}
        </Column>
    </Card>
);
