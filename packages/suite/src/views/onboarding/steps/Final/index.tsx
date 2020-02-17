import React from 'react';

import { OnboardingButton, Wrapper } from '@onboarding-components';
import { Translation } from '@suite-components';
import messages from '@suite/support/messages';
import { resolveStaticPath } from '@suite-utils/nextjs';

import { Props } from './Container';

const FinalStep = ({ closeModalApp }: Props) => (
    <Wrapper.Step data-test="@onboarding/final">
        <Wrapper.StepHeading>
            <Translation>{messages.TR_FINAL_HEADING}</Translation>
        </Wrapper.StepHeading>
        <Wrapper.StepBody>
            <Translation>{messages.TR_FINAL_SUBHEADING}</Translation>
            <img src={resolveStaticPath('images/onboarding/all-done.svg')} alt="" />
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
