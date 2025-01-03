import { Paragraph, NewModal } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { selectSelectedDevice } from '@suite-common/wallet-core';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { changePin } from 'src/actions/settings/deviceSettingsActions';
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
    const device = useSelector(selectSelectedDevice);
    const dispatch = useDispatch();

    return (
        <NewModal
            onCancel={onCancel}
            variant="primary"
            data-testid="@backup"
            heading={<Translation id="TR_BACKUP_CREATED" />}
            description={<BackupStepDescription backupStatus={backup.status} />}
            bottomContent={
                <>
                    {device?.features?.pin_protection ? (
                        <NewModal.Button
                            isDisabled={!canContinue(backup.userConfirmed)}
                            onClick={() => onCancel()}
                        >
                            <Translation id="TR_CLOSE" />
                        </NewModal.Button>
                    ) : (
                        <>
                            <NewModal.Button
                                data-testid="@backup/continue-to-pin-button"
                                isDisabled={!canContinue(backup.userConfirmed)}
                                onClick={() => {
                                    onCancel();
                                    dispatch(changePin({}));
                                }}
                            >
                                <Translation id="TR_CONTINUE_TO_PIN" />
                            </NewModal.Button>
                            <NewModal.Button
                                onClick={() => onCancel()}
                                data-testid="@backup/close-button"
                                variant="tertiary"
                            >
                                <Translation id="TR_SKIP_PIN" />
                            </NewModal.Button>
                        </>
                    )}
                </>
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
