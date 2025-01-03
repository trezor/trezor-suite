import { Paragraph, NewModal } from '@trezor/components';

import { Translation } from 'src/components/suite';

import { BackupState } from '../../reducers/backup/backupReducer';

export const BackupStepError = ({
    onCancel,
    backup,
}: {
    onCancel: () => void;
    backup: BackupState;
}) => {
    return (
        <NewModal
            onCancel={onCancel}
            variant="warning"
            iconName="warning"
            data-testid="@backup"
            heading={<Translation id="TOAST_BACKUP_FAILED" />}
            description={undefined} // Error state has no Step description
            bottomContent={
                <NewModal.Button onClick={() => onCancel()} data-testid="@backup/close-button">
                    <Translation id="TR_CLOSE" />
                </NewModal.Button>
            }
        >
            <Paragraph data-testid="@backup/error-message" typographyStyle="highlight">
                {backup.error}
            </Paragraph>
        </NewModal>
    );
};
