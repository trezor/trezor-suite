import { DEFAULT_FLAGSHIP_MODEL } from '@suite-common/suite-constants';
import { Card } from '@trezor/components';
import { DeviceAnimation } from '@trezor/product-components';

import { ConnectBtAnimation } from './ConnectBtAnimation';

type CableConnectionAnimationProps = {
    isBluetoothMode: boolean;
};

export const CableConnectionAnimation = ({
    isBluetoothMode: isBluetooth,
}: CableConnectionAnimationProps) => (
    <Card paddingType="none" height={490}>
        {isBluetooth ? (
            <ConnectBtAnimation />
        ) : (
            <DeviceAnimation type="CONNECT_CABLE" deviceModelInternal={DEFAULT_FLAGSHIP_MODEL} />
        )}
    </Card>
);
