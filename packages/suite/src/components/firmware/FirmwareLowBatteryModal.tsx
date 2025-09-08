import { Card, Column, Text } from '@trezor/components';

import { Translation } from '../suite';
import { LowBatteryModal } from '../suite/modals/LowBatteryModal';

type FirmwareLowBatteryModalProps = {
    onClose: () => void;
};

export const FirmwareLowBatteryModal = ({ onClose }: FirmwareLowBatteryModalProps) => (
    <LowBatteryModal onClose={onClose}>
        <Card>
            <Column gap={6}>
                <Text typographyStyle="highlight">
                    <Translation id="TR_FW_INSTALL_MAY_TAKE_A_WHILE" />
                </Text>
                <Text>
                    <Translation id="TR_CHARGE_TO_50_ATLEAST" />
                </Text>
            </Column>
        </Card>
    </LowBatteryModal>
);
