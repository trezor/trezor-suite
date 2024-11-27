import { BluetoothDevice as BluetoothDeviceType } from '@trezor/transport-bluetooth';
import { Button, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { BluetoothDevice } from './BluetoothDevice';

type BluetoothDeviceItemProps = {
    device: BluetoothDeviceType;
    onClick: () => void;
    isDisabled?: boolean;
};

export const BluetoothDeviceItem = ({ device, onClick, isDisabled }: BluetoothDeviceItemProps) => (
    <Row onClick={onClick} gap={spacings.md} alignItems="stretch">
        <BluetoothDevice device={device} flex="1" />
        <Button
            variant="primary"
            size="small"
            margin={{ vertical: spacings.xxs }}
            isDisabled={isDisabled}
        >
            Connect
        </Button>
    </Row>
);
