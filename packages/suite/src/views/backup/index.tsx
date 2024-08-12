import styled from 'styled-components';

import { Paragraph, Button, Image, Row } from '@trezor/components';
import { HELP_CENTER_RECOVERY_ISSUES_URL } from '@trezor/urls';
import { selectDevice } from '@suite-common/wallet-core';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { backupDevice } from 'src/actions/backup/backupActions';
import { changePin } from 'src/actions/settings/deviceSettingsActions';
import { Loading, Translation, TrezorLink, Modal } from 'src/components/suite';
import { PreBackupCheckboxes, AfterBackupCheckboxes } from 'src/components/backup';
import { canStart, canContinue } from 'src/utils/backup';
import { selectLocks } from 'src/reducers/suite/suiteReducer';
import type { ForegroundAppProps } from 'src/types/suite';
import type { BackupStatus } from 'src/actions/backup/backupActions';
import { selectBackup } from 'src/reducers/backup/backupReducer';

const StyledButton = styled(Button)`
    width: 224px;
`;

const StyledP = styled(Paragraph)`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const StyledImage = styled(Image)`
    margin-bottom: 24px;
    align-self: center;
`;

const VerticalCenter = styled.div`
    margin-top: auto;
    margin-bottom: auto;
`;

const FinishedModal = styled(Modal)`
    min-height: 620px;
`;

const StyledModal = styled(Modal)`
    min-height: 650px;
`;

type CloseButtonProps = {
    onClick: () => void;
    variant: 'TR_CLOSE' | 'TR_CANCEL' | 'TR_SKIP_PIN';
};

const CloseButton = ({ onClick, variant }: CloseButtonProps) => (
    <StyledButton
        onClick={onClick}
        data-testid="@backup/close-button"
        variant="tertiary"
        icon="CROSS"
    >
        <Translation id={variant} />
    </StyledButton>
);

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

export const Backup = ({ cancelable, onCancel }: ForegroundAppProps) => {
    const device = useSelector(selectDevice);
    const backup = useSelector(selectBackup);
    const locks = useSelector(selectLocks);

    const dispatch = useDispatch();

    const nonErrorBackupStatuses = ['initial', 'in-progress', 'finished'] as const;
    const isDeviceUnavailable = !device || !device.features || !device.connected;
    const currentProgressBarStep = nonErrorBackupStatuses.some(status => status === backup.status)
        ? nonErrorBackupStatuses.findIndex(s => s === backup.status) + 1
        : undefined;

    if (isDeviceUnavailable) {
        return (
            <Modal
                heading={<Translation id="TR_RECONNECT_HEADER" />}
                isCancelable
                onCancel={onCancel}
                data-testid="@backup/no-device"
            >
                <StyledImage image="CONNECT_DEVICE" width="360" />
            </Modal>
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
            <FinishedModal
                isCancelable
                onCancel={onCancel}
                heading={getEdgeCaseModalHeading(device.features.unfinished_backup)}
                bottomBarComponents={<CloseButton onClick={onCancel} variant="TR_CLOSE" />}
            >
                {device.features.unfinished_backup ? (
                    <VerticalCenter>
                        <StyledImage image="UNI_ERROR" />
                        <StyledP data-testid="@backup/already-failed-message">
                            <Translation id="BACKUP_BACKUP_ALREADY_FAILED_DESCRIPTION" />
                            <TrezorLink icon="EXTERNAL_LINK" href={HELP_CENTER_RECOVERY_ISSUES_URL}>
                                <Translation id="TR_LEARN_MORE" />
                            </TrezorLink>
                        </StyledP>
                    </VerticalCenter>
                ) : (
                    <VerticalCenter>
                        <StyledImage image="UNI_SUCCESS" />
                        <StyledP data-testid="@backup/already-finished-message">
                            <Translation id="BACKUP_BACKUP_ALREADY_FINISHED_DESCRIPTION" />
                        </StyledP>
                    </VerticalCenter>
                )}
            </FinishedModal>
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
        <StyledModal
            isCancelable={cancelable}
            onCancel={onCancel}
            data-testid="@backup"
            heading={getModalHeading(backup.status)}
            totalProgressBarSteps={nonErrorBackupStatuses.length}
            currentProgressBarStep={currentProgressBarStep}
            bottomBarComponents={
                <>
                    {backup.status === 'initial' && (
                        <>
                            <StyledButton
                                data-testid="@backup/start-button"
                                onClick={() => dispatch(backupDevice(backupParams))}
                                isDisabled={!canStart(backup.userConfirmed, locks)}
                            >
                                <Translation id="TR_CREATE_BACKUP" />
                            </StyledButton>
                            <CloseButton onClick={onCancel} variant="TR_CANCEL" />
                        </>
                    )}

                    {backup.status === 'finished' && (
                        <>
                            {device?.features?.pin_protection ? (
                                <StyledButton
                                    isDisabled={!canContinue(backup.userConfirmed)}
                                    onClick={() => onCancel()}
                                >
                                    <Translation id="TR_CLOSE" />
                                </StyledButton>
                            ) : (
                                <>
                                    <CloseButton onClick={onCancel} variant="TR_SKIP_PIN" />
                                    <StyledButton
                                        data-testid="@backup/continue-to-pin-button"
                                        isDisabled={!canContinue(backup.userConfirmed)}
                                        onClick={() => {
                                            onCancel();
                                            dispatch(changePin({}));
                                        }}
                                    >
                                        <Translation id="TR_CONTINUE_TO_PIN" />
                                    </StyledButton>
                                </>
                            )}
                        </>
                    )}

                    {backup.status === 'error' && (
                        <CloseButton onClick={onCancel} variant="TR_CLOSE" />
                    )}
                </>
            }
        >
            {backup.status === 'initial' && (
                <>
                    <StyledP typographyStyle="hint">
                        <Translation id="TR_BACKUP_SUBHEADING_1" />
                    </StyledP>
                    <PreBackupCheckboxes />
                </>
            )}

            {backup.status === 'in-progress' && <Loading />}

            {backup.status === 'finished' && (
                <>
                    <StyledP typographyStyle="hint" data-testid="@backup/success-message">
                        <Translation id="TR_BACKUP_FINISHED_TEXT" />
                    </StyledP>
                    <AfterBackupCheckboxes />
                </>
            )}

            {backup.status === 'error' && (
                <Row justifyContent="center">
                    <VerticalCenter>
                        <StyledImage image="UNI_ERROR" />
                        <StyledP data-testid="@backup/error-message">{backup.error}</StyledP>
                    </VerticalCenter>
                </Row>
            )}
        </StyledModal>
    );
};
