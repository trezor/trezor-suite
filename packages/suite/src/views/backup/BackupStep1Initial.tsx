import { Paragraph, NewModal } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { selectSelectedDevice } from '@suite-common/wallet-core';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { backupDevice, ConfirmKey } from 'src/actions/backup/backupActions';
import { Translation } from 'src/components/suite';
import { PreBackupCheckboxes } from 'src/components/backup';
import { selectIsDeviceLocked } from 'src/reducers/suite/suiteReducer';

import { BackupState } from '../../reducers/backup/backupReducer';
import { BackupStepDescription } from './BackupStepDescription';

const canStart = (userConfirmed: ConfirmKey[], isDeviceLocked: boolean) =>
    (['has-enough-time', 'is-in-private', 'understands-what-seed-is'] as const).every(e =>
        userConfirmed.includes(e),
    ) && !isDeviceLocked;

export const BackupStep1Initial = ({
    onCancel,
    backup,
}: {
    onCancel: () => void;
    backup: BackupState;
}) => {
    const device = useSelector(selectSelectedDevice);
    const isDeviceLocked = useSelector(selectIsDeviceLocked);
    const dispatch = useDispatch();

    const backupParams: Parameters<typeof backupDevice>[0] =
        device?.features?.backup_type === 'Slip39_Basic' ||
        device?.features?.backup_type === 'Slip39_Basic_Extendable'
            ? {
                  group_threshold: 1,
                  groups: [{ member_count: 1, member_threshold: 1 }],
              }
            : {};

    return (
        <NewModal
            onCancel={onCancel}
            variant="primary"
            data-testid="@backup"
            heading={<Translation id="TR_CREATE_BACKUP" />}
            description={<BackupStepDescription backupStatus={backup.status} />}
            bottomContent={
                <>
                    <NewModal.Button
                        data-testid="@backup/start-button"
                        onClick={() => dispatch(backupDevice(backupParams))}
                        isDisabled={!canStart(backup.userConfirmed, isDeviceLocked)}
                    >
                        <Translation id="TR_CREATE_BACKUP" />
                    </NewModal.Button>
                    <NewModal.Button
                        onClick={() => onCancel()}
                        data-testid="@backup/close-button"
                        variant="tertiary"
                    >
                        <Translation id="TR_CANCEL" />
                    </NewModal.Button>
                </>
            }
        >
            <>
                <Paragraph
                    variant="tertiary"
                    typographyStyle="hint"
                    margin={{ bottom: spacings.xl }}
                >
                    <Translation id="TR_BACKUP_SUBHEADING_1" />
                </Paragraph>
                <PreBackupCheckboxes />
            </>
        </NewModal>
    );
};
