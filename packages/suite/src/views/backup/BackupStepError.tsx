import { Translation } from '@suite/intl';
import { H3, Modal } from '@trezor/components';

export const BackupStepError = ({ onCancel }: { onCancel: () => void }) => (
    <Modal
        onCancel={onCancel}
        intent="warning"
        iconName="warning"
        data-testid="@backup"
        bottomContent={
            <Modal.Button onClick={() => onCancel()} data-testid="@backup/close-button">
                <Translation id="TR_CLOSE" />
            </Modal.Button>
        }
    >
        <H3>
            <Translation id="TOAST_BACKUP_FAILED" />
        </H3>
    </Modal>
);
