import React from 'react';
import styled from 'styled-components';
import { P, Button, ButtonProps } from '@trezor/components';
import { useSelector, useActions } from '@suite-hooks';
import * as backupActions from '@backup-actions/backupActions';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import { Loading, Image, Translation, ExternalLink, Modal } from '@suite-components';
import { PreBackupCheckboxes, AfterBackupCheckboxes } from '@backup-components';
import { canStart, canContinue } from '@backup-utils';
import { FAILED_BACKUP_URL } from '@suite-constants/urls';
import type { InjectedModalApplicationProps } from '@suite-types';

const Row = styled.div`
    display: flex;
    flex-direction: row;
`;

const Col = styled.div`
    display: flex;
    flex-direction: column;
`;

const Buttons = styled(Row)`
    justify-content: center;
    margin-top: auto;
`;

const StyledButton = styled(Button)`
    min-width: 224px;
    margin-bottom: 16px;
`;

const StyledP = styled(P)`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const StyledImage = styled(Image)`
    margin: auto;
    margin-bottom: 24px;
`;

const CloseButton = (props: ButtonProps) => (
    <StyledButton {...props} data-test="@backup/close-button" variant="tertiary" icon="CROSS">
        {props.children ? props.children : <Translation id="TR_CLOSE" />}
    </StyledButton>
);

type BACKUP_STATUS = 'initial' | 'in-progress' | 'finished';

const getModalHeading = (backupStatus: BACKUP_STATUS, backupError: any) => {
    if (backupStatus === 'initial') {
        return <Translation id="TR_CREATE_BACKUP" />;
    }

    if (backupStatus === 'finished' && !backupError) {
        return <Translation id="TR_BACKUP_CREATED" />;
    }

    if (backupStatus === 'finished' && backupError) {
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

const Backup = (props: InjectedModalApplicationProps) => {
    const { device, backup, locks } = useSelector(state => ({
        device: state.suite.device,
        backup: state.backup,
        locks: state.suite.locks,
    }));
    const actions = useActions({
        backupDevice: backupActions.backupDevice,
        changePin: deviceSettingsActions.changePin,
    });

    const { closeModalApp, modal } = props;
    const onClose = () => closeModalApp();

    const backupStatuses = ['initial', 'in-progress', 'finished'] as const;

    if (modal) {
        // modal is shown as standalone not inner modal as expected
        return (
            <Modal
                cancelable={props.cancelable}
                onCancel={props.onCancel}
                useFixedHeight
                centerContent
            >
                {modal}
            </Modal>
        );
    }

    if (!device || !device.features || !device.connected) {
        return (
            <Modal
                size="small"
                heading={<Translation id="TR_RECONNECT_HEADER" />}
                cancelable={props.cancelable}
                onCancel={props.onCancel}
                data-test="@backup/no-device"
            >
                <StyledImage image="CONNECT_DEVICE" width="360" />
                <Buttons>
                    <CloseButton onClick={onClose} />
                </Buttons>
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
        device.features.needs_backup === false &&
        device.features.unfinished_backup !== null
    ) {
        return (
            <Modal
                useFixedHeight
                cancelable
                onCancel={props.onCancel}
                heading={getEdgeCaseModalHeading(device.features.unfinished_backup)}
            >
                {!device.features.unfinished_backup && (
                    <>
                        <StyledImage image="UNI_SUCCESS" />
                        <StyledP data-test="@backup/already-finished-message">
                            <Translation id="BACKUP_BACKUP_ALREADY_FINISHED_DESCRIPTION" />
                        </StyledP>
                    </>
                )}
                {device.features.unfinished_backup && (
                    <>
                        <StyledImage image="UNI_ERROR" />
                        <StyledP data-test="@backup/already-failed-message">
                            <Translation id="BACKUP_BACKUP_ALREADY_FAILED_DESCRIPTION" />
                            <ExternalLink href={FAILED_BACKUP_URL}>
                                <Translation id="TR_LEARN_MORE" />
                            </ExternalLink>
                        </StyledP>
                    </>
                )}

                <Buttons>
                    <Col>
                        <StyledButton
                            data-test="@backup/close-button"
                            onClick={() => {
                                onClose();
                            }}
                        >
                            <Translation id="TR_CLOSE" />
                        </StyledButton>
                    </Col>
                </Buttons>
            </Modal>
        );
    }

    return (
        <Modal
            useFixedHeight
            fixedHeight={['90vh', '90vh', '650px', '650px']}
            cancelable={props.cancelable}
            onCancel={props.onCancel}
            data-test="@backup"
            heading={getModalHeading(backup.status, backup.error)}
            totalProgressBarSteps={backupStatuses.length}
            currentProgressBarStep={backupStatuses.findIndex(s => s === backup.status) + 1}
        >
            {backup.status === 'initial' && (
                <>
                    <StyledP size="small">
                        <Translation id="TR_BACKUP_SUBHEADING_1" />
                    </StyledP>
                    <PreBackupCheckboxes />
                    <Buttons>
                        <Col>
                            <StyledButton
                                data-test="@backup/start-button"
                                onClick={() => actions.backupDevice()}
                                isDisabled={!canStart(backup.userConfirmed, locks)}
                            >
                                <Translation id="TR_CREATE_BACKUP" />
                            </StyledButton>
                            <CloseButton onClick={onClose}>
                                <Translation id="TR_CANCEL" />
                            </CloseButton>
                        </Col>
                    </Buttons>
                </>
            )}

            {backup.status === 'in-progress' && <Loading noBackground />}

            {backup.status === 'finished' && !backup.error && (
                <>
                    <StyledP data-test="@backup/success-message">
                        <Translation id="TR_BACKUP_FINISHED_TEXT" />
                    </StyledP>
                    <AfterBackupCheckboxes />
                    <Buttons>
                        <Col>
                            {!device.features?.pin_protection && (
                                <>
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
                                    <CloseButton onClick={onClose}>
                                        <Translation id="TR_SKIP_PIN" />
                                    </CloseButton>
                                </>
                            )}
                            {device?.features?.pin_protection && (
                                <StyledButton
                                    isDisabled={!canContinue(backup.userConfirmed)}
                                    onClick={onClose}
                                >
                                    <Translation id="TR_CLOSE" />
                                </StyledButton>
                            )}
                        </Col>
                    </Buttons>
                </>
            )}
            {backup.status === 'finished' && backup.error && (
                <>
                    <StyledImage image="UNI_ERROR" />
                    <StyledP data-test="@backup/error-message">{backup.error}</StyledP>
                    <Buttons>
                        <Col>
                            <CloseButton onClick={onClose} />
                        </Col>
                    </Buttons>
                </>
            )}
        </Modal>
    );
};

export default Backup;
