import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { bindActionCreators } from 'redux';

import { H2, P, Button, ButtonProps, colors } from '@trezor/components';
import * as backupActions from '@backup-actions/backupActions';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import { Dispatch, AppState, InjectedModalApplicationProps } from '@suite-types';
import { ProgressBar, Loading } from '@suite-components';
import ModalWrapper from '@suite-components/ModalWrapper';
import { PreBackupCheckboxes, AfterBackupCheckboxes } from '@backup-components';
import { canStart, canContinue } from '@backup-utils';
import { resolveStaticPath } from '@suite-utils/nextjs';

const Wrapper = styled(ModalWrapper)`
    min-height: 80vh;
    min-width: 60vw;
    max-width: 80vw;
    flex-direction: column;
`;

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

const CloseButton = (props: ButtonProps) => (
    <StyledButton {...props} data-test="@backup/close-button" variant="tertiary" icon="CROSS">
        {props.children ? props.children : 'Close'}
    </StyledButton>
);

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
    backup: state.backup,
    locks: state.suite.locks,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    backupDevice: bindActionCreators(backupActions.backupDevice, dispatch),
    changePin: bindActionCreators(deviceSettingsActions.changePin, dispatch),
});

type Props = ReturnType<typeof mapDispatchToProps> &
    ReturnType<typeof mapStateToProps> &
    InjectedModalApplicationProps;

const Backup = (props: Props) => {
    const { backup, closeModalApp, modal, backupDevice, locks, device, changePin } = props;

    const onClose = () => closeModalApp();

    const backupStatuses = ['initial', 'in-progress', 'finished'] as const;

    if (modal) {
        return <Wrapper>{modal}</Wrapper>;
    }

    if (!device || !device.features) {
        return (
            <Wrapper data-test="@backup/no-device">
                <H2>Reconnect your device</H2>
                <img src={resolveStaticPath('images/suite/connect-device.svg')} alt="" />
                <Buttons>
                    <CloseButton onClick={onClose} />
                </Buttons>
            </Wrapper>
        );
    }
    return (
        <Wrapper data-test="@backup">
            <ProgressBar
                showHelp
                total={backupStatuses.length}
                current={backupStatuses.findIndex(s => s === backup.status) + 1}
            />
            {backup.status === 'initial' && (
                <>
                    <H2>Create a backup seed</H2>
                    <StyledP size="small">
                        Backup seed consisting of predefined number of words is the ultimate key to
                        your crypto assets. Trezor will generate the seed for you and it is in your
                        best interrest to write it down and store securely.
                    </StyledP>

                    <PreBackupCheckboxes />
                    <Buttons>
                        <Col>
                            <StyledButton
                                data-test="@backup/start-button"
                                onClick={() => backupDevice()}
                                isDisabled={!canStart(backup.userConfirmed, locks)}
                            >
                                Create backup seed
                            </StyledButton>
                            <CloseButton onClick={onClose}>Cancel backup process</CloseButton>
                        </Col>
                    </Buttons>
                </>
            )}

            {backup.status === 'in-progress' && <Loading />}

            {backup.status === 'finished' && !backup.error && (
                <>
                    <H2>Backup successfully created!</H2>
                    <StyledP data-test="@backup/success-message">
                        Great! Now get out there and hide it properly. Here are some DOs and DON’Ts:
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
                                        Continue to PIN
                                    </StyledButton>
                                    <CloseButton onClick={onClose}>Skip PIN</CloseButton>
                                </>
                            )}
                            {device?.features?.pin_protection && (
                                <StyledButton
                                    isDisabled={!canContinue(backup.userConfirmed)}
                                    onClick={onClose}
                                >
                                    Close
                                </StyledButton>
                            )}
                        </Col>
                    </Buttons>
                </>
            )}
            {backup.status === 'finished' && backup.error && (
                <>
                    <H2>Backup failed!</H2>
                    <StyledP data-test="@backup/error-message">{backup.error}</StyledP>
                    <img src={resolveStaticPath('images/suite/uni-error.svg')} alt="" />
                    <Buttons>
                        <Col>
                            <CloseButton onClick={onClose} />
                        </Col>
                    </Buttons>
                </>
            )}
        </Wrapper>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Backup);
