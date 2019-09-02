/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import styled from 'styled-components';
import { Link, Modal } from '@trezor/components';
import { FormattedMessage } from 'react-intl';

import { resolveStaticPath } from '@suite-utils/nextjs';
import l10nCommonMessages from '@suite-support/Messages';
import { PIN_MANUAL_URL } from '@onboarding-constants/urls';
import { PinMatrix, Text, OnboardingButton, Wrapper } from '@onboarding-components';
import { Props } from './Container';

import l10nMessages from './index.messages';

const NewPinWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
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

interface SetPinState {
    instructionsFocused: boolean;
}

class SetPinStep extends React.Component<Props> {
    state: SetPinState = {
        instructionsFocused: false,
    };

    getStatus() {
        const { deviceCall, device, activeSubStep } = this.props;
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
        if (device.isRequestingPin === 1) {
            return 'first';
        }
        if (device.isRequestingPin === 2) {
            return 'second';
        }
        // todo: what if device disconnects?
        return null;
    }

    render() {
        return (
            <Wrapper.Step>
                <Wrapper.StepHeading>
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
                </Wrapper.StepHeading>
                <Wrapper.StepBody>
                    {this.getStatus() === 'initial' && (
                        <React.Fragment>
                            <Text>
                                <FormattedMessage {...l10nMessages.TR_PIN_SUBHEADING} />
                            </Text>
                            <Wrapper.Controls>
                                <OnboardingButton.Alt
                                    onClick={() => this.props.onboardingActions.goToNextStep()}
                                >
                                    <FormattedMessage {...l10nCommonMessages.TR_SKIP} />
                                </OnboardingButton.Alt>
                                <OnboardingButton.Cta
                                    onClick={() => {
                                        this.props.connectActions.changePin();
                                    }}
                                >
                                    <FormattedMessage {...l10nMessages.TR_SET_PIN} />
                                </OnboardingButton.Cta>
                            </Wrapper.Controls>
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
                                        <HowToSetPin
                                            src={resolveStaticPath('videos/onboarding/pin.gif')}
                                            alt="How to enter pin"
                                        />
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
                            <Wrapper.Controls>
                                <OnboardingButton.Cta
                                    onClick={() => this.props.onboardingActions.goToNextStep()}
                                >
                                    <FormattedMessage {...l10nCommonMessages.TR_CONTINUE} />
                                </OnboardingButton.Cta>
                            </Wrapper.Controls>
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

                            <Wrapper.Controls>
                                <OnboardingButton.Cta
                                    onClick={() => {
                                        this.props.connectActions.changePin();
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
    }
}

export default SetPinStep;
