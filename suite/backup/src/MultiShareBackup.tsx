import { useSelector } from 'react-redux';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { LearnMoreButton } from '@suite/external-links';
import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { selectIsN4w1BackupEnabled } from '@suite/settings';
import { doesSupportMultiShare } from '@suite-common/backup';
import { useServices } from '@suite-common/dependency-injection';
import { selectSelectedDevice } from '@suite-common/device';
import { useDispatch } from '@suite-common/redux-utils';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';
import { HELP_CENTER_MULTI_SHARE_BACKUP_URL } from '@trezor/urls';

export const MultiShareBackup = ({ isDeviceLocked }: { isDeviceLocked: boolean }) => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const device = useSelector(selectSelectedDevice);
    const dispatch = useDispatch();
    const isN4w1BackupEnabled = useSelector(selectIsN4w1BackupEnabled);
    const isBackupRequired = device?.features?.backup_availability === 'Required';

    // When N4W1 backup is enabled, multi-share backup is replaced by the NFC-based
    // additional backup flow (CreateWalletBackup), which uses a different backup method.
    if (
        isN4w1BackupEnabled ||
        !device?.features ||
        !doesSupportMultiShare(device.features) ||
        isBackupRequired
    ) {
        return;
    }

    const handleClick = () => {
        analytics.report({
            type: events.settingsDeviceMultiShareBackupEvent.name,
            payload: { action: 'start' },
        });

        dispatch(gotoThunk({ routeName: 'create-multi-share-backup' }));
    };

    return (
        <SectionItem>
            <TextColumn
                title={<Translation id="TR_MULTI_SHARE_BACKUP" />}
                description={<Translation id="TR_MULTI_SHARE_BACKUP_DESCRIPTION" />}
                bottomContent={<LearnMoreButton url={HELP_CENTER_MULTI_SHARE_BACKUP_URL} />}
            />
            <ActionColumn>
                <ActionButton
                    intent="brand"
                    data-testid="@settings/device/create-multi-share-backup-button"
                    onClick={handleClick}
                    isDisabled={isDeviceLocked}
                    isTooltipActive={isDeviceLocked}
                    tooltipContent={<Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />}
                >
                    <Translation id="TR_CREATE_MULTI_SHARE_BACKUP" />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
