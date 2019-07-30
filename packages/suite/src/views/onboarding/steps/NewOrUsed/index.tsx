import React from 'react';
// import { FormattedMessage } from 'react-intl';
import { H6 } from '@trezor/components';

import * as STEP from '@onboarding-constants/steps';
import Option from '@onboarding-components/Option';
import { ButtonBack, ButtonAlt, ButtonCta } from '@suite/components/onboarding/Buttons';
import Text from '@suite/components/onboarding/Text';
import { OnboardingReducer } from '@onboarding-types/onboarding';
import {
    StepWrapper,
    StepHeadingWrapper,
    StepBodyWrapper,
    StepFooterWrapper,
    ControlsWrapper,
    OptionsWrapper,
} from '@suite/components/onboarding/Wrapper';
import { goToNextStep, setPath, goToPreviousStep } from '@onboarding-actions/onboardingActions';

// import l10nMessages from './index.messages';

interface Props {
    path: OnboardingReducer['path'];
    onboardingActions: {
        goToPreviousStep: typeof goToPreviousStep;
        goToNextStep: typeof goToNextStep;
        setPath: typeof setPath;
    };
}

const NewOrUsedStep = (props: Props) => (
    <StepWrapper>
        <StepHeadingWrapper>Do you want to use new or used device?</StepHeadingWrapper>
        <Text>
            Trezor Wallet is your account within Trezor ecosystem. It allows you to easily manage
            your funds and initiate transfers.
        </Text>
        <StepBodyWrapper>
            <OptionsWrapper>
                <Option>
                    <H6>I have a new device</H6>
                    <Text>Sealed package that you just bought or received</Text>
                    <ButtonCta
                        data-test="button-new-device"
                        onClick={() => {
                            props.onboardingActions.setPath([...props.path, STEP.PATH_NEW]);
                            props.onboardingActions.goToNextStep();
                        }}
                    >
                        New device
                    </ButtonCta>
                </Option>

                <Option>
                    <H6>I have a used device</H6>
                    <Text>Unpacked device that has been already used before</Text>
                    <ButtonAlt
                        data-test="button-used-device"
                        onClick={() => {
                            props.onboardingActions.setPath([...props.path, STEP.PATH_USED]);
                            props.onboardingActions.goToNextStep();
                        }}
                    >
                        Used device
                    </ButtonAlt>
                </Option>
            </OptionsWrapper>
        </StepBodyWrapper>
        <StepFooterWrapper>
            <ControlsWrapper isVertical>
                <ButtonBack onClick={() => props.onboardingActions.goToPreviousStep()}>
                    Back
                </ButtonBack>
            </ControlsWrapper>
        </StepFooterWrapper>
    </StepWrapper>
);

export default NewOrUsedStep;
