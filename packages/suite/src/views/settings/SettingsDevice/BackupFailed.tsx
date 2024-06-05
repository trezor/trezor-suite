import { HELP_CENTER_RECOVERY_ISSUES_URL } from '@trezor/urls';

import { SettingsSectionItem } from 'src/components/settings';
import { ActionButton, ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';

export const BackupFailed = () => {
    return (
        <SettingsSectionItem anchorId={SettingsAnchor.BackupFailed}>
            <TextColumn
                title={<Translation id="TR_BACKUP_RECOVERY_SEED_FAILED_TITLE" />}
                description={<Translation id="TR_BACKUP_RECOVERY_SEED_FAILED_DESC" />}
                buttonLink={HELP_CENTER_RECOVERY_ISSUES_URL}
            />
            <ActionColumn>
                <ActionButton isDisabled>
                    <Translation id="TR_BACKUP_FAILED" />
                </ActionButton>
            </ActionColumn>
        </SettingsSectionItem>
    );
};
