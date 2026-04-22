import { Translation } from '@suite/intl';
import { Anchor, SettingsAnchor, goto } from '@suite/router';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';
import { HELP_CENTER_RECOVERY_SEED_URL } from '@trezor/urls';

import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';
import { useDevice, useDispatch } from 'src/hooks/suite';

interface BackupRecoverySeedProps {
    isDeviceLocked: boolean;
}

export const BackupRecoverySeed = ({ isDeviceLocked }: BackupRecoverySeedProps) => {
    const dispatch = useDispatch();
    const { device } = useDevice();

    const needsBackup = device?.features?.backup_availability === 'Required';

    const handleClick = () =>
        dispatch(goto({ routeName: 'backup-index', params: { cancelable: true } }));

    if (!needsBackup) return null;

    return (
        <Anchor anchorId={SettingsAnchor.BackupRecoverySeed}>
            {({ anchorId, anchorRef, shouldHighlight }) => (
                <SectionItem
                    data-testid={anchorId}
                    ref={anchorRef}
                    shouldHighlight={shouldHighlight}
                >
                    <TextColumn
                        title={<Translation id="TR_BACKUP_RECOVERY_SEED" />}
                        description={<Translation id="TR_BACKUP_SUBHEADING_1" />}
                        bottomContent={<LearnMoreButton url={HELP_CENTER_RECOVERY_SEED_URL} />}
                    />
                    <ActionColumn>
                        <ActionButton
                            data-testid="@settings/device/create-backup-button"
                            onClick={handleClick}
                            isDisabled={isDeviceLocked}
                            isTooltipActive={isDeviceLocked}
                            tooltipContent={
                                <Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />
                            }
                        >
                            <Translation id="TR_CREATE_BACKUP" />
                        </ActionButton>
                    </ActionColumn>
                </SectionItem>
            )}
        </Anchor>
    );
};
