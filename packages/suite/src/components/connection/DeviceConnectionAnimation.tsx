import { Card } from '@trezor/components';
import { DeviceAnimation } from '@trezor/product-components';

type CableConnectionAnimationProps = {
    isBluetoothMode: boolean;
};

export const CableConnectionAnimation = ({
    isBluetoothMode: isBluetooth,
}: CableConnectionAnimationProps) => (
    <Card paddingType="none">
        <DeviceAnimation type={isBluetooth ? 'CONNECT_BT' : 'CONNECT_CABLE'} />
    </Card>
);
