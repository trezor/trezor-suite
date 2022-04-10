import React from 'react';
import styled from 'styled-components';
import { P, Button } from '@trezor/components';
import { useSelector, useActions } from '@suite-hooks';
import * as backupActions from '@backup-actions/backupActions';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import { Loading, Image, Translation, TrezorLink, Modal } from '@suite-components';
import { PreBackupCheckboxes, AfterBackupCheckboxes } from '@backup-components';
import { canStart, canContinue } from '@backup-utils';
import { FAILED_BACKUP_URL } from '@suite-constants/urls';

import type { InjectedModalApplicationProps } from '@suite-types';
import type { BackupStatus } from '@backup-actions/backupActions';

const StyledButton = styled(Button)`
    width: 224px;
`;

const StyledP = styled(P)`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const StyledImage = styled(Image)`
    margin-bottom: 24px;
    align-self: center;
`;

const VerticalCenter = styled.div`
    margin-top: auto;
    margin-bottom: auto;
`;

const NestedModal = styled(Modal)`
    height: 620px;
    ${Modal.Content} {
        justify-content: center;
        align-items: center;
    }
`;

const FinishedModal = styled(Modal)`
    min-height: 620px;
`;

const StyledModal = styled(Modal)`
    min-height: 650px;
`;

const SmallModal = styled(Modal)`
    width: 600px;
