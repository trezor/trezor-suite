import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { selectIsN4w1BackupEnabled } from '@suite/settings';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';
import { HELP_CENTER_MULTI_SHARE_BACKUP_URL } from '@trezor/urls';

import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';

interface CreateWalletBackupProps {
    isDeviceLocked: boolean;
}

export const CreateWalletBackup = ({ isDeviceLocked }: CreateWalletBackupProps) => {
    const { device } = useDevice();
    const dispatch = useDispatch();
    const isN4w1BackupEnabled = useSelector(selectIsN4w1BackupEnabled);

    const isBackupDone = device?.features?.backup_availability === 'NotAvailable';
    // BIP39 wordlist backups can't be extended — only SLIP39 variants support additional backups.
    const hasNonWordlistBackup =
        device?.features?.backup_type != null && device.features.backup_type !== 'Bip39';

    if (!isN4w1BackupEnabled || !hasNonWordlistBackup) {
        return null;
    }

    const isActionDisabled = isDeviceLocked || !isBackupDone;

    const handleClick = () => {
        dispatch(goto({ routeName: 'create-wallet-backup' }));
    };

    return (
        <SectionItem style={!isBackupDone ? { opacity: 0.5 } : undefined}>
            <TextColumn
                title={<Translation id="TR_CREATE_NEW_WALLET_BACKUP" />}
                description={<Translation id="TR_CREATE_NEW_WALLET_BACKUP_DESCRIPTION" />}
                bottomContent={<LearnMoreButton url={HELP_CENTER_MULTI_SHARE_BACKUP_URL} />}
            />
            <ActionColumn>
                <ActionButton
                    intent="brand"
                    onClick={handleClick}
                    isDisabled={isActionDisabled}
                    isTooltipActive={isDeviceLocked}
                    tooltipContent={<Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />}
                >
                    <Translation id="TR_CREATE_NEW_WALLET_BACKUP" />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
