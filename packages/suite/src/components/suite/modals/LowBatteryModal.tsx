import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { Modal } from '@trezor/components';

type LowBatteryModalProps = {
    children: React.ReactNode;
    onClose: () => void;
};

export const LowBatteryModal = ({ onClose, children }: LowBatteryModalProps) => {
    const { device } = useDevice();

    if (!device) return null;

    const batteryLevel = typeof device?.features?.soc === 'number' ? device?.features.soc : 0;

    return (
        <Modal
            heading={<Translation id="TR_CHARGE_TREZOR_BEFORE_CONTINUING" />}
            description={
                <Translation
                    id="TR_BATTERY_LEVEL"
                    values={{
                        level: batteryLevel,
                    }}
                />
            }
            onCancel={onClose}
            intent="critical"
            bottomContent={
                <Modal.Button onClick={onClose}>
                    <Translation id="TR_GOT_IT" />
                </Modal.Button>
            }
        >
            {children}
        </Modal>
    );
};
