import { HELP_CENTER_RECOVERY_SEED_URL } from '@trezor/urls';

import {
    ActionButton,
    ActionColumn,
    SectionItem,
    TextColumn,
    Translation,
} from 'src/components/suite';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';

interface BackupRecoverySeedProps {
    isDeviceLocked: boolean;
}

export const BackupRecoverySeed = ({ isDeviceLocked }: BackupRecoverySeedProps) => {
    const dispatch = useDispatch();
    const { device } = useDevice();
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.BackupRecoverySeed);

    const needsBackup = !!device?.features?.needs_backup;

    const handleClick = () => dispatch(goto('backup-index', { params: { cancelable: true } }));

    return (
        <SectionItem
            data-test-id="@settings/device/backup-recovery-seed"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
            <TextColumn
                title={<Translation id="TR_BACKUP_RECOVERY_SEED" />}
                description={<Translation id="TR_BACKUP_SUBHEADING_1" />}
                buttonLink={HELP_CENTER_RECOVERY_SEED_URL}
            />
            <ActionColumn>
                <ActionButton
                    data-test-id="@settings/device/create-backup-button"
                    onClick={handleClick}
                    isDisabled={isDeviceLocked || !needsBackup}
                >
                    {needsBackup ? (
                        <Translation id="TR_CREATE_BACKUP" />
                    ) : (
                        <Translation id="TR_BACKUP_SUCCESSFUL" />
                    )}
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
