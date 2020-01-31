import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { Button, ButtonProps, H2, P, colors } from '@trezor/components-v2';

import * as firmwareActions from '@firmware-actions/firmwareActions';
import * as routerActions from '@suite-actions/routerActions';
import { InjectedModalApplicationProps, Dispatch, AppState } from '@suite-types';
import { getFwVersion } from '@suite-utils/device';
import { ProgressBar } from '@suite-components';
import { InitImg, SuccessImg } from '@firmware-components';

const Wrapper = styled.div`
    width: 60vw;
    min-height: 500px;
    display: flex;
    justify-content: space-between;
    flex-direction: column;
    padding: 60px;
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
`;

const ChangesSummary = styled.div`
    background-color: ${colors.BLACK96};
    border: 1px solid ${colors.BLACK80};
    margin: 34px 0;
    padding: 20px;
    max-width: 600px;
`;

const StyledButton = styled(Button)`
    width: 226px;
    margin-bottom: 16px;
`;

const CloseButton = (props: ButtonProps) => (
    <StyledButton
        {...props}
        data-test="@modal/firmware/exit-button"
        variant="tertiary"
        icon="CROSS"
    >
        Exit
    </StyledButton>
);

const mapStateToProps = (state: AppState) => ({
    firmware: state.firmware,
    device: state.suite.device,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    closeModalApp: bindActionCreators(routerActions.closeModalApp, dispatch),
    firmwareUpdate: bindActionCreators(firmwareActions.firmwareUpdate, dispatch),
    resetReducer: bindActionCreators(firmwareActions.resetReducer, dispatch),
    setStatus: bindActionCreators(firmwareActions.setStatus, dispatch),
});

type Props = ReturnType<typeof mapDispatchToProps> &
    ReturnType<typeof mapStateToProps> &
    InjectedModalApplicationProps;

const Firmware = ({
    closeModalApp,
    firmwareUpdate,
    resetReducer,
    firmware,
    device,
    setStatus,
}: Props) => {
    const onClose = () => {
        closeModalApp();
        resetReducer();
    };

    if (!device || !device.features) {
        return (
            <Wrapper>
                <H2>No device</H2>
                <Buttons>
                    <Col>
                        <CloseButton onClick={onClose} />
                    </Col>
                </Buttons>
            </Wrapper>
        );
    }

    if (!device.firmwareRelease) {
        return (
            <Wrapper>
                <H2>Firmware is up to date.</H2>
                <Buttons>
                    <Col>
                        <CloseButton onClick={onClose} />
                    </Col>
                </Buttons>
            </Wrapper>
        );
    }

    const { firmwareRelease } = device;

    const statesInProgessBar = [
        'initial',
        'check-seed',
        'waiting-for-bootloader',
        ['waiting-for-confirmation', 'installing', 'started', 'downloading'],
        ['done', 'partially-done', 'error'],
    ];

    const getCurrentStep = () => {
        return statesInProgessBar.findIndex(s => {
            if (Array.isArray(s)) {
                return s.includes(firmware.status);
            }
            return s === firmware.status;
        });
    };

    return (
        <Wrapper>
            <ProgressBar total={statesInProgessBar.length} current={getCurrentStep()} />

            {firmware.status === 'initial' && (
                <>
                    <H2>Firmware update</H2>

                    {/* we can not show changelog if device is in bootloader mode */}
                    {device.mode === 'bootloader' && (
                        <>
                            <P size="tiny">
                                Your device is in bootloader mode. Reconnect it to normal mode to
                                continue.
                            </P>
                            <Buttons>
                                <Col>
                                    <CloseButton onClick={onClose} />
                                </Col>
                            </Buttons>
                        </>
                    )}
                    {device.mode !== 'bootloader' && (
                        <>
                            <P size="tiny">
                                To keep your Trezor up to date we recommend updating your device.
                                Check what’s new:
                            </P>
                            {getFwVersion(device)} -> {firmwareRelease.version.join('.')}
                            <ChangesSummary>
                                {device.firmwareRelease.changelog.split('*').map(r => (
                                    <P key={r} size="tiny">
                                        {r}
                                    </P>
                                ))}
                            </ChangesSummary>
                            <Buttons>
                                <Col>
                                    <StyledButton
                                        onClick={() => setStatus('check-seed')}
                                        data-test="@modal/firmware/start-button"
                                    >
                                        Start
                                    </StyledButton>
                                    <CloseButton onClick={onClose} />
                                </Col>
                            </Buttons>
                        </>
                    )}
                </>
            )}

            {firmware.status === 'check-seed' && (
                <>
                    <H2>Security checkpoint - got a seed?</H2>
                    <P size="tiny">
                        Before any further actions, please make sure that you have your recovery
                        seed. Either safely stored or even with you as of now. In any case of
                        improbable emergency.
                    </P>
                    <Buttons>
                        <Col>
                            <StyledButton
                                onClick={() => setStatus('waiting-for-bootloader')}
                                data-test="@modal/firmware/start-button"
                            >
                                Start
                            </StyledButton>
                            <CloseButton onClick={onClose} />
                        </Col>
                    </Buttons>
                </>
            )}

            {firmware.status === 'waiting-for-bootloader' &&
                device &&
                device.mode !== 'bootloader' && (
                    <>
                        <P size="tiny">waiting for bootloader</P>
                        <InitImg />
                    </>
                )}

            {firmware.status === 'waiting-for-bootloader' &&
                device &&
                device.mode === 'bootloader' && (
                    <>
                        <H2>Let's unleash the kraken</H2>
                        <InitImg />

                        <Buttons>
                            <Col>
                                <StyledButton
                                    onClick={() => firmwareUpdate()}
                                    data-test="@modal/firmware/start-button"
                                >
                                    Start
                                </StyledButton>
                                <CloseButton onClick={onClose} />
                            </Col>
                        </Buttons>
                    </>
                )}

            {['waiting-for-confirmation', 'installing', 'started', 'downloading'].includes(
                firmware.status,
            ) && (
                <>
                    <H2>{firmware.status}</H2>
                </>
            )}

            {['done', 'partially-done'].includes(firmware.status) && (
                <>
                    <H2>{firmware.status}</H2>
                    <SuccessImg />

                    <Buttons>
                        <Col>
                            <StyledButton
                                onClick={() => closeModalApp()}
                                data-test="@modal/firmware/start-button"
                            >
                                Finish
                            </StyledButton>
                        </Col>
                    </Buttons>
                </>
            )}
        </Wrapper>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Firmware);
