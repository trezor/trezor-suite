/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import styled from 'styled-components';
import { UI } from 'trezor-connect';
import { Link } from '@trezor/components';
// import { Link, Modal } from '@trezor/components';

import { FormattedMessage } from 'react-intl';

// import { resolveStaticPath } from '@suite-utils/nextjs';
import l10nCommonMessages from '@suite-support/Messages';
import { URLS } from '@suite-constants';
import { PinMatrix, Text, OnboardingButton, Wrapper } from '@onboarding-components';
import { Props } from './Container';

import l10nMessages from './index.messages';

const NewPinWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

// const HowToSetPinModal = styled.div`
//     display: flex;
//     flex-direction: column;
//     justify-content: space-around;
//     align-items: center;
//     height: 400px;
// `;

// const HowToSetPin = styled.img`
//     box-shadow: 0 4px 8px 0 grey;
//     max-width: 400px;
//     width: 80%;
//     object-fit: contain;
// `;

// interface SetPinState {
//     instructionsFocused: boolean;
// }

const SetPinStep = (props: Props) => {
    const { deviceCall, device, activeSubStep, uiInteraction } = props;

    if (!device || !device.features) {
        return null;
    }

    const getStatus = () => {
        if (activeSubStep) {
            return activeSubStep;
        }
        if (deviceCall.error === 'PIN mismatch') {
            return 'mismatch';
        }
        if (device && device.features.pin_protection && !deviceCall.isProgress) {
            return 'success';
        }
        if (device && !device.features.pin_protection && !deviceCall.isProgress) {
            return 'initial';
        }
        if (uiInteraction.counter === 0 && uiInteraction.name === UI.REQUEST_PIN) {
            return 'first';
        }
        if (uiInteraction.counter === 1 && uiInteraction.name === UI.REQUEST_PIN) {
            return 'second';
        }
        // todo: what if device disconnects?
        return null;
    };

    return (
        <Wrapper.Step>
            <Wrapper.StepHeading>
                {getStatus() === 'initial' && 'PIN'}
                {getStatus() === 'first' && (
                    <FormattedMessage {...l10nMessages.TR_PIN_HEADING_FIRST} />
                )}
                {getStatus() === 'second' && (
                    <FormattedMessage {...l10nMessages.TR_PIN_HEADING_REPEAT} />
                )}
                {getStatus() === 'success' && (
                    <FormattedMessage {...l10nMessages.TR_PIN_HEADING_SUCCESS} />
                )}
                {getStatus() === 'mismatch' && (
                    <FormattedMessage {...l10nMessages.TR_PIN_HEADING_MISMATCH} />
                )}
            </Wrapper.StepHeading>
            <Wrapper.StepBody>
                {getStatus() === 'initial' && (
                    <React.Fragment>
                        <Text>
                            <FormattedMessage {...l10nMessages.TR_PIN_SUBHEADING} />
                        </Text>
                        <Wrapper.Controls>
                            <OnboardingButton.Alt
                                onClick={() => props.onboardingActions.goToNextStep()}
                            >
                                <FormattedMessage {...l10nCommonMessages.TR_SKIP} />
                            </OnboardingButton.Alt>
                            <OnboardingButton.Cta
                                onClick={() => {
                                    props.connectActions.changePin();
                                }}
                            >
                                <FormattedMessage {...l10nMessages.TR_SET_PIN} />
                            </OnboardingButton.Cta>
                        </Wrapper.Controls>
                    </React.Fragment>
                )}

                {getStatus() === 'first' && (
                    <NewPinWrapper>
                        {/* <Link onClick={() =>  setState({ instructionsFocused: true })} variant="nostyle">
                                Click to see how pin works.
                            </Link> */}

                        {/* { state.instructionsFocused && (
                                <Modal>
                                    <HowToSetPinModal>
                                        <HowToSetPin
                                            src={resolveStaticPath('videos/onboarding/pin.gif')}
                                            alt="How to enter pin"
                                        />
                                        <Link
                                            onClick={() =>
                                                 setState({ instructionsFocused: false })
                                            }
                                            variant="nostyle"
                                        >
                                            Ok, I get it.
                                        </Link>
                                    </HowToSetPinModal>
                                </Modal>
                            )} */}
                        <div>
                            <PinMatrix
                                onPinSubmit={(pin: string) => {
                                    props.connectActions.submitNewPin({ pin });
                                }}
                            />
                        </div>
                    </NewPinWrapper>
                )}

                {getStatus() === 'second' && (
                    <React.Fragment>
                        <Text>
                            <FormattedMessage {...l10nMessages.TR_FIRST_PIN_ENTERED} />
                        </Text>
                        <PinMatrix
                            onPinSubmit={(pin: string) => {
                                props.connectActions.submitNewPin({ pin });
                            }}
                        />
                    </React.Fragment>
                )}

                {getStatus() === 'success' && (
                    <React.Fragment>
                        <Text>
                            <FormattedMessage {...l10nMessages.TR_PIN_SET_SUCCESS} />
                        </Text>
                        <Wrapper.Controls>
                            <OnboardingButton.Cta
                                onClick={() => props.onboardingActions.goToNextStep()}
                            >
                                <FormattedMessage {...l10nCommonMessages.TR_CONTINUE} />
                            </OnboardingButton.Cta>
                        </Wrapper.Controls>
                    </React.Fragment>
                )}

                {getStatus() === 'mismatch' && (
                    <React.Fragment>
                        <Text>
                            <FormattedMessage
                                {...l10nMessages.TR_PIN_ERROR_TROUBLESHOOT}
                                values={{
                                    TR_DOCUMENTATION: (
                                        <Link href={URLS.PIN_MANUAL_URL} variant="nostyle">
                                            <FormattedMessage {...l10nMessages.TR_DOCUMENTATION} />
                                        </Link>
                                    ),
                                }}
                            />
                        </Text>

                        <Wrapper.Controls>
                            <OnboardingButton.Cta
                                onClick={() => {
                                    props.connectActions.changePin();
                                }}
                            >
                                <FormattedMessage {...l10nMessages.TR_START_AGAIN} />
                            </OnboardingButton.Cta>
                        </Wrapper.Controls>
                    </React.Fragment>
                )}
            </Wrapper.StepBody>
        </Wrapper.Step>
    );
};

export default SetPinStep;
