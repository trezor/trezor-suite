import { Paragraph, Image, Column, NewModal } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { HELP_CENTER_RECOVERY_ISSUES_URL } from '@trezor/urls';
import { isDeviceAcquired } from '@suite-common/suite-utils';
import { selectDevice } from '@suite-common/wallet-core';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { backupDevice } from 'src/actions/backup/backupActions';
import { changePin } from 'src/actions/settings/deviceSettingsActions';
import { Loading, Translation, TrezorLink } from 'src/components/suite';
import { PreBackupCheckboxes, AfterBackupCheckboxes } from 'src/components/backup';
import { canStart, canContinue } from 'src/utils/backup';
import { selectLocks } from 'src/reducers/suite/suiteReducer';
import type { ForegroundAppProps } from 'src/types/suite';
import type { BackupStatus } from 'src/actions/backup/backupActions';
import { selectBackup } from 'src/reducers/backup/backupReducer';

const getModalHeading = (backupStatus: BackupStatus) => {
    switch (backupStatus) {
        case 'initial':
            return <Translation id="TR_CREATE_BACKUP" />;
        case 'finished':
            return <Translation id="TR_BACKUP_CREATED" />;
        case 'error':
            return <Translation id="TOAST_BACKUP_FAILED" />;
        default:
            return null;
    }
};

const getEdgeCaseModalHeading = (unfinishedBackup: boolean) => {
    if (unfinishedBackup) {
        return <Translation id="BACKUP_BACKUP_ALREADY_FAILED_HEADING" />;
    }

    // if backup finished
    return <Translation id="BACKUP_BACKUP_ALREADY_FINISHED_HEADING" />;
};

const getModalContent = (backupStatus: BackupStatus, error?: string) => {
    switch (backupStatus) {
        case 'initial':
            return (
                <>
                    <Paragraph
                        variant="tertiary"
                        typographyStyle="hint"
                        margin={{ bottom: spacings.xl }}
                    >
                        <Translation id="TR_BACKUP_SUBHEADING_1" />
                    </Paragraph>
                    <PreBackupCheckboxes />
                </>
            );
        case 'in-progress':
            return <Loading />;
        case 'finished':
            return (
                <>
                    <Paragraph
                        variant="tertiary"
                        typographyStyle="hint"
                        data-testid="@backup/success-message"
                        margin={{ bottom: spacings.xl }}
                    >
                        <Translation id="TR_BACKUP_FINISHED_TEXT" />
                    </Paragraph>
                    <AfterBackupCheckboxes />
                </>
            );
        case 'error':
            return (
                <Paragraph data-testid="@backup/error-message" typographyStyle="highlight">
                    {error}
                </Paragraph>
            );
    }
};

export const Backup = ({ onCancel }: ForegroundAppProps) => {
    const device = useSelector(selectDevice);
    const backup = useSelector(selectBackup);
    const locks = useSelector(selectLocks);
    const dispatch = useDispatch();

    const nonErrorBackupStatuses = ['initial', 'in-progress', 'finished'] as const;
    const isDeviceUnavailable = !isDeviceAcquired(device) || !device.connected;
    const currentProgressBarStep = nonErrorBackupStatuses.some(status => status === backup.status)
        ? nonErrorBackupStatuses.findIndex(s => s === backup.status) + 1
        : undefined;

    if (isDeviceUnavailable) {
        return (
            <NewModal
                heading={<Translation id="TR_RECONNECT_HEADER" />}
                onCancel={onCancel}
                data-testid="@backup/no-device"
            >
                <Column>
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
                    <Paragraph variant="tertiary" data-testid="@backup/already-failed-message">
                        <Translation id="BACKUP_BACKUP_ALREADY_FAILED_DESCRIPTION" />
                        <TrezorLink icon="arrowUpRight" href={HELP_CENTER_RECOVERY_ISSUES_URL}>
                            <Translation id="TR_LEARN_MORE" />
                        </TrezorLink>
                    </Paragraph>
                ) : (
                    <Paragraph variant="tertiary" data-testid="@backup/already-finished-message">
                        <Translation id="BACKUP_BACKUP_ALREADY_FINISHED_DESCRIPTION" />
                    </Paragraph>
                )}
            </NewModal>
        );
    }

    const backupParams: Parameters<typeof backupDevice>[0] =
        device?.features?.backup_type === 'Slip39_Basic' ||
        device?.features?.backup_type === 'Slip39_Basic_Extendable'
            ? {
                  group_threshold: 1,
                  groups: [{ member_count: 1, member_threshold: 1 }],
              }
            : {};

    return (
        <NewModal
            onCancel={onCancel}
            variant={backup.status === 'error' ? 'warning' : 'primary'}
            iconName={backup.status === 'error' ? 'warning' : undefined}
            data-testid="@backup"
            heading={getModalHeading(backup.status)}
            description={
                currentProgressBarStep && (
                    <Translation
                        id="TR_STEP_OF_TOTAL"
                        values={{
                            index: currentProgressBarStep,
                            total: nonErrorBackupStatuses.length,
                        }}
                    />
                )
            }
            bottomContent={(function () {
                switch (backup.status) {
                    case 'initial':
                        return (
                            <>
                                <NewModal.Button
                                    data-testid="@backup/start-button"
                                    onClick={() => dispatch(backupDevice(backupParams))}
                                    isDisabled={!canStart(backup.userConfirmed, locks)}
                                >
                                    <Translation id="TR_CREATE_BACKUP" />
                                </NewModal.Button>
                                <NewModal.Button
                                    onClick={() => onCancel()}
                                    data-testid="@backup/close-button"
                                    variant="tertiary"
                                >
                                    <Translation id="TR_CANCEL" />
                                </NewModal.Button>
                            </>
                        );
                    case 'finished':
                        return (
                            <>
                                {device?.features?.pin_protection ? (
                                    <NewModal.Button
                                        isDisabled={!canContinue(backup.userConfirmed)}
                                        onClick={() => onCancel()}
                                    >
                                        <Translation id="TR_CLOSE" />
                                    </NewModal.Button>
                                ) : (
                                    <>
                                        <NewModal.Button
                                            data-testid="@backup/continue-to-pin-button"
                                            isDisabled={!canContinue(backup.userConfirmed)}
                                            onClick={() => {
                                                onCancel();
                                                dispatch(changePin({}));
                                            }}
                                        >
                                            <Translation id="TR_CONTINUE_TO_PIN" />
                                        </NewModal.Button>
                                        <NewModal.Button
                                            onClick={() => onCancel()}
                                            data-testid="@backup/close-button"
                                            variant="tertiary"
                                        >
                                            <Translation id="TR_SKIP_PIN" />
                                        </NewModal.Button>
                                    </>
                                )}
                            </>
                        );
                    case 'error':
                        return (
                            <NewModal.Button
                                onClick={() => onCancel()}
                                data-testid="@backup/close-button"
                            >
                                <Translation id="TR_CLOSE" />
                            </NewModal.Button>
                        );
                }
            })()}
        >
            {getModalContent(backup.status, backup.error)}
        </NewModal>
    );
};
