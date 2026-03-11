import { Translation } from '@suite/intl';
import { SettingsAnchor } from '@suite/router';
import { HELP_CENTER_RECOVERY_ISSUES_URL } from '@trezor/urls';

import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { ActionButton, ActionColumn, TextColumn } from 'src/components/suite';

export const BackupFailed = () => (
    <SettingsSectionItem anchorId={SettingsAnchor.BackupFailed}>
        <TextColumn
            title={<Translation id="TR_BACKUP_RECOVERY_SEED_FAILED_TITLE" />}
            description={<Translation id="TR_BACKUP_RECOVERY_SEED_FAILED_DESC" />}
            buttonLink={HELP_CENTER_RECOVERY_ISSUES_URL}
            data-testid="@device-settings/backup-failed"
        />
        <ActionColumn>
            <ActionButton isDisabled data-testid="@device-settings/backup-failed/disabled-button">
                <Translation id="TR_CREATE_BACKUP" />
            </ActionButton>
        </ActionColumn>
    </SettingsSectionItem>
);
