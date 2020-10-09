import React from 'react';
import { UI } from 'trezor-connect';

import { Translation, Image } from '@suite-components';
import { Text, OnboardingButton, Wrapper } from '@onboarding-components';
import { Props } from './Container';

const SetPinStep = (props: Props) => {
    const { device } = props;

    if (!device || !device.features) {
        return null;
    }

    const getStatus = () => {
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
                {getStatus() === 'initial' && <Translation id="TR_PIN_HEADING_INITIAL" />}
                {getStatus() === 'first' && <Translation id="TR_PIN_HEADING_FIRST" />}
                {getStatus() === 'second' && <Translation id="TR_PIN_HEADING_REPEAT" />}
                {getStatus() === 'success' && <Translation id="TR_PIN_HEADING_SUCCESS" />}
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
                                <Translation id="TR_COMPLETE_SETUP" />
                            </OnboardingButton.Cta>
                        </Wrapper.Controls>
                    </>
                )}
            </Wrapper.StepBody>
            <Wrapper.StepFooter>
                {getStatus() !== 'success' && (
                    <OnboardingButton.Back
                        data-test="@onboarding/skip-button"
                        icon="CROSS"
                        onClick={() => props.goToNextStep()}
                    >
                        <Translation id="TR_SKIP" />
                    </OnboardingButton.Back>
                )}
            </Wrapper.StepFooter>
        </Wrapper.Step>
    );
};

export default SetPinStep;
