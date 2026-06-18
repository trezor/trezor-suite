import { Translation } from '@suite/intl';
import { H2, Modal, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';

interface NoBackupModalViewProps {
    onConfirm: () => void;
    onCancel: () => void;
    onCreateBackup: () => void;
}

export const NoBackupModalView = ({
    onConfirm,
    onCancel,
    onCreateBackup,
}: NoBackupModalViewProps) => (
    <Modal
        onCancel={onCancel}
        iconName="warning"
        intent="warning"
        width={600}
        bottomContent={
            <>
                <Modal.Button onClick={onConfirm} data-testid="@no-backup/take-risk-button">
                    <Translation id="TR_CONTINUE_ANYWAY" />
                </Modal.Button>
                <Modal.Button intent="neutral" priority="secondary" onClick={onCreateBackup}>
                    <Translation id="TR_CREATE_BACKUP" />
                </Modal.Button>
            </>
        }
    >
        <H2>
            <Translation id="TR_YOUR_TREZOR_IS_NOT_BACKED_UP" />
        </H2>
        <Paragraph margin={{ top: spacings.sm }}>
            <Translation id="TR_IF_YOUR_DEVICE_IS_EVER_LOST" />
        </Paragraph>
    </Modal>
);
