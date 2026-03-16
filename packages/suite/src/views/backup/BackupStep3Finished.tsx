import { Translation } from '@suite/intl';
import { Modal, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { canContinue } from 'src/utils/backup';

import { BackupStepDescription } from './BackupStepDescription';
import { AfterBackupCheckboxes } from '../../components/backup';
import { type BackupState } from '../../reducers/backup/backupReducer';

export const BackupStep3Finished = ({
    onCancel,
    backup,
}: {
    onCancel: () => void;
    backup: BackupState;
}) => {
    const continueEnabled = canContinue(backup.userConfirmed);

    return (
        <Modal
            onCancel={continueEnabled ? onCancel : undefined}
            intent="brand"
            data-testid="@backup"
            heading={<Translation id="TR_BACKUP_CREATED" />}
            description={<BackupStepDescription />}
            bottomContent={
                <Modal.Button
                    isDisabled={!continueEnabled}
                    onClick={onCancel}
                    data-testid="@backup/close-button"
                >
                    <Translation id="TR_CLOSE" />
                </Modal.Button>
            }
        >
            <Paragraph
                intent="neutral"
                priority="secondary"
                typographyStyle="body-sm"
                data-testid="@backup/success-message"
                margin={{ bottom: spacings.xl }}
            >
                <Translation id="TR_BACKUP_FINISHED_TEXT" />
            </Paragraph>
            <AfterBackupCheckboxes />
        </Modal>
    );
};
