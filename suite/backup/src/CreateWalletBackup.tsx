import { useSelector } from 'react-redux';

import styled from 'styled-components';

import { LearnMoreButton } from '@suite/external-links';
import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { selectIsN4w1BackupEnabled } from '@suite/settings';
import { hasSlip39Backup, isBackupComplete } from '@suite-common/backup';
import { selectSelectedDevice } from '@suite-common/device';
import { useDispatch } from '@suite-common/redux-utils';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';
import { HELP_CENTER_MULTI_SHARE_BACKUP_URL } from '@trezor/urls';

const DisabledWrapper = styled.div<{ $isDisabled: boolean }>`
    ${({ $isDisabled }) => $isDisabled && 'opacity: 0.5;'}
`;

type CreateWalletBackupProps = {
    isDeviceLocked: boolean;
};

export const CreateWalletBackup = ({ isDeviceLocked }: CreateWalletBackupProps) => {
    const device = useSelector(selectSelectedDevice);
    const dispatch = useDispatch();
    const isN4w1BackupEnabled = useSelector(selectIsN4w1BackupEnabled);

    const features = device?.features;
    const isBackupDone = features !== undefined && isBackupComplete(features);
    const canExtendBackup = features !== undefined && hasSlip39Backup(features);

    if (!isN4w1BackupEnabled || !canExtendBackup) {
        return null;
    }

    const isActionDisabled = isDeviceLocked || !isBackupDone;

    const handleClick = () => {
        dispatch(gotoThunk({ routeName: 'create-wallet-backup' }));
    };

    return (
        <DisabledWrapper $isDisabled={!isBackupDone}>
            <SectionItem>
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
                        tooltipContent={
                            <Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />
                        }
                    >
                        <Translation id="TR_CREATE_NEW_WALLET_BACKUP" />
                    </ActionButton>
                </ActionColumn>
            </SectionItem>
        </DisabledWrapper>
    );
};
