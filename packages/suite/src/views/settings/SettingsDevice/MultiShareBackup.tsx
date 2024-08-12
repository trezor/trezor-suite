import { HELP_CENTER_MULTI_SHARE_BACKUP_URL } from '@trezor/urls';
import {
    ActionButton,
    ActionColumn,
    SectionItem,
    TextColumn,
    Translation,
} from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectDevice } from '@suite-common/wallet-core';
import { TrezorDevice } from '@suite-common/suite-types';
import { goto } from '../../../actions/suite/routerActions';
import { EventType, analytics } from '@trezor/suite-analytics';

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
    const device = useSelector(selectDevice);
    const dispatch = useDispatch();

    // "NotAvailable" means, that backup has been already done and thus is not available.
    const isBackupDone = device?.features?.backup_availability === 'NotAvailable';

    if (!doesSupportMultiShare(device) || !isBackupDone) {
        return;
    }

    const handleClick = () => {
        analytics.report({
            type: EventType.SettingsMultiShareBackup,
            payload: { action: 'start' },
        });

        dispatch(goto('create-multi-share-backup'));
    };

    return (
        <SectionItem>
            <TextColumn
                title={<Translation id="TR_MULTI_SHARE_BACKUP" />}
                description={<Translation id="TR_MULTI_SHARE_BACKUP_DESCRIPTION" />}
                buttonLink={HELP_CENTER_MULTI_SHARE_BACKUP_URL}
            />
            <ActionColumn>
                <ActionButton
                    variant="secondary"
                    data-testid="@settings/device/create-multi-share-backup-button"
                    onClick={handleClick}
                    isDisabled={isDeviceLocked}
                >
                    <Translation id="TR_CREATE_MULTI_SHARE_BACKUP" />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
