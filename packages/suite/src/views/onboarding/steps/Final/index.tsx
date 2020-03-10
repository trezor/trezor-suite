import React from 'react';

import { OnboardingButton, Wrapper } from '@onboarding-components';
import { Translation, Image } from '@suite-components';

import { Props } from './Container';

const FinalStep = ({ closeModalApp }: Props) => (
    <Wrapper.Step data-test="@onboarding/final">
        <Wrapper.StepHeading>
            <Translation id="TR_FINAL_HEADING" />
        </Wrapper.StepHeading>
        <Wrapper.StepBody>
            <Translation id="TR_FINAL_SUBHEADING" />
            <Image image="ALL_DONE" />
        </Wrapper.StepBody>
        <Wrapper.Controls>
            <OnboardingButton.Cta
                data-test="@onboarding/exit-app-button"
                onClick={() => closeModalApp()}
            >
                Go to Suite
            </OnboardingButton.Cta>
        </Wrapper.Controls>
    </Wrapper.Step>
);

export default FinalStep;
