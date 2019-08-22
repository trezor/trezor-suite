import React from 'react';
// import { FormattedMessage } from 'react-intl';
import { H6 } from '@trezor/components';

import * as STEP from '@onboarding-constants/steps';
import { OnboardingReducer } from '@onboarding-types/onboarding';
import { goToNextStep, addPath, goToPreviousStep } from '@onboarding-actions/onboardingActions';
import { Wrapper, Text, Option, OnboardingButton } from '@onboarding-components';

// import l10nMessages from './index.messages';

interface Props {
    path: OnboardingReducer['path'];
    onboardingActions: {
        goToPreviousStep: typeof goToPreviousStep;
        goToNextStep: typeof goToNextStep;
        addPath: typeof addPath;
    };
}

const NewOrUsedStep = (props: Props) => (
    <Wrapper.Step>
        <Wrapper.StepHeading>Do you want to use new or used device?</Wrapper.StepHeading>
        <Text>
            Trezor Wallet is your account within Trezor ecosystem. It allows you to easily manage
            your funds and initiate transfers.
        </Text>
        <Wrapper.StepBody>
            <Wrapper.Options>
                <Option>
                    <H6>I have a new device</H6>
                    <Text>Sealed package that you just bought or received</Text>
                    <OnboardingButton.Cta
                        data-test="button-new-path"
                        onClick={() => {
                            props.onboardingActions.addPath(STEP.PATH_NEW);
                            props.onboardingActions.goToNextStep();
                        }}
                    >
                        New device
                    </OnboardingButton.Cta>
                </Option>

                <Option>
                    <H6>I have a used device</H6>
                    <Text>Unpacked device that has been already used before</Text>
                    <OnboardingButton.Alt
                        data-test="button-used-path"
                        onClick={() => {
                            props.onboardingActions.addPath(STEP.PATH_USED);
                            props.onboardingActions.goToNextStep();
                        }}
                    >
                        Used device
                    </OnboardingButton.Alt>
                </Option>
            </Wrapper.Options>
        </Wrapper.StepBody>
        <Wrapper.StepFooter>
            <Wrapper.Controls isVertical>
                <OnboardingButton.Back
                    onClick={() => {
                        props.onboardingActions.goToPreviousStep();
                    }}
                >
                    Back
                </OnboardingButton.Back>
            </Wrapper.Controls>
        </Wrapper.StepFooter>
    </Wrapper.Step>
);

export default NewOrUsedStep;
