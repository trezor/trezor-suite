import { Translation } from '@suite/intl';
import { SettingsAnchor } from '@suite/router';
import { ActionButton, ActionColumn, TextColumn } from '@trezor/product-components';
import { HELP_CENTER_RECOVERY_ISSUES_URL } from '@trezor/urls';

import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';

export const BackupFailed = () => (
    <SettingsSectionItem anchorId={SettingsAnchor.BackupFailed}>
        <TextColumn
            title={<Translation id="TR_BACKUP_RECOVERY_SEED_FAILED_TITLE" />}
            description={<Translation id="TR_BACKUP_RECOVERY_SEED_FAILED_DESC" />}
            bottomContent={
                <LearnMoreButton
                    url={HELP_CENTER_RECOVERY_ISSUES_URL}
                    data-testid="@device-settings/backup-failed/learn-more-button"
                />
            }
            data-testid="@device-settings/backup-failed"
        />
        <ActionColumn>
            <ActionButton isDisabled data-testid="@device-settings/backup-failed/disabled-button">
                <Translation id="TR_CREATE_BACKUP" />
            </ActionButton>
        </ActionColumn>
    </SettingsSectionItem>
);
