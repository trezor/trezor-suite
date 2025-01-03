import { Paragraph, NewModal } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { canContinue } from 'src/utils/backup';

import { BackupStepDescription } from './BackupStepDescription';
import { AfterBackupCheckboxes } from '../../components/backup';
import { BackupState } from '../../reducers/backup/backupReducer';

export const BackupStep3Finished = ({
    onCancel,
    backup,
}: {
    onCancel: () => void;
    backup: BackupState;
}) => {
    const continueEnabled = canContinue(backup.userConfirmed);

    return (
        <NewModal
            onCancel={continueEnabled ? onCancel : undefined}
            variant="primary"
            data-testid="@backup"
            heading={<Translation id="TR_BACKUP_CREATED" />}
            description={<BackupStepDescription backupStatus={backup.status} />}
            bottomContent={
                <NewModal.Button
                    isDisabled={!continueEnabled}
                    onClick={onCancel}
                    data-testid="@backup/close-button"
                >
                    <Translation id="TR_CLOSE" />
                </NewModal.Button>
            }
        >
            <Paragraph
                variant="tertiary"
                typographyStyle="hint"
                data-testid="@backup/success-message"
                margin={{ bottom: spacings.xl }}
            >
                <Translation id="TR_BACKUP_FINISHED_TEXT" />
            </Paragraph>
            <AfterBackupCheckboxes />
        </NewModal>
    );
};
