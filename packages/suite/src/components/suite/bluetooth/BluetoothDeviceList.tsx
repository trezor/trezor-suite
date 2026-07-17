import { Card, Column, Row, Skeleton } from '@trezor/components';

import { type DesktopBluetoothDevice } from 'src/actions/bluetooth/DesktopBluetoothDevice';

import { BluetoothDeviceListItem } from './BluetoothDeviceListItem';

const SkeletonDevice = () => (
    <Row width="100%" gap={16} justifyContent="stretch" height="44px" alignItems="center">
        <Skeleton width={44} height={36} animate />
        <Column alignItems="start" gap={2} flex="1">
            <Skeleton width={105} height={18} animate />
            <Skeleton width={55} height={18} animate />
        </Column>
        <Skeleton width={86} height={36} animate />
    </Row>
);

type BluetoothDeviceListProps = {
    deviceList: DesktopBluetoothDevice[];
    isScanning: boolean;
    onPairAgain?: () => void;
};

export const BluetoothDeviceList = ({
    deviceList,
    isScanning,
    onPairAgain,
}: BluetoothDeviceListProps) => (
    <Card paddingType="large">
        <Column gap={32}>
            {deviceList.map(device => (
                <BluetoothDeviceListItem
                    key={device.id}
                    device={device}
                    onPairAgain={onPairAgain}
                />
            ))}
            {isScanning && <SkeletonDevice />}
        </Column>
    </Card>
);
