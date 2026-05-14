import { Translation, type TranslationKey } from '@suite/intl';
import { Icon, type IconName, List, Modal, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';

const items: Array<{ icon: IconName; text: TranslationKey }> = [
    { icon: 'shieldCheck', text: 'TR_DEVICE_AUTHENTICITY_ITEM_1' },
    { icon: 'cpu', text: 'TR_DEVICE_AUTHENTICITY_ITEM_2' },
    { icon: 'listChecks', text: 'TR_DEVICE_AUTHENTICITY_ITEM_3' },
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
        <List
            gap={spacings.xl}
            bulletGap={spacings.xl}
            margin={{ top: spacings.xs, bottom: spacings.sm }}
        >
            {items.map(({ icon, text }) => (
                <List.Item
                    key={icon}
                    bulletComponent={<Icon name={icon} size={32} intent="brand" />}
                >
                    <Paragraph intent="neutral" priority="secondary">
                        <Translation id={text} />
                    </Paragraph>
                </List.Item>
            ))}
        </List>
    </Modal>
);
