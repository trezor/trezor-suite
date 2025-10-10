import { Card } from '@trezor/components';
import { DeviceAnimation } from '@trezor/product-components';

type CableConnectionAnimationProps = {
    isBluetoothMode: boolean;
};

export const CableConnectionAnimation = ({ isBluetoothMode }: CableConnectionAnimationProps) => (
    <Card paddingType="none" height={490}>
        <DeviceAnimation type={isBluetoothMode ? 'CONNECT_BT' : 'CONNECT_CABLE'} />
    </Card>
);
