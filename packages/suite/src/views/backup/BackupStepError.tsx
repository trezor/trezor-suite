import { Modal, Paragraph } from '@trezor/components';

import { Translation } from 'src/components/suite';

import { BackupState } from '../../reducers/backup/backupReducer';

export const BackupStepError = ({
    onCancel,
    backup,
}: {
    onCancel: () => void;
    backup: BackupState;
}) => (
    <Modal
        onCancel={onCancel}
        variant="warning"
        iconName="warning"
        data-testid="@backup"
        heading={<Translation id="TOAST_BACKUP_FAILED" />}
        description={undefined} // Error state has no Step description
        bottomContent={
            <Modal.Button onClick={() => onCancel()} data-testid="@backup/close-button">
                <Translation id="TR_CLOSE" />
            </Modal.Button>
        }
    >
        <Paragraph data-testid="@backup/error-message" typographyStyle="highlight">
            {backup.error}
        </Paragraph>
    </Modal>
);
