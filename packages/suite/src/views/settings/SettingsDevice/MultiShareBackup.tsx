import { type DesktopAnalyticsDep, events } from '@suite/analytics';
import { LearnMoreButton } from '@suite/external-links';
import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { selectSelectedDevice } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';
import { HELP_CENTER_MULTI_SHARE_BACKUP_URL } from '@trezor/urls';

import { useDispatch, useSelector } from 'src/hooks/suite';

const doesSupportMultiShare = (device: TrezorDevice | undefined): boolean => {
    if (device?.features === undefined) {
        return false;
    }

    if (!device.features.capabilities?.includes('Capability_Shamir')) {
        return false;
    }

    return (
        device.features.backup_type !== null &&
        [
            'Slip39_Single_Extendable',
            'Slip39_Basic_Extendable',
            'Slip39_Advanced_Extendable',
        ].includes(device.features.backup_type)
    );
};

export const MultiShareBackup = ({ isDeviceLocked }: { isDeviceLocked: boolean }) => {
    const { analytics } = useServices<DesktopAnalyticsDep>();
    const device = useSelector(selectSelectedDevice);
    const dispatch = useDispatch();

    // "NotAvailable" means, that backup has been already done and thus is not available.
    const isBackupDone = device?.features?.backup_availability === 'NotAvailable';

    if (!doesSupportMultiShare(device) || !isBackupDone) {
        return;
    }

    const handleClick = () => {
        analytics.report({
            type: events.settingsDeviceMultiShareBackupEvent.name,
            payload: { action: 'start' },
        });

        dispatch(goto({ routeName: 'create-multi-share-backup' }));
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
