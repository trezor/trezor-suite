import { Translation } from '@suite/intl';
import { selectIsDeviceLocked } from '@suite/locks';
import { selectSelectedDevice } from '@suite-common/device';
import { Modal, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { ConfirmKey, backupDevice } from 'src/actions/backup/backupActions';
import { PreBackupCheckboxes } from 'src/components/backup';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { BackupStepDescription } from './BackupStepDescription';
import { BackupState } from '../../reducers/backup/backupReducer';

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
        <Modal
            onCancel={onCancel}
            intent="brand"
            data-testid="@backup"
            heading={<Translation id="TR_CREATE_BACKUP" />}
            description={<BackupStepDescription />}
            bottomContent={
                <>
                    <Modal.Button
                        data-testid="@backup/start-button"
                        onClick={() => dispatch(backupDevice(backupParams))}
                        isDisabled={!canStart(backup.userConfirmed, isDeviceLocked)}
                    >
                        <Translation id="TR_CREATE_BACKUP" />
                    </Modal.Button>
                    <Modal.Button
                        onClick={() => onCancel()}
                        data-testid="@backup/close-button"
                        intent="neutral"
                        priority="secondary"
                    >
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
        >
            <Paragraph
                intent="neutral"
                priority="secondary"
                typographyStyle="body-sm"
                margin={{ bottom: spacings.xl }}
            >
                <Translation id="TR_BACKUP_SUBHEADING_1" />
            </Paragraph>
            <PreBackupCheckboxes />
        </Modal>
    );
};
