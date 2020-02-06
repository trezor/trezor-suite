import React from 'react';
import styled from 'styled-components';

import { OnboardingButton, Text, Wrapper } from '@onboarding-components';
import { Translation } from '@suite-components';
import messages from '@suite/support/messages';
import { resolveStaticPath } from '@suite-utils/nextjs';

import { Props } from './Container';

const StyledImg = styled.img`
    margin: 50px 0;
`;

const SkipStep = ({ closeModalApp, goToNextStep }: Props) => (
    <Wrapper.Step>
        <Wrapper.StepHeading>
            <Translation>{messages.TR_SKIP_ONBOARDING_HEADING}</Translation>
        </Wrapper.StepHeading>
        <Wrapper.StepBody>
            <Text>
                <Translation>{messages.TR_SKIP_ONBOARDING_TEXT}</Translation>
            </Text>
            <StyledImg src={resolveStaticPath('images/onboarding/skip-warning.svg')} alt="" />
        </Wrapper.StepBody>
        <Wrapper.Controls>
            <OnboardingButton.Cta data-test="@onboarding/button-skip" onClick={closeModalApp}>
                Skip onboarding
            </OnboardingButton.Cta>
        </Wrapper.Controls>
        <Wrapper.StepFooter>
            <OnboardingButton.Back onClick={() => goToNextStep('welcome')}>
                Back to onboarding
            </OnboardingButton.Back>
        </Wrapper.StepFooter>
    </Wrapper.Step>
);

export default SkipStep;
