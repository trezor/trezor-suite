import { Translation, type TranslationKey } from '@suite/intl';
import { Icon, type IconComponent, List, Modal, Paragraph } from '@trezor/components';
import { CpuIcon, ListChecksIcon, ShieldCheckIcon } from '@trezor/icons';
const items: Array<{ id: string; icon: IconComponent; text: TranslationKey }> = [
    { id: 'security', icon: ShieldCheckIcon, text: 'TR_DEVICE_AUTHENTICITY_ITEM_1' },
    { id: 'chip', icon: CpuIcon, text: 'TR_DEVICE_AUTHENTICITY_ITEM_2' },
    { id: 'checks', icon: ListChecksIcon, text: 'TR_DEVICE_AUTHENTICITY_ITEM_3' },
];

type AuthenticateDeviceInititalStepProps = {
    handleClick: () => void;
    handleClose: () => void;
    isLoading: boolean;
};
export const AuthenticateDeviceInititalStep = ({
    handleClick,
    handleClose,
    isLoading,
}: AuthenticateDeviceInititalStepProps) => (
    <Modal
        onCancel={handleClose}
        heading={<Translation id="TR_LETS_CHECK_YOUR_DEVICE" />}
        bottomContent={
            <>
                <Modal.Button onClick={handleClick} isDisabled={isLoading} isLoading={isLoading}>
                    <Translation id="TR_START_CHECK" />
                </Modal.Button>
                <Modal.Button intent="neutral" priority="secondary" onClick={handleClose}>
                    <Translation id="TR_CANCEL" />
                </Modal.Button>
            </>
        }
    >
        <List gap={24} bulletGap={24} margin={{ top: 8, bottom: 12 }}>
            {items.map(({ id, icon, text }) => (
                <List.Item key={id} bulletComponent={<Icon as={icon} size={32} intent="brand" />}>
                    <Paragraph intent="neutral" priority="secondary">
                        <Translation id={text} />
                    </Paragraph>
                </List.Item>
            ))}
        </List>
    </Modal>
);
