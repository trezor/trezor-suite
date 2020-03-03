import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { Button, ButtonProps, H2, P, Link, colors, variables } from '@trezor/components';

import * as firmwareActions from '@firmware-actions/firmwareActions';
import * as routerActions from '@suite-actions/routerActions';
import { InjectedModalApplicationProps, Dispatch, AppState } from '@suite-types';
import { getFwVersion } from '@suite-utils/device';
import { ProgressBar } from '@suite-components';
import Image from '@suite-components/images/Image';
import ModalWrapper from '@suite-components/ModalWrapper';
import { InitImg, SuccessImg } from '@firmware-components';
import { Loaders } from '@onboarding-components';

import { CHANGELOG_URL } from '@suite-constants/urls';

const { FONT_SIZE, FONT_WEIGHT } = variables;

const Wrapper = styled(ModalWrapper)`
    min-height: 80vh;
    min-width: 60vw;
    max-width: 80vw;
    flex-direction: column;
    align-items: center;
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

const ChangesSummary = styled.div`
    background-color: ${colors.BLACK96};
    border: 1px solid ${colors.BLACK80};
    padding: 20px;
    max-width: 600px;
`;

// see here:
// https://github.com/styled-components/styled-components/issues/2473
const SeedImg = styled(props => <Image {...props} />)`
    height: 250px;
    padding: 30px;
`;

const FromVersionToVersion = styled.div`
    display: flex;
    justify-content: center;
    margin: 20px 0;
    font-size: ${FONT_SIZE.NORMAL};
`;

const FromVersion = styled.div`
    color: ${colors.BLACK50};
`;

const BetweenVersionArrow = styled.div`
    margin: 0 8px;
    color: ${colors.BLACK50};
`;

const ToVersion = styled.div`
    font-weight: ${FONT_WEIGHT.REGULAR};
    color: ${colors.BLACK0};
`;

const NewBadge = styled.div`
    height: 18px;
    font-size: 10px;
    font-weight: ${FONT_WEIGHT.DEMI_BOLD};
    color: ${colors.BLACK50};
    background-color: ${colors.BLACK92};
    border-radius: 3px;
    display: flex;
    align-items: center;
    padding: 2px 4px 0 4px;
    margin: 0 4px;
`;

const StyledP = styled(P)`
    color: ${colors.BLACK50};
    font-size: ${FONT_SIZE.SMALL};
    margin: 20px 0;
    max-width: 500px;
`;

const WhatsNewLink = styled(Link)`
    color: ${colors.BLACK50};
    font-size: ${FONT_SIZE.SMALL};
    font-weight: ${FONT_WEIGHT.MEDIUM};
    margin-top: 12px;
`;

const CloseButton = (props: ButtonProps) => (
    <StyledButton {...props} data-test="@firmware/close-button" variant="tertiary" icon="CROSS">
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
                <StyledP>{firmware.error}</StyledP>
                <Image image="UNI_ERROR" />
                <Buttons>
                    <Col>
                        <CloseButton onClick={onClose} />
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
                        <ProgressBar total={statesInProgessBar.length} current={getCurrentStep()} />
                        <H2>Reconnect your device in bootloader mode</H2>
                        <StyledP data-test="@firmware/connect-message">
                            swipe your finger accross the touchscreen while connecting cable
                        </StyledP>
                        <InitImg model={2} />
                    </>
                )}
                {firmware.status !== 'waiting-for-bootloader' && (
                    <>
                        <H2>No device</H2>
                        <StyledP>No device connected :( </StyledP>
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

    const model = device.features.major_version;

    if (!device.firmwareRelease) {
        return (
            <Wrapper>
                <H2>Firmware is up to date.</H2>
                <StyledP>
                    Great! Your firmware is up to date and no further action is needed. Check our
                    blog for updates or come here later.
                </StyledP>
                <P size="normal">version {getFwVersion(device)}</P>

                <WhatsNewLink href={CHANGELOG_URL}>What's new</WhatsNewLink>
                <Image image="UNI_SUCCESS" />
                <Buttons>
                    <Col>
                        <CloseButton onClick={onClose} />
                    </Col>
                </Buttons>
            </Wrapper>
        );
    }

    const { firmwareRelease } = device;

    return (
        <Wrapper>
            <ProgressBar total={statesInProgessBar.length} current={getCurrentStep()} />

            {firmware.status === 'initial' && (
                <>
                    <H2>Firmware update</H2>

                    {/* we can not show changelog if device is in bootloader mode */}
                    {device.mode === 'bootloader' && (
                        <>
                            <StyledP>
                                Your device is in bootloader mode. Reconnect it to normal mode to
                                continue.
                            </StyledP>
                            <Buttons>
                                <CloseButton onClick={onClose} />
                            </Buttons>
                        </>
                    )}
                    {device.mode !== 'bootloader' && (
                        <>
                            <StyledP>
                                To keep your Trezor up to date we recommend updating your device.
                                Check what’s new:
                            </StyledP>
                            <FromVersionToVersion>
                                <FromVersion>version {getFwVersion(device)}</FromVersion>
                                <BetweenVersionArrow>→</BetweenVersionArrow>
                                <ToVersion>version {firmwareRelease.version.join('.')}</ToVersion>
                                <NewBadge>NEW</NewBadge>
                            </FromVersionToVersion>
                            <ChangesSummary>
                                {device.firmwareRelease.changelog.split('*').map(r => (
                                    <P key={r} size="small">
                                        {r}
                                    </P>
                                ))}
                            </ChangesSummary>
                            <Buttons>
                                <Col>
                                    <StyledButton
                                        onClick={() => setStatus('check-seed')}
                                        data-test="@firmware/start-button"
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
                    <StyledP>
                        Before any further actions, please make sure that you have your recovery
                        seed. Either safely stored or even with you as of now. In any case of
                        improbable emergency.
                    </StyledP>
                    <SeedImg image="RECOVER_FROM_SEED" />
                    <Buttons>
                        <Col>
                            <StyledButton
                                onClick={() => setStatus('waiting-for-bootloader')}
                                data-test="@firmware/confirm-seed-button"
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
                            <StyledP data-test="@firmware/disconnect-message">
                                Ok, now disconnect your device
                            </StyledP>

                            <Image image="CONNECT_DEVICE" />
                            <Buttons>
                                <CloseButton onClick={onClose} />
                            </Buttons>
                        </>
                    )}
                    {device && device.mode === 'bootloader' && (
                        <>
                            <H2>Let's unleash the kraken</H2>
                            <InitImg model={model} />

                            <Buttons>
                                <Col>
                                    <StyledButton onClick={() => firmwareUpdate()}>
                                        Start
                                    </StyledButton>
                                    <CloseButton onClick={onClose} />
                                </Col>
                            </Buttons>
                        </>
                    )}
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
                    <InitImg model={model} />
                </>
            )}

            {firmware.status === 'partially-done' && (
                <>
                    <H2>Firmware partially upgraded</H2>
                    <StyledP>But there is still another upgrade ahead!</StyledP>
                    <SuccessImg model={model} />

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
