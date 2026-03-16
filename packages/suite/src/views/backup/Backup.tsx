import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { selectSelectedDevice } from '@suite-common/device';
import { isDeviceAcquired } from '@suite-common/suite-utils';
import { Column, Image, Modal, Text } from '@trezor/components';
import { HELP_CENTER_RECOVERY_ISSUES_URL } from '@trezor/urls';

import { TrezorLink } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import type { ForegroundAppProps } from 'src/types/suite';

import { BackupStep1Initial } from './BackupStep1Initial';
import { BackupStep2InProgress } from './BackupStep2InProgress';
import { BackupStep3Finished } from './BackupStep3Finished';
import { BackupStepError } from './BackupStepError';
import { selectBackup, selectBackupStatus } from '../../reducers/backup/backupReducer';

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
    const backup = useSelector(selectBackup);
    const backupStatus = useSelector(selectBackupStatus);

    const isDeviceUnavailable = !isDeviceAcquired(device) || !device.connected;

    if (isDeviceUnavailable) {
        return (
            <Modal
                heading={<Translation id="TR_RECONNECT_HEADER" />}
                onCancel={onCancel}
                data-testid="@backup/no-device"
            >
                <Column alignItems="center">
                    <Image image="CONNECT_DEVICE" width="360" />
                </Column>
            </Modal>
        );
    }

    /*
        Edge case, user disconnected the device he was doing backup initially with and connected another device
        with backup finished or failed. Either way, there is no way.
    */
    if (
        backupStatus !== 'finished' &&
        !backup.error &&
        device.features.backup_availability !== 'Required' &&
        device.features.unfinished_backup !== null
    ) {
        return (
            <Modal
                onCancel={onCancel}
                heading={getEdgeCaseModalHeading(device.features.unfinished_backup)}
                iconName={device.features.unfinished_backup ? 'warning' : 'check'}
                intent={device.features.unfinished_backup ? 'warning' : 'brand'}
                bottomContent={
                    <Modal.Button onClick={() => onCancel()} data-testid="@backup/close-button">
                        <Translation id="TR_CLOSE" />
                    </Modal.Button>
                }
            >
                {device.features.unfinished_backup ? (
                    <Text
                        intent="neutral"
                        priority="secondary"
                        data-testid="@backup/already-failed-message"
                    >
                        <Translation id="BACKUP_BACKUP_ALREADY_FAILED_DESCRIPTION" />
                        <TrezorLink href={HELP_CENTER_RECOVERY_ISSUES_URL}>
                            <Translation id="TR_LEARN_MORE" />
                        </TrezorLink>
                    </Text>
                ) : (
                    <Text
                        intent="neutral"
                        priority="secondary"
                        data-testid="@backup/already-finished-message"
                    >
                        <Translation id="BACKUP_BACKUP_ALREADY_FINISHED_DESCRIPTION" />
                    </Text>
                )}
            </Modal>
        );
    }

    switch (backupStatus) {
        case 'initial':
            return <BackupStep1Initial onCancel={onCancel} backup={backup} />;
        case 'in-progress':
            return <BackupStep2InProgress onCancel={onCancel} />;
        case 'finished':
            return <BackupStep3Finished onCancel={onCancel} backup={backup} />;
        case 'error':
            return <BackupStepError onCancel={onCancel} />;
    }
};
