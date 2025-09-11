import styled from 'styled-components';

import { Card, Row, Text } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';

import { BluetoothDeviceComponent } from './BluetoothDeviceComponent';
import { DesktopBluetoothDevice } from '../../../actions/bluetooth/DesktopBluetoothDevice';

const Pin = styled.span`
    letter-spacing: ${spacingsPx.md};
`;

type BluetoothPairingPinProps = {
    pairingPin?: string;
    device: DesktopBluetoothDevice;
};

export const BluetoothPairingPin = ({ pairingPin, device }: BluetoothPairingPinProps) => (
    <Card overflow="hidden" paddingType="large">
        <Row gap={8} justifyContent="space-between" padding={{ horizontal: 8, vertical: 4 }}>
            <Text typographyStyle="titleLarge">
                <Pin>{pairingPin}</Pin>
            </Text>
            <BluetoothDeviceComponent device={device} />
        </Row>
    </Card>
);
