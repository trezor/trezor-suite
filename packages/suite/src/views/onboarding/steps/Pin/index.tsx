/* eslint-disable jsx-a11y/anchor-is-valid */

import React from 'react';
import styled from 'styled-components';
import { UI } from 'trezor-connect';
import { Button, Link, Modal } from '@trezor/components';
import { FormattedMessage } from 'react-intl';

import { PIN_MANUAL_URL } from '@suite/config/onboarding/urls';
import * as BREAKPOINTS from '@suite/config/onboarding/breakpoints';
import l10nCommonMessages from '@suite/support/commonMessages';
import PinMatrix from '@suite/components/onboarding/PinMatrix';
import Text from '@suite/components/onboarding/Text';
import {
    StepWrapper,
    StepBodyWrapper,
    StepHeadingWrapper,
    ControlsWrapper,
} from '@suite/components/onboarding/Wrapper';

import { OnboardingReducer, OnboardingActions } from '@suite/types/onboarding/onboarding';
import { ConnectReducer, ConnectActions } from '@suite/types/onboarding/connect';

import l10nMessages from './index.messages';
import HowToSetPinGif from './videos/pin.gif';

const NewPinWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;

    /* @media only screen and (min-width: ${BREAKPOINTS.SM}px) { 
        flex-direction: row; 
    }  */
`;

const HowToSetPinModal = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
    height: 400px;
`;

const HowToSetPin = styled.img`
    box-shadow: 0 4px 8px 0 grey;
    max-width: 400px;
    width: 80%;
    object-fit: contain;
`;

interface Props {
    deviceCall: ConnectReducer['deviceCall'];
    uiInteraction: ConnectReducer['uiInteraction'];
    device: ConnectReducer['device'];
    activeSubStep: OnboardingReducer['activeSubStep'];
    connectActions: ConnectActions;
    onboardingActions: OnboardingActions;
}

interface State {
    instructionsFocused: boolean;
}

class SetPinStep extends React.Component<Props> {
    state: State = {
        instructionsFocused: false,
    };

    getStatus() {
        const { deviceCall, uiInteraction, device, activeSubStep } = this.props;
        if (activeSubStep) {
            return activeSubStep;
        }
        if (deviceCall.error === 'PIN mismatch') {
            return 'mismatch';
        }
        if (uiInteraction.name === UI.REQUEST_PIN && uiInteraction.counter === 1) {
            return 'first';
        }
        if (uiInteraction.name === UI.REQUEST_PIN && uiInteraction.counter === 2) {
            return 'second';
        }
        if (device && device.features.pin_protection && !deviceCall.isProgress) {
            return 'success';
        }
        if (device && !device.features.pin_protection && !deviceCall.isProgress) {
            return 'initial';
        }
        // todo: what if device disconnects?
        return null;
    }

    render() {
        return (
            <StepWrapper>
                <StepHeadingWrapper>
                    {this.getStatus() === 'initial' && 'PIN'}
                    {this.getStatus() === 'first' && (
                        <FormattedMessage {...l10nMessages.TR_PIN_HEADING_FIRST} />
                    )}
                    {this.getStatus() === 'second' && (
                        <FormattedMessage {...l10nMessages.TR_PIN_HEADING_REPEAT} />
                    )}
                    {this.getStatus() === 'success' && (
                        <FormattedMessage {...l10nMessages.TR_PIN_HEADING_SUCCESS} />
                    )}
                    {this.getStatus() === 'mismatch' && (
                        <FormattedMessage {...l10nMessages.TR_PIN_HEADING_MISMATCH} />
                    )}
                </StepHeadingWrapper>
                <StepBodyWrapper>
                    {this.getStatus() === 'initial' && (
                        <React.Fragment>
                            <Text>
                                <FormattedMessage {...l10nMessages.TR_PIN_SUBHEADING} />
                            </Text>
                            <ControlsWrapper>
                                <Button
                                    isWhite
                                    onClick={() => this.props.onboardingActions.goToNextStep()}
                                >
                                    <FormattedMessage {...l10nCommonMessages.TR_SKIP} />
                                </Button>
                                <Button
                                    onClick={() => {
                                        this.props.connectActions.changePin();
                                    }}
                                >
                                    <FormattedMessage {...l10nMessages.TR_SET_PIN} />
                                </Button>
                            </ControlsWrapper>
                        </React.Fragment>
                    )}

                    {this.getStatus() === 'first' && (
                        <NewPinWrapper>
                            <Link onClick={() => this.setState({ instructionsFocused: true })}>
                                Click to see how pin works.
                            </Link>

                            {this.state.instructionsFocused && (
                                <Modal>
                                    <HowToSetPinModal>
                                        <HowToSetPin src={HowToSetPinGif} alt="How to enter pin" />
                                        <Link
                                            onClick={() =>
                                                this.setState({ instructionsFocused: false })
                                            }
                                        >
                                            Ok, I get it.
                                        </Link>
                                    </HowToSetPinModal>
                                </Modal>
                            )}
                            <div>
                                <PinMatrix
                                    onPinSubmit={(pin: string) => {
                                        this.props.connectActions.submitNewPin({ pin });
                                    }}
                                />
                            </div>
                        </NewPinWrapper>
                    )}

                    {this.getStatus() === 'second' && (
                        <React.Fragment>
                            <Text>
                                <FormattedMessage {...l10nMessages.TR_FIRST_PIN_ENTERED} />
                            </Text>
                            <PinMatrix
                                onPinSubmit={(pin: string) => {
                                    this.props.connectActions.submitNewPin({ pin });
                                }}
                            />
                        </React.Fragment>
                    )}

                    {this.getStatus() === 'success' && (
                        <React.Fragment>
                            <Text>
                                <FormattedMessage {...l10nMessages.TR_PIN_SET_SUCCESS} />
                            </Text>
                            <ControlsWrapper>
                                <Button onClick={() => this.props.onboardingActions.goToNextStep()}>
                                    <FormattedMessage {...l10nCommonMessages.TR_CONTINUE} />
                                </Button>
                            </ControlsWrapper>
                        </React.Fragment>
                    )}

                    {this.getStatus() === 'mismatch' && (
                        <React.Fragment>
                            <Text>
                                <FormattedMessage
                                    {...l10nMessages.TR_PIN_ERROR_TROUBLESHOOT}
                                    values={{
                                        TR_DOCUMENTATION: (
                                            <Link href={PIN_MANUAL_URL}>
                                                <FormattedMessage
                                                    {...l10nMessages.TR_DOCUMENTATION}
                                                />
                                            </Link>
                                        ),
                                    }}
                                />
                            </Text>

                            <ControlsWrapper>
                                <Button
                                    onClick={() => {
                                        this.props.connectActions.changePin();
                                    }}
                                >
                                    <FormattedMessage {...l10nMessages.TR_START_AGAIN} />
                                </Button>
                            </ControlsWrapper>
                        </React.Fragment>
                    )}
                </StepBodyWrapper>
            </StepWrapper>
        );
    }
}

export default SetPinStep;
