import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { Button, ButtonProps, H2, P, Link, colors, variables } from '@trezor/components';

import * as firmwareActions from '@firmware-actions/firmwareActions';
import * as routerActions from '@suite-actions/routerActions';
import { InjectedModalApplicationProps, Dispatch, AppState } from '@suite-types';
import { getFwVersion } from '@suite-utils/device';
import { ProgressBar, Translation } from '@suite-components';
import Image from '@suite-components/images/Image';
import ModalWrapper from '@suite-components/ModalWrapper';
import { InitImg, SuccessImg } from '@firmware-components';
import { Loaders } from '@onboarding-components';
import { CHANGELOG_URL } from '@suite-constants/urls';

const { FONT_SIZE, FONT_WEIGHT } = variables;

const Wrapper = styled(ModalWrapper)`
    width: 88vw;
    height: 90vh;
    align-items: center;
    min-height: 560px;
    flex-direction: column;

    @media only screen and (min-width: ${variables.SCREEN_SIZE.SM}) {
        max-width: 680px;
        min-width: 580px;
        height: auto;
    }
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
    margin: 20px;
    max-width: 600px;
    max-height: 300px;
    overflow-y: auto;
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

const Badge = styled.div`
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

const StyledImage = styled(Image)`
    flex: 1;
`;

const StyledH2 = styled(H2)`
    ::first-letter {
        text-transform: capitalize;
    }
`;

