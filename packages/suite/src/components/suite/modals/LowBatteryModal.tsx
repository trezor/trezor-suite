import { Button, Column, H3, Modal, Text } from '@trezor/components';

import { useDevice } from 'src/hooks/suite';

import { Translation } from '../Translation';

type LowBatteryModalProps = {
    children: React.ReactNode;
    onClose: () => void;
};

type LowBatteryModalHeadingProps = {
    batteryLevel: number;
};

const LowBatteryModalHeading = ({ batteryLevel }: LowBatteryModalHeadingProps) => (
    <Column>
        <H3>
            <Translation id="TR_CHARGE_TREZOR_BEFORE_CONTINUING" />
        </H3>
        <Text variant="tertiary" typographyStyle="hint">
            <Translation
                id="TR_BATTERY_LEVEL"
                values={{
                    level: batteryLevel,
                }}
            />
        </Text>
    </Column>
);

export const LowBatteryModal = ({ onClose, children }: LowBatteryModalProps) => {
    const { device } = useDevice();
    if (!device) return null;

    const bateryLevel = typeof device?.batteryLevel === 'number' ? device?.batteryLevel : 0;

    return (
        <Modal
            heading={<LowBatteryModalHeading batteryLevel={bateryLevel} />}
            onCancel={onClose}
            bottomContent={
                <Button variant="destructive" onClick={onClose}>
                    <Translation id="TR_GOT_IT" />
                </Button>
            }
        >
            {children}
        </Modal>
    );
};
