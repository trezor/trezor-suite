import { Translation } from '@suite/intl';
import { Card, Modal, Paragraph } from '@trezor/components';

type SuiteSyncTurnOnAndFwUpgradeModalProps = {
    onClose: () => void;
};

export const SuiteSyncTurnOnUnsupportedModal = ({
    onClose,
}: SuiteSyncTurnOnAndFwUpgradeModalProps) => (
    <Modal
        heading={<Translation id="TR_UNSUPPORTED_DEVICE_SUITE_SYNC_HEADING" />}
        onCancel={onClose}
        width={600}
        bottomContent={
            <>
                <Modal.Button onClick={onClose} intent="info">
                    <Translation id="TR_TURN_ON_SECURE_SYNC" />
                </Modal.Button>
                <Modal.Button onClick={onClose} intent="neutral" priority="secondary">
                    <Translation id="TR_CANCEL" />
                </Modal.Button>
            </>
        }
    >
        <Card paddingType="large">
            <Paragraph>
                <Translation id="FIRMWARE_UNSUPPORTED_DEVICE_SUITE_SYNC" />
            </Paragraph>
        </Card>
    </Modal>
);