`;

type CloseButtonProps = {
    onClick: () => void;
    variant: 'TR_CLOSE' | 'TR_CANCEL' | 'TR_SKIP_PIN';
};

const CloseButton = ({ onClick, variant }: CloseButtonProps) => (
    <StyledButton
        onClick={onClick}
        data-test="@backup/close-button"
        variant="secondary"
        icon="CROSS"
    >
        <Translation id={variant} />
    </StyledButton>
);

const getModalHeading = (backupStatus: BackupStatus) => {
    if (backupStatus === 'initial') {
        return <Translation id="TR_CREATE_BACKUP" />;
    }

    if (backupStatus === 'finished') {
        return <Translation id="TR_BACKUP_CREATED" />;
    }

    if (backupStatus === 'error') {
        return <Translation id="TOAST_BACKUP_FAILED" />;
    }
    return null;
};

const getEdgeCaseModalHeading = (unfinishedBackup: boolean) => {
    if (unfinishedBackup) {
        return <Translation id="BACKUP_BACKUP_ALREADY_FAILED_HEADING" />;
    }

    // if backup finished
    return <Translation id="BACKUP_BACKUP_ALREADY_FINISHED_HEADING" />;
};

const Backup = ({ closeModalApp, modal, cancelable, onCancel }: InjectedModalApplicationProps) => {
    const { device, backup, locks } = useSelector(state => ({
        device: state.suite.device,
        backup: state.backup,
        locks: state.suite.locks,
    }));
    const actions = useActions({
        backupDevice: backupActions.backupDevice,
        changePin: deviceSettingsActions.changePin,
    });

    const onClose = () => closeModalApp();

    const nonErrorBackupStatuses = ['initial', 'in-progress', 'finished'] as const;

    if (modal) {
        // modal is shown as standalone not inner modal as expected
        return (
            <NestedModal isCancelable={cancelable} onCancel={onCancel}>
                {modal}
            </NestedModal>
        );
    }

    if (!device || !device.features || !device.connected) {
        return (
            <SmallModal
                heading={<Translation id="TR_RECONNECT_HEADER" />}
                isCancelable={cancelable}
                onCancel={onCancel}
                data-test="@backup/no-device"
                bottomBar={<CloseButton onClick={onClose} variant="TR_CLOSE" />}
            >
                <StyledImage image="CONNECT_DEVICE" width="360" />
            </SmallModal>
        );
    }

    /*
        Edge case, user disconnected the device he was doing backup initially with and connected another device
        with backup finished or failed. Either way, there is no way.
    */
    if (
        backup.status !== 'finished' &&
        !backup.error &&
        device.features.needs_backup === false &&
        device.features.unfinished_backup !== null
    ) {
        return (
            <FinishedModal
                isCancelable
                onCancel={onCancel}
                heading={getEdgeCaseModalHeading(device.features.unfinished_backup)}
                bottomBar={<CloseButton onClick={onClose} variant="TR_CLOSE" />}
            >
                {device.features.unfinished_backup ? (
                    <VerticalCenter>
                        <StyledImage image="UNI_ERROR" />
                        <StyledP data-test="@backup/already-failed-message">
                            <Translation id="BACKUP_BACKUP_ALREADY_FAILED_DESCRIPTION" />
                            <TrezorLink icon="EXTERNAL_LINK" href={FAILED_BACKUP_URL}>
                                <Translation id="TR_LEARN_MORE" />
                            </TrezorLink>
                        </StyledP>
                    </VerticalCenter>
                ) : (
                    <VerticalCenter>
                        <StyledImage image="UNI_SUCCESS" />
                        <StyledP data-test="@backup/already-finished-message">
                            <Translation id="BACKUP_BACKUP_ALREADY_FINISHED_DESCRIPTION" />
                        </StyledP>
                    </VerticalCenter>
                )}
            </FinishedModal>
        );
    }

    return (
        <StyledModal
            isCancelable={cancelable}
            onCancel={onCancel}
            data-test="@backup"
            heading={getModalHeading(backup.status)}
            totalProgressBarSteps={nonErrorBackupStatuses.length}
            currentProgressBarStep={nonErrorBackupStatuses.findIndex(s => s === backup.status) + 1}
            bottomBar={
                <>
                    {backup.status === 'initial' && (
                        <>
                            <CloseButton onClick={onClose} variant="TR_CANCEL" />
                            <StyledButton
                                data-test="@backup/start-button"
                                onClick={() => actions.backupDevice()}
                                isDisabled={!canStart(backup.userConfirmed, locks)}
                            >
                                <Translation id="TR_CREATE_BACKUP" />
                            </StyledButton>
                        </>
                    )}
                    {backup.status === 'finished' && (
                        <>
                            {device?.features?.pin_protection ? (
                                <StyledButton
                                    isDisabled={!canContinue(backup.userConfirmed)}
                                    onClick={onClose}
                                >
                                    <Translation id="TR_CLOSE" />
                                </StyledButton>
                            ) : (
                                <>
                                    <CloseButton onClick={onClose} variant="TR_SKIP_PIN" />
                                    <StyledButton
                                        data-test="@backup/continue-to-pin-button"
                                        isDisabled={!canContinue(backup.userConfirmed)}
                                        onClick={() => {
                                            onClose();
                                            actions.changePin({});
                                        }}
                                    >
                                        <Translation id="TR_CONTINUE_TO_PIN" />
                                    </StyledButton>
                                </>
                            )}
                        </>
                    )}
                    {backup.status === 'error' && (
                        <CloseButton onClick={onClose} variant="TR_CLOSE" />
                    )}
                </>
            }
        >
            {backup.status === 'initial' && (
                <>
                    <StyledP size="small">
                        <Translation id="TR_BACKUP_SUBHEADING_1" />
                    </StyledP>
                    <PreBackupCheckboxes />
                </>
            )}

            {backup.status === 'in-progress' && <Loading />}

            {backup.status === 'finished' && (
                <>
                    <StyledP data-test="@backup/success-message">
                        <Translation id="TR_BACKUP_FINISHED_TEXT" />
                    </StyledP>
                    <AfterBackupCheckboxes />
                </>
            )}
            {backup.status === 'error' && (
                <VerticalCenter>
                    <StyledImage image="UNI_ERROR" />
                    <StyledP data-test="@backup/error-message">{backup.error}</StyledP>
                </VerticalCenter>
            )}
        </StyledModal>
    );
};

export default Backup;