const CloseButton = (props: ButtonProps) => (
    <StyledButton {...props} data-test="@firmware/close-button" variant="tertiary" icon="CROSS">
        <Translation id="TR_CLOSE" />
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
    toggleBtcOnly: bindActionCreators(firmwareActions.toggleBtcOnly, dispatch),
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
    toggleBtcOnly,
}: Props) => {
    const onClose = () => {
        closeModalApp();
        resetReducer();
    };

    const btcOnlyAvailable = device?.features && device.firmwareRelease.release.url_bitcoinonly;

    const statesInProgressBar = [
        'initial',
        'check-seed',
        'waiting-for-bootloader',
        ['waiting-for-confirmation', 'installing', 'started', 'downloading'],
        ['wait-for-reboot', 'unplug'],
        ['done', 'partially-done', 'error'],
    ];

    const getTextForStatus = () => {
        switch (firmware.status) {
            case 'waiting-for-confirmation':
                return 'TR_WAITING_FOR_CONFIRMATION';
            case 'installing':
                return 'TR_INSTALLING';
            case 'started':
                return 'TR_STARTED';
            case 'downloading':
                return 'TR_DOWNLOADING';
            case 'wait-for-reboot':
                return 'TR_WAIT_FOR_REBOOT';
            case 'unplug':
                return 'TR_DISCONNECT_YOUR_DEVICE';
            default:
                throw new Error('this state does not have human readable variant');
        }
    };

    const getCurrentStepIndex = () => {
        return statesInProgressBar.findIndex(s => {
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
                <StyledH2>
                    <Translation id="TR_FIRMWARE_INSTALL_FAILED_HEADER" />
                </StyledH2>
                <StyledP>{firmware.error}</StyledP>
                <StyledImage image="UNI_ERROR" />
                <Buttons>
                    <Col>
                        <CloseButton onClick={onClose} />
                    </Col>
                </Buttons>
            </Wrapper>
        );
    }

    if (!device || !device.features || !device?.connected) {
        return (
            <Wrapper>
                {firmware.status === 'waiting-for-bootloader' && (
                    <>
                        <ProgressBar
                            total={statesInProgressBar.length}
                            current={getCurrentStepIndex() + 1}
                        />
                        <StyledH2>
                            <Translation id="TR_RECONNECT_IN_BOOTLOADER" />
                        </StyledH2>
                        <StyledP data-test="@firmware/connect-message">
                            <Translation id="TR_SWIPE_YOUR_FINGERS" />
                        </StyledP>
                        <InitImg model={2} />
                    </>
                )}
                {firmware.status !== 'waiting-for-bootloader' && (
                    <>
                        <StyledH2>
                            <Translation id="TR_NO_DEVICE" />
                        </StyledH2>
                        <StyledP>
                            <Translation id="TR_NO_DEVICE_CONNECTED" />
                        </StyledP>
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
                <StyledH2>
                    <Translation id="TR_FIRMWARE_IS_UP_TO_DATE" />
                </StyledH2>
                <StyledP>
                    <Translation id="TR_FIRMWARE_INSTALLED_TEXT" />
                </StyledP>
                <P size="normal">
                    <Translation
                        id="TR_YOUR_CURRENT_FIRMWARE"
                        values={{ version: getFwVersion(device) }}
                    />
                </P>

                <WhatsNewLink href={CHANGELOG_URL}>
                    <Translation id="TR_WHATS_NEW" />
                </WhatsNewLink>
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
            <ProgressBar total={statesInProgressBar.length} current={getCurrentStepIndex() + 1} />

            {firmware.status === 'initial' && (
                <>
                    <StyledH2 tabIndex={0}>
                        <Translation id="TR_FIRMWARE_HEADING" />
                    </StyledH2>

                    {/* we can not show changelog if device is in bootloader mode */}
                    {device.mode === 'bootloader' && (
                        <>
                            <StyledP>
                                <Translation id="TR_CONNECTED_DEVICE_IS_IN_BOOTLOADER" />
                            </StyledP>
                            <Buttons>
                                <CloseButton onClick={onClose} />
                            </Buttons>
                        </>
                    )}
                    {device.mode !== 'bootloader' && (
                        <>
                            <StyledP>
                                <Translation id="TR_TO_KEEP_YOUR_TREZOR" />
                            </StyledP>
                            <FromVersionToVersion>
                                <FromVersion>
                                    <Translation id="TR_VERSION" /> {getFwVersion(device)}
                                </FromVersion>
                                <BetweenVersionArrow>→</BetweenVersionArrow>
                                <ToVersion>
                                    <Translation id="TR_VERSION" />{' '}
                                    {firmwareRelease.release.version.join('.')}
                                </ToVersion>
                                <Badge>
                                    <Translation id="TR_NEW_LABEL" />
                                </Badge>
                                {firmware.btcOnly && (
                                    <Badge>
                                        <Translation id="TR_BTC_ONLY_LABEL" />
                                    </Badge>
                                )}
                            </FromVersionToVersion>

                            {device.firmwareRelease.changelog?.length > 0 && (
                                <ChangesSummary>
                                    {device.firmwareRelease.changelog.map((c: any) => (
                                        <div key={c.url}>
                                            <P>{c.version.join('.')}</P>
                                            <P size="small">{c.changelog}</P>
                                        </div>
                                    ))}
                                </ChangesSummary>
                            )}

                            {btcOnlyAvailable && !firmware.btcOnly && (
                                <StyledP>
                                    <Translation
                                        id="TR_ALTERNATIVELY_YOU_MAY_INSTALL"
                                        values={{
                                            TR_FIRMWARE_TYPE: (
                                                <WhatsNewLink onClick={toggleBtcOnly}>
                                                    <Translation id="TR_FIRMWARE_TYPE_BTC_ONLY" />
                                                </WhatsNewLink>
                                            ),
                                        }}
                                    />
                                </StyledP>
                            )}

                            {btcOnlyAvailable && firmware.btcOnly && (
                                <StyledP>
                                    <Translation
                                        id="TR_ALTERNATIVELY_YOU_MAY_INSTALL"
                                        values={{
                                            TR_FIRMWARE_TYPE: (
                                                <WhatsNewLink onClick={toggleBtcOnly}>
                                                    <Translation id="TR_FIRMWARE_TYPE_FULL" />
                                                </WhatsNewLink>
                                            ),
                                        }}
                                    />
                                </StyledP>
                            )}

                            <Buttons>
                                <Col>
                                    <StyledButton
                                        onClick={() => setStatus('check-seed')}
                                        data-test="@firmware/start-button"
                                    >
                                        <Translation id="TR_START" />
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
                    <StyledH2>
                        <Translation id="TR_SECURITY_CHECKPOINT_GOT_SEED" />
                    </StyledH2>
                    <StyledP>
                        <Translation id="TR_BEFORE_ANY_FURTHER_ACTIONS" />
                    </StyledP>
                    <SeedImg image="RECOVER_FROM_SEED" />
                    <Buttons>
                        <Col>
                            <StyledButton
                                onClick={() => setStatus('waiting-for-bootloader')}
                                data-test="@firmware/confirm-seed-button"
                            >
                                <Translation id="TR_START" />
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
                            <StyledH2>
                                <Translation id="TR_RECONNECT_IN_BOOTLOADER" />
                            </StyledH2>
                            <StyledP data-test="@firmware/disconnect-message">
                                <Translation id="TR_DISCONNECT_YOUR_DEVICE" />
                            </StyledP>

                            <Image image="CONNECT_DEVICE" />
                            <Buttons>
                                <CloseButton onClick={onClose} />
                            </Buttons>
                        </>
                    )}
                    {device && device.mode === 'bootloader' && (
                        <>
                            <StyledH2>
                                <Translation id="TR_FIRMWARE_BOOTLOADER_TITLE" />
                            </StyledH2>
                            <InitImg model={model} />

                            <Buttons>
                                <Col>
                                    <StyledButton onClick={() => firmwareUpdate()}>
                                        <Translation id="TR_START" />
                                    </StyledButton>
                                    <CloseButton onClick={onClose} />
                                </Col>
                            </Buttons>
                        </>
                    )}
                </>
            )}

            {[
                'waiting-for-confirmation',
                'installing',
                'started',
                'downloading',
                'wait-for-reboot',
                'unplug',
            ].includes(firmware.status) && (
                <>
                    <StyledH2>
                        <Translation id={getTextForStatus()} />
                        <Loaders.Dots />
                    </StyledH2>
                    <InitImg model={model} />
                </>
            )}

            {firmware.status === 'partially-done' && (
                <>
                    <StyledH2>
                        <Translation id="TR_FIRMWARE_PARTIALLY_UPDATED" />
                    </StyledH2>
                    <StyledP>
                        <Translation id="TR_BUT_THERE_IS_ANOTHER_UPDATE" />
                    </StyledP>
                    <SuccessImg model={model} />

                    <Buttons>
                        <Col>
                            <StyledButton
                                onClick={() => resetReducer()}
                                data-test="@modal/firmware/reset-button"
                            >
                                <Translation id="TR_START" />
                            </StyledButton>
                        </Col>
                    </Buttons>
                </>
            )}
            {firmware.status === 'done' && (
                <>
                    <StyledH2>
                        <Translation id="TR_SUCCESS" />
                    </StyledH2>
                    <SuccessImg model={model} />

                    <Buttons>
                        <Col>
                            <StyledButton onClick={onClose}>
                                <Translation id="TR_CONTINUE" />
                            </StyledButton>
                        </Col>
                    </Buttons>
                </>
            )}
        </Wrapper>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Firmware);
