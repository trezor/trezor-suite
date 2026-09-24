import { LearnMoreButton } from '@suite/external-links';
import { Translation } from '@suite/intl';
import { Anchor, SettingsAnchor } from '@suite/router';
import { SectionItem } from '@trezor/product-components';
import { HELP_CENTER_RECOVERY_ISSUES_URL } from '@trezor/urls';

export const BackupFailed = () => (
    <Anchor anchorId={SettingsAnchor.BackupFailed}>
        {({ anchorId, anchorRef, shouldHighlight }) => (
            <SectionItem
                data-testid={anchorId}
                ref={anchorRef}
                shouldHighlight={shouldHighlight}
                title={<Translation id="TR_BACKUP_RECOVERY_SEED_FAILED_TITLE" />}
                description={<Translation id="TR_BACKUP_RECOVERY_SEED_FAILED_DESC" />}
                bottomContent={
                    <LearnMoreButton
                        url={HELP_CENTER_RECOVERY_ISSUES_URL}
                        data-testid="@device-settings/backup-failed/learn-more-button"
                    />
                }
                actions={
                    <SectionItem.Button
                        isDisabled
                        data-testid="@device-settings/backup-failed/disabled-button"
                    >
                        <Translation id="TR_CREATE_BACKUP" />
                    </SectionItem.Button>
                }
            />
        )}
    </Anchor>
);
