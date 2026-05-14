import { Translation } from '@suite/intl';
import { Anchor, SettingsAnchor } from '@suite/router';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';
import { HELP_CENTER_RECOVERY_ISSUES_URL } from '@trezor/urls';

import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';

export const BackupFailed = () => (
    <Anchor anchorId={SettingsAnchor.BackupFailed}>
        {({ anchorId, anchorRef, shouldHighlight }) => (
            <SectionItem data-testid={anchorId} ref={anchorRef} shouldHighlight={shouldHighlight}>
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
                    <ActionButton
                        isDisabled
                        data-testid="@device-settings/backup-failed/disabled-button"
                    >
                        <Translation id="TR_CREATE_BACKUP" />
                    </ActionButton>
                </ActionColumn>
            </SectionItem>
        )}
    </Anchor>
);
