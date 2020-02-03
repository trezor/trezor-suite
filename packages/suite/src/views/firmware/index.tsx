import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { Button, ButtonProps, H2, P, Link, colors } from '@trezor/components-v2';

import { resolveStaticPath } from '@suite-utils/nextjs';
import * as firmwareActions from '@firmware-actions/firmwareActions';
import * as routerActions from '@suite-actions/routerActions';
import { InjectedModalApplicationProps, Dispatch, AppState } from '@suite-types';
import { getFwVersion } from '@suite-utils/device';
import { ProgressBar } from '@suite-components';
import { InitImg, SuccessImg } from '@firmware-components';
import { Loaders } from '@onboarding-components';

const Wrapper = styled.div`
    width: 60vw;
    min-height: 500px;
    display: flex;
    flex-direction: column;
`;

// todo: aaarghhh this should be in some abstract modal container
const ProgressBarWrapper = styled.div`
    margin-bottom: 40px;
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

const SeedImg = styled.img`
    height: 250px;
    padding: 30px;
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

    const statesInProgessBar = [
        'initial',
        'check-seed',
        'waiting-for-bootloader',
        ['waiting-for-confirmation', 'installing', 'started', 'downloading'],
        ['done', 'partially-done', 'error'],
    ];

    const getTextForStatus = () => {
        switch (firmware.status) {
            case 'waiting-for-confirmation':
                return 'waiting for confirmation';
            case 'installing':
                return 'installing';
            case 'started':
                return 'started';
            case 'downloading':
                return 'downloading';
            default:
                throw new Error('this state does not have human readable variant');
        }
    };

    const getCurrentStep = () => {
        return statesInProgessBar.findIndex(s => {
            if (Array.isArray(s)) {
                return s.includes(firmware.status);
            }
            return s === firmware.status;
        });
    };

    // first of all, handle if there is error
    if (firmware.status === 'error') {
        return (
            <Wrapper>
                <H2>Holy guacamole! We got an error!</H2>
                <P size="tiny">{firmware.error}</P>
                <Buttons>
                    <Col>
                        <StyledButton onClick={onClose} data-test="@modal/firmware/exit-button">
                            Exit
                        </StyledButton>
                    </Col>
                </Buttons>
            </Wrapper>
        );
    }

    if (!device || !device.features) {
        return (
            <Wrapper>
                {firmware.status === 'waiting-for-bootloader' && (
                    <>
                        <ProgressBarWrapper>
                            <ProgressBar
                                total={statesInProgessBar.length}
                                current={getCurrentStep()}
                            />
                        </ProgressBarWrapper>
                        <H2>Reconnect your device in bootloader mode</H2>
                        <P size="tiny">Ok, now disconnect your device</P>
                        <InitImg />
                    </>
                )}
                {firmware.status !== 'waiting-for-bootloader' && (
                    <>
                        <H2>No device</H2>
                        <P size="tiny">No device connected :( </P>
                    </>
                )}
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
                <P size="tiny">
                    Great! Your firmware is up to date and no further action is needed. Check our
                    blog for updates or come here later.
                </P>
                <P size="normal" weight="bold">
                    version: {getFwVersion(device)}
                </P>
                <Link href="todo todo todo">Whats new</Link>
                <Buttons>
                    <Col>
                        <StyledButton onClick={onClose} data-test="@modal/firmware/exit-button">
                            Exit
                        </StyledButton>
                    </Col>
                </Buttons>
            </Wrapper>
        );
    }

    const { firmwareRelease } = device;

    return (
        <Wrapper>
            <ProgressBarWrapper>
                <ProgressBar total={statesInProgessBar.length} current={getCurrentStep()} />
            </ProgressBarWrapper>

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
                    <SeedImg
                        src={resolveStaticPath('images/onboarding/recover-from-seed.svg')}
                        alt=""
                    />
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

            {firmware.status === 'waiting-for-bootloader' && (
                <>
                    {device && device.mode !== 'bootloader' && (
                        <>
                            <H2>Connect your device in bootloader mode</H2>
                            <P size="tiny">
                                swipe your finger accross the touchscreen while connecting cable
                            </P>
                            <InitImg />
                        </>
                    )}
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
                    <H2>
                        {getTextForStatus()}
                        <Loaders.Dots />
                    </H2>
                </>
            )}

            {firmware.status === 'partially-done' && (
                <>
                    <H2>Firmware partially upgraded</H2>
                    <P>But there is still another upgrade ahead!</P>
                    <SuccessImg />

                    <Buttons>
                        <Col>
                            <StyledButton
                                onClick={() => resetReducer()}
                                data-test="@modal/firmware/reset-button"
                            >
                                Ok let's do it
                            </StyledButton>
                        </Col>
                    </Buttons>
                </>
            )}
        </Wrapper>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Firmware);
