/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import { UI } from 'trezor-connect';

import { Link } from '@trezor/components';
import { resolveStaticPath } from '@suite-utils/nextjs';
import { Translation } from '@suite-components';
import messages from '@suite/support/messages';
import { URLS } from '@suite-constants';
import { Text, OnboardingButton, Wrapper } from '@onboarding-components';
import { Props } from './Container';

const SetPinStep = (props: Props) => {
    const { device, activeSubStep } = props;

    if (!device || !device.features) {
        return null;
    }

    const getStatus = () => {
        if (activeSubStep) {
            return activeSubStep;
        }
        // if (deviceCall.error === 'PIN mismatch') {
        //     return 'mismatch';
        // }
        if (device.buttonRequests.filter(b => b === UI.REQUEST_PIN).length === 1) {
            return 'first';
        }
        if (device.buttonRequests.filter(b => b === UI.REQUEST_PIN).length === 2) {
            return 'second';
        }
        if (device && device.features.pin_protection) {
            return 'success';
        }
        if (device && !device.features.pin_protection) {
            return 'initial';
        }

        // todo: what if device disconnects?
        return null;
    };

    return (
        <Wrapper.Step data-test="@onboarding/pin">
            <Wrapper.StepHeading>
                {getStatus() === 'initial' && 'PIN'}
                {getStatus() === 'first' && <Translation {...messages.TR_PIN_HEADING_FIRST} />}
                {getStatus() === 'second' && <Translation {...messages.TR_PIN_HEADING_REPEAT} />}
                {getStatus() === 'success' && <Translation {...messages.TR_PIN_HEADING_SUCCESS} />}
                {getStatus() === 'mismatch' && (
                    <Translation {...messages.TR_PIN_HEADING_MISMATCH} />
                )}
            </Wrapper.StepHeading>
            <Wrapper.StepBody>
                {getStatus() === 'initial' && (
                    <>
                        <Text>
                            <Translation {...messages.TR_PIN_SUBHEADING} />
                        </Text>
                        <img alt="" src={resolveStaticPath('images/onboarding/t-pin-ask.svg')} />
                        <Wrapper.Controls>
                            <OnboardingButton.Cta
                                data-test="@onboarding/set-pin-button"
                                onClick={() => {
                                    props.changePin();
                                }}
                            >
                                <Translation {...messages.TR_SET_PIN} />
                            </OnboardingButton.Cta>
                        </Wrapper.Controls>
                    </>
                )}

                {getStatus() === 'success' && (
                    <>
                        <Text>
                            <Translation {...messages.TR_PIN_SET_SUCCESS} />
                        </Text>
                        <img
                            alt=""
                            src={resolveStaticPath('images/onboarding/t-pin-success.svg')}
                        />
                        <Wrapper.Controls>
                            <OnboardingButton.Cta
                                data-test="@onboarding/pin/continue-button"
                                onClick={() => props.goToNextStep()}
                            >
                                <Translation {...messages.TR_CONTINUE} />
                            </OnboardingButton.Cta>
                        </Wrapper.Controls>
                    </>
                )}

                {getStatus() === 'mismatch' && (
                    <>
                        <Text>
                            <Translation
                                {...messages.TR_PIN_ERROR_TROUBLESHOOT}
                                values={{
                                    TR_DOCUMENTATION: (
                                        <Link href={URLS.PIN_MANUAL_URL}>
                                            <Translation {...messages.TR_DOCUMENTATION} />
                                        </Link>
                                    ),
                                }}
                            />
                        </Text>

                        <Wrapper.Controls>
                            <OnboardingButton.Cta
                                onClick={() => {
                                    props.changePin();
                                }}
                            >
                                <Translation {...messages.TR_START_AGAIN} />
                            </OnboardingButton.Cta>
                        </Wrapper.Controls>
                    </>
                )}
            </Wrapper.StepBody>
            <Wrapper.StepFooter>
                <OnboardingButton.Back
                    data-test="@onboarding/skip-button"
                    icon="CROSS"
                    onClick={() => props.goToNextStep()}
                >
                    <Translation {...messages.TR_SKIP} />
                </OnboardingButton.Back>
            </Wrapper.StepFooter>
        </Wrapper.Step>
    );
};

export default SetPinStep;
