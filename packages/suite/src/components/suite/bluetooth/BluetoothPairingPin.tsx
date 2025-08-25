import styled from 'styled-components';

import { Card, Row } from '@trezor/components';
import { spacings, spacingsPx, typography } from '@trezor/theme';

import { BluetoothDeviceComponent } from './BluetoothDeviceComponent';
import { DesktopBluetoothDevice } from '../../../actions/bluetooth/DesktopBluetoothDevice';

const Pin = styled.div`
    display: flex;
    flex: 1;

    ${typography.titleLarge} /* Amount */ margin: 0 auto;

    letter-spacing: ${spacingsPx.md};
`;

type BluetoothPairingPinProps = {
    pairingPin?: string;
    device: DesktopBluetoothDevice;
};

export const BluetoothPairingPin = ({ pairingPin, device }: BluetoothPairingPinProps) => (
    <Card paddingType="none" overflow="hidden">
        <Row
            alignItems="center"
            gap={spacings.xs}
            justifyContent="space-between"
            margin={{ vertical: spacings.xxl, horizontal: spacings.xxl }}
        >
            <Pin>{pairingPin}</Pin>
            <BluetoothDeviceComponent
                device={device}
                margin={{ vertical: spacings.xxs, horizontal: spacings.xxs }}
            />
        </Row>
    </Card>
);
