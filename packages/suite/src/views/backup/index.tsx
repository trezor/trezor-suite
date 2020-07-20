import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { bindActionCreators } from 'redux';
import { H2, P, Button, ButtonProps, colors, Modal } from '@trezor/components';
import * as backupActions from '@backup-actions/backupActions';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import { Dispatch, AppState, InjectedModalApplicationProps } from '@suite-types';
import { ProgressBar, Loading, Image, Translation, ExternalLink } from '@suite-components';
import { PreBackupCheckboxes, AfterBackupCheckboxes } from '@backup-components';
import { canStart, canContinue } from '@backup-utils';
import { FAILED_BACKUP_URL } from '@suite-constants/urls';

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
    color: ${colors.BLACK50};
`;

const StyledImage = styled(Image)`
    margin: auto;
`;

const CloseButton = (props: ButtonProps) => (
    <StyledButton {...props} data-test="@backup/close-button" variant="tertiary" icon="CROSS">
        {props.children ? props.children : <Translation id="TR_CLOSE" />}
    </StyledButton>
);

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
    backup: state.backup,
    locks: state.suite.locks,
});

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            backupDevice: backupActions.backupDevice,
            changePin: deviceSettingsActions.changePin,
        },
        dispatch,
    );

type Props = ReturnType<typeof mapDispatchToProps> &
    ReturnType<typeof mapStateToProps> &
    InjectedModalApplicationProps;

const Backup = (props: Props) => {
    const { backup, closeModalApp, modal, backupDevice, locks, device, changePin } = props;
    const onClose = () => closeModalApp();

    const backupStatuses = ['initial', 'in-progress', 'finished'] as const;

    if (modal) {
        // modal is shown as standalone not inner modal as expected
        return (
            <Modal cancelable={props.cancelable} onCancel={props.onCancel} useFixedHeight>
                {modal}
            </Modal>
        );
    }

    if (!device || !device.features || !device.connected) {
        return (
            <Modal
                size="tiny"
                heading={<Translation id="TR_RECONNECT_HEADER" />}
                cancelable={props.cancelable}
                onCancel={props.onCancel}
                data-test="@backup/no-device"
            >
                <StyledImage image="CONNECT_DEVICE" />
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
    if (backup.status !== 'finished' && !backup.error && device.features.needs_backup === false) {
        return (
            <Modal useFixedHeight cancelable onCancel={props.onCancel}>
                {!device.features.unfinished_backup && (
                    <>
                        <H2>
                            <Translation id="BACKUP_BACKUP_ALREADY_FINISHED_HEADING" />
                        </H2>
                        <StyledP data-test="@backup/already-finished-message">
                            <Translation id="BACKUP_BACKUP_ALREADY_FINISHED_DESCRIPTION" />
                        </StyledP>
                        <StyledImage image="UNI_SUCCESS" />
                    </>
                )}
                {device.features.unfinished_backup && (
                    <>
                        <H2>
                            <Translation id="BACKUP_BACKUP_ALREADY_FAILED_HEADING" />
                        </H2>
                        <StyledP data-test="@backup/already-failed-message">
                            <Translation id="BACKUP_BACKUP_ALREADY_FAILED_DESCRIPTION" />
                            <ExternalLink href={FAILED_BACKUP_URL}>
                                <Translation id="TR_LEARN_MORE" />
                            </ExternalLink>
                        </StyledP>
                        <StyledImage image="UNI_ERROR" />
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
            cancelable={props.cancelable}
            onCancel={props.onCancel}
            data-test="@backup"
        >
            <ProgressBar
                showHelp
                total={backupStatuses.length}
                current={backupStatuses.findIndex(s => s === backup.status) + 1}
            />

            <H2>
                {backup.status === 'initial' && <Translation id="TR_CREATE_BACKUP" />}
                {backup.status === 'finished' && !backup.error && (
                    <Translation id="TR_BACKUP_CREATED" />
                )}
                {backup.status === 'finished' && backup.error && (
                    <Translation id="TOAST_BACKUP_FAILED" />
                )}
            </H2>

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
                                onClick={() => backupDevice()}
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
                                            changePin({});
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
                    <StyledP data-test="@backup/error-message">{backup.error}</StyledP>
                    <StyledImage image="UNI_ERROR" />
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

export default connect(mapStateToProps, mapDispatchToProps)(Backup);
