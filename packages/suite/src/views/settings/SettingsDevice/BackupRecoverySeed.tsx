import { HELP_CENTER_RECOVERY_SEED_URL } from '@trezor/urls';

import { goto } from 'src/actions/suite/routerActions';
import { SettingsSectionItem } from 'src/components/settings';
import { ActionButton, ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDevice, useDispatch } from 'src/hooks/suite';

interface BackupRecoverySeedProps {
    isDeviceLocked: boolean;
}

export const BackupRecoverySeed = ({ isDeviceLocked }: BackupRecoverySeedProps) => {
    const dispatch = useDispatch();
    const { device } = useDevice();

    const needsBackup = device?.features?.backup_availability === 'Required';

    const handleClick = () => dispatch(goto('backup-index', { params: { cancelable: true } }));

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.BackupRecoverySeed}>
            <TextColumn
                title={<Translation id="TR_BACKUP_RECOVERY_SEED" />}
                description={<Translation id="TR_BACKUP_SUBHEADING_1" />}
                buttonLink={HELP_CENTER_RECOVERY_SEED_URL}
            />
            <ActionColumn>
                <ActionButton
                    data-testid="@settings/device/create-backup-button"
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
        </SettingsSectionItem>
    );
};
