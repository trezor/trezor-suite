import { Translation } from '@suite/intl';
import { DEVICE_LOW_BATTERY_PERCENTAGE_THRESHOLD } from '@suite-common/device';
import { Card, Column, Paragraph } from '@trezor/components';

import { LowBatteryModal } from '../suite/modals/LowBatteryModal';

type FirmwareLowBatteryModalProps = {
    onClose: () => void;
};

export const FirmwareLowBatteryModal = ({ onClose }: FirmwareLowBatteryModalProps) => (
    <LowBatteryModal onClose={onClose}>
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
    </LowBatteryModal>
);
