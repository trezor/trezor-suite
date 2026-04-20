import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import {
    DEVICE_LOW_BATTERY_PERCENTAGE_THRESHOLD,
    selectSelectedDevice,
} from '@suite-common/device';
import { Card, Column, Modal, Paragraph } from '@trezor/components';

type FirmwareLowBatteryModalProps = {
    onClose: () => void;
};

export const FirmwareLowBatteryModal = ({ onClose }: FirmwareLowBatteryModalProps) => {
    const device = useSelector(selectSelectedDevice);

    if (!device) {
        return null;
    }

    const batteryLevel = typeof device.features?.soc === 'number' ? device.features.soc : 0;

    return (
        <Modal
            heading={<Translation id="TR_CHARGE_TREZOR_BEFORE_CONTINUING" />}
            description={<Translation id="TR_BATTERY_LEVEL" values={{ level: batteryLevel }} />}
            onCancel={onClose}
            intent="critical"
            bottomContent={
                <Modal.Button onClick={onClose}>
                    <Translation id="TR_GOT_IT" />
                </Modal.Button>
            }
        >
            <Card paddingType="large">
                <Column gap={6}>
                    <Paragraph typographyStyle="body-md-strong">
                        <Translation id="TR_FW_INSTALL_MAY_TAKE_A_WHILE" />
                    </Paragraph>
                    <Paragraph>
                        <Translation
                            id="TR_CHARGE_BATTERY_TO_ATLEAST"
                            values={{ percentage: DEVICE_LOW_BATTERY_PERCENTAGE_THRESHOLD }}
                        />
                    </Paragraph>
                </Column>
            </Card>
        </Modal>
    );
};
