import { ReactNode } from 'react';

import { Image, Column, NewModal, Text } from '@trezor/components';
import { HELP_CENTER_RECOVERY_ISSUES_URL } from '@trezor/urls';
import { isDeviceAcquired } from '@suite-common/suite-utils';
import { selectSelectedDevice } from '@suite-common/wallet-core';

import { useSelector } from 'src/hooks/suite';
import { Translation, TrezorLink } from 'src/components/suite';
import type { ForegroundAppProps } from 'src/types/suite';
import { BackupState } from 'src/reducers/backup/backupReducer';

import { BackupStep1Initial } from './BackupStep1Initial';
import { BackupStep2InProgress } from './BackupStep2InProgress';
import { BackupStep3Finished } from './BackupStep3Finished';
import { BackupStepError } from './BackupStepError';

const getEdgeCaseModalHeading = (unfinishedBackup: boolean) => {
    if (unfinishedBackup) {
        return <Translation id="BACKUP_BACKUP_ALREADY_FAILED_HEADING" />;
    }

    // if backup finished
    return <Translation id="BACKUP_BACKUP_ALREADY_FINISHED_HEADING" />;
};

export const Backup = ({
    onCancel,
}: ForegroundAppProps): NonNullable<ReactNode> /* NonNullable return type is required here to prevent default return from switch-case */ => {
    const device = useSelector(selectSelectedDevice);
    // const backup = useSelector(selectBackup);

    const backup: BackupState = {
        status: 'finished',
        userConfirmed: [],
    };

    const isDeviceUnavailable = !isDeviceAcquired(device) || !device.connected;

    if (isDeviceUnavailable) {
        return (
            <NewModal
                heading={<Translation id="TR_RECONNECT_HEADER" />}
                onCancel={onCancel}
                data-testid="@backup/no-device"
            >
                <Column alignItems="center">
                    <Image image="CONNECT_DEVICE" width="360" />
                </Column>
            </NewModal>
        );
    }

    /*
        Edge case, user disconnected the device he was doing backup initially with and connected another device
        with backup finished or failed. Either way, there is no way.
    */
    if (
        backup.status !== 'finished' &&
        !backup.error &&
        device.features.backup_availability !== 'Required' &&
        device.features.unfinished_backup !== null
    ) {
        return (
            <NewModal
                onCancel={onCancel}
                heading={getEdgeCaseModalHeading(device.features.unfinished_backup)}
                iconName={device.features.unfinished_backup ? 'warning' : 'check'}
                variant={device.features.unfinished_backup ? 'warning' : 'primary'}
                bottomContent={
                    <NewModal.Button onClick={() => onCancel()} data-testid="@backup/close-button">
                        <Translation id="TR_CLOSE" />
                    </NewModal.Button>
                }
            >
                {device.features.unfinished_backup ? (
                    <Text variant="tertiary" data-testid="@backup/already-failed-message">
                        <Translation id="BACKUP_BACKUP_ALREADY_FAILED_DESCRIPTION" />
                        <TrezorLink icon="arrowUpRight" href={HELP_CENTER_RECOVERY_ISSUES_URL}>
                            <Translation id="TR_LEARN_MORE" />
                        </TrezorLink>
                    </Text>
                ) : (
                    <Text variant="tertiary" data-testid="@backup/already-finished-message">
                        <Translation id="BACKUP_BACKUP_ALREADY_FINISHED_DESCRIPTION" />
                    </Text>
                )}
            </NewModal>
        );
    }

    switch (backup.status) {
        case 'initial':
            return <BackupStep1Initial onCancel={onCancel} backup={backup} />;
        case 'in-progress':
            return <BackupStep2InProgress onCancel={onCancel} backup={backup} />;
        case 'finished':
            return <BackupStep3Finished onCancel={onCancel} backup={backup} />;
        case 'error':
            return <BackupStepError onCancel={onCancel} backup={backup} />;
    }
};
