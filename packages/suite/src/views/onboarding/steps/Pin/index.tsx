/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import { UI } from 'trezor-connect';

import { Link } from '@trezor/components';
import { Translation, Image } from '@suite-components';

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
                {getStatus() === 'first' && <Translation id="TR_PIN_HEADING_FIRST" />}
                {getStatus() === 'second' && <Translation id="TR_PIN_HEADING_REPEAT" />}
                {getStatus() === 'success' && <Translation id="TR_PIN_HEADING_SUCCESS" />}
                {getStatus() === 'mismatch' && <Translation id="TR_PIN_HEADING_MISMATCH" />}
            </Wrapper.StepHeading>
            <Wrapper.StepBody>
                {getStatus() === 'initial' && (
                    <>
                        <Text>
                            <Translation id="TR_PIN_SUBHEADING" />
                        </Text>

                        <Image
                            image={device.features.major_version === 1 ? 'PIN_ASK_1' : 'PIN_ASK_2'}
                        />
                        <Wrapper.Controls>
                            <OnboardingButton.Cta
                                data-test="@onboarding/set-pin-button"
                                onClick={() => {
                                    props.changePin();
                                }}
                            >
                                <Translation id="TR_SET_PIN" />
                            </OnboardingButton.Cta>
                        </Wrapper.Controls>
                    </>
                )}

                {getStatus() === 'success' && (
                    <>
                        <Text>
                            <Translation id="TR_PIN_SET_SUCCESS" />
                        </Text>
                        <Image
                            image={
                                device.features.major_version === 1
                                    ? 'PIN_SUCCESS_1'
                                    : 'PIN_SUCCESS_2'
                            }
                        />
                        <Wrapper.Controls>
                            <OnboardingButton.Cta
                                data-test="@onboarding/pin/continue-button"
                                onClick={() => props.goToNextStep()}
                            >
                                <Translation id="TR_CONTINUE" />
                            </OnboardingButton.Cta>
                        </Wrapper.Controls>
                    </>
                )}

                {getStatus() === 'mismatch' && (
                    <>
                        <Text>
                            <Translation
                                id="TR_PIN_ERROR_TROUBLESHOOT"
                                values={{
                                    TR_DOCUMENTATION: (
                                        <Link href={URLS.PIN_MANUAL_URL}>
                                            <Translation id="TR_DOCUMENTATION" />
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
                                <Translation id="TR_START_AGAIN" />
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
                    <Translation id="TR_SKIP" />
                </OnboardingButton.Back>
            </Wrapper.StepFooter>
        </Wrapper.Step>
    );
};

export default SetPinStep;
