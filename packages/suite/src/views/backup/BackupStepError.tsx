import { H3, Modal } from '@trezor/components';

import { Translation } from 'src/components/suite/Translation';

export const BackupStepError = ({ onCancel }: { onCancel: () => void }) => (
    <Modal
        onCancel={onCancel}
        variant="warning"
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
