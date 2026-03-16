import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { Card, Modal, Row, Text } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';

import { BluetoothDeviceComponent } from './BluetoothDeviceComponent';
import { type DesktopBluetoothDevice } from '../../../actions/bluetooth/DesktopBluetoothDevice';

const Pin = styled.span`
    letter-spacing: ${spacingsPx.md};
`;

type BluetoothPairingPinProps = {
    pairingPin?: string;
    device: DesktopBluetoothDevice;
    onCancel: () => void;
};

export const BluetoothPairingPin = ({ pairingPin, device, onCancel }: BluetoothPairingPinProps) => (
    <Modal
        onCancel={onCancel}
        heading={<Translation id="TR_CONFIRM_PAIRING_TREZOR" />}
        description={<Translation id="TR_CONFIRM_PAIRING_TREZOR_DESCRIPTION" />}
    >
        <Card overflow="hidden" paddingType="large">
            <Row gap={8} justifyContent="space-between" padding={{ horizontal: 8, vertical: 4 }}>
                <Text typographyStyle="headline-lg">
                    <Pin>{pairingPin}</Pin>
                </Text>
                <BluetoothDeviceComponent device={device} />
            </Row>
        </Card>
    </Modal>
);
