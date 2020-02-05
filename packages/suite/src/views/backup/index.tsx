import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { bindActionCreators } from 'redux';

import { H2, P, Button, colors } from '@trezor/components-v2';
import * as backupActions from '@suite/actions/backup/backupActions';
import { Dispatch, AppState, InjectedModalApplicationProps } from '@suite-types';
import { ProgressBar } from '@suite-components';
import PreBackupCheckboxes from './components/PreBackupCheckboxes';
import AfterBackupCheckboxes from './components/AfterBackupCheckboxes';

const Wrapper = styled.div`
    width: 60vw;
    min-height: 500px;
    display: flex;
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
    width: 226px;
    margin-bottom: 16px;
`;

const StyledP = styled(P)`
    color: ${colors.BLACK50};
`;

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
    backup: state.backup,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    backupDevice: bindActionCreators(backupActions.backupDevice, dispatch),
});

type Props = ReturnType<typeof mapDispatchToProps> &
    ReturnType<typeof mapStateToProps> &
    InjectedModalApplicationProps;

const Backup = (props: Props) => {
    const { backup, closeModalApp, modal, backupDevice } = props;
    const onClose = () => closeModalApp();

    const statesInProgessBar = [
        'checkboxes-before',
        'backup-progress',
        'checkboxes-after',
    ] as const;

    const getCurrentState = (): typeof statesInProgessBar[number] => {
        if (backup.status === 'in-progress') {
            return 'backup-progress';
        }
        if (backup.status === 'finished') {
            return 'checkboxes-after';
        }
        return 'checkboxes-before';
    };

    const checkboxesBefore = [
        'has-enough-time',
        'is-in-private',
        'understands-what-seed-is',
    ] as const;

    const checkboxesAfter = [
        'wrote-seed-properly',
        'made-no-digital-copy',
        'will-hide-seed',
    ] as const;

    return (
        <Wrapper>
            <ProgressBar
                showHelp
                total={statesInProgessBar.length - 1}
                current={statesInProgessBar.findIndex(s => s === getCurrentState())}
            />
            {getCurrentState() === 'checkboxes-before' && (
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
                                isDisabled={
                                    !checkboxesBefore.every(e => backup.userConfirmed.includes(e))
                                }
                            >
                                Create backup seed
                            </StyledButton>
                            <Button
                                data-test="@backup/close-button"
                                icon="CROSS"
                                variant="tertiary"
                                onClick={onClose}
                            >
                                Cancel backup process
                            </Button>
                        </Col>
                    </Buttons>
                </>
            )}

            {getCurrentState() === 'backup-progress' && <>{modal && modal}</>}
            {getCurrentState() === 'checkboxes-after' && (
                <>
                    <H2>Backup successfully created!</H2>
                    <StyledP>
                        Great! Now get out there and hide it properly. Here are some DOs and DON’Ts:
                    </StyledP>
                    <AfterBackupCheckboxes />
                    <Buttons>
                        <Col>
                            <StyledButton
                                isDisabled={
                                    !checkboxesAfter.every(e => backup.userConfirmed.includes(e))
                                }
                                onClick={onClose}
                                data-test="@backup/close-button"
                            >
                                Close
                            </StyledButton>
                        </Col>
                    </Buttons>
                </>
            )}
        </Wrapper>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Backup);
