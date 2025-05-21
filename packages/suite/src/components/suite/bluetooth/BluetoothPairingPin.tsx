import styled from 'styled-components';

import { Card, Link, Modal, Row, Text } from '@trezor/components';
import { spacings, spacingsPx, typography } from '@trezor/theme';

import { BluetoothDeviceComponent } from './BluetoothDeviceComponent';
import { DesktopBluetoothDevice } from '../../../actions/bluetooth/DesktopBluetoothDevice';
import { Translation } from '../Translation';

const Pin = styled.div`
    display: flex;
    flex: 1;

    ${typography.titleLarge} /* Amount */ margin: 0 auto;

    letter-spacing: ${spacingsPx.md};
`;

type BluetoothPairingPinProps = {
    onCancel: (deviceId: string) => void;
    pairingPin?: string;
    device: DesktopBluetoothDevice;
};

export const BluetoothPairingPin = ({ onCancel, pairingPin, device }: BluetoothPairingPinProps) => {
    const handleOnCancel = () => onCancel(device.id);

    return (
        <Modal
            heading={<Translation id="TR_BLUETOOTH_PIN_CODE" />}
            onCancel={handleOnCancel}
            variant="primary"
            bottomContent={
                <Link onClick={handleOnCancel} typographyStyle="hint" variant="underline">
                    <Text variant="tertiary">
                        <Translation id="TR_BLUETOOTH_PIN_CODE_DONT_MATCH" />
                    </Text>
                </Link>
            }
        >
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
        </Modal>
    );
};
