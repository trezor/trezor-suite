import { DEVICE_LOW_BATTERY_PERCENTAGE_THRESHOLD } from '@suite-common/wallet-core';
import { Card, Column, Paragraph } from '@trezor/components';

import { Translation } from 'src/components/suite/Translation';

import { LowBatteryModal } from '../suite/modals/LowBatteryModal';

type FirmwareLowBatteryModalProps = {
    onClose: () => void;
};

export const FirmwareLowBatteryModal = ({ onClose }: FirmwareLowBatteryModalProps) => (
    <LowBatteryModal onClose={onClose}>
        <Card paddingType="large">
            <Column gap={6}>
                <Paragraph typographyStyle="highlight">
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
