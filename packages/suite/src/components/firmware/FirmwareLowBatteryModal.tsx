import { DEVICE_LOW_BATTERY_PERCENTAGE_THRESHOLD } from '@suite-common/wallet-core';
import { Card, Column, Text } from '@trezor/components';

import { Translation } from 'src/components/suite/Translation';

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
                    <Translation
                        id="TR_CHARGE_BATTERY_TO_ATLEAST"
                        values={{ percentage: DEVICE_LOW_BATTERY_PERCENTAGE_THRESHOLD }}
                    />
                </Text>
            </Column>
        </Card>
    </LowBatteryModal>
);
